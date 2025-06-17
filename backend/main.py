from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json
import os
import asyncio
from typing import AsyncGenerator, Optional, List
from datetime import datetime

try:
    import openai
except ImportError:
    openai = None  # Will raise later if missing

from .auth import router as auth_router, get_current_user
from .database import engine, get_db, AsyncSessionLocal
from .models import Base, ChatMessage, User, ChatSession
from .schemas import ChatSessionCreate, ChatSessionOut, ChatMessageOut

app = FastAPI(title="EchoTalkFlow Backend", version="0.1.0")

# Allow front-end dev server (vite) during local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # Initialize database tables
# @app.on_event("startup")
# async def init_db():
#     async with engine.begin() as conn:
#         # Drop all tables and recreate them to handle schema changes
#         await conn.run_sync(Base.metadata.drop_all)
#         await conn.run_sync(Base.metadata.create_all)
#     print("Database tables recreated successfully!")

# --- API KEYS --------------------------------------------------------------
# Static backend-side keys.  DO NOT commit real keys – put them in env vars.
OPENAI_API_KEY = "THE_KEY"
DEEPSEEK_API_KEY = "THE_KEY"

# Cheapest default models
CHEAP_CHATGPT_MODEL = "gpt-3.5-turbo"
CHEAP_DEEPSEEK_MODEL = "deepseek-chat"

# --------------------------------------------------------------------------
async def stream_openai_response(message: str, model: str | None = None) -> AsyncGenerator[str, None]:
    """Stream response from OpenAI ChatCompletion."""
    if openai is None:
        raise RuntimeError("openai python package is not installed.")

    client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
    stream = await client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": message}],
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        if delta:
            yield delta

async def stream_deepseek_response(message: str, model: str | None = None) -> AsyncGenerator[str, None]:
    """Stream response from DeepSeek using OpenAI-compatible API base url."""
    if openai is None:
        raise RuntimeError("openai python package is not installed.")

    client = openai.AsyncOpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
    )
    stream = await client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": message}],
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        if delta:
            yield delta

# --------------------------------------------------------------------------
@app.post("/chat/sessions", response_model=ChatSessionOut)
async def create_chat_session(
    session: ChatSessionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    db_session = ChatSession(user_id=user.id, title=session.title)
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

@app.get("/chat/sessions", response_model=List[ChatSessionOut])
async def get_chat_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
    )
    return result.scalars().all()

@app.get("/chat/sessions/{session_id}/messages", response_model=List[ChatMessageOut])
async def get_session_messages(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.chat_session_id == session_id,
            ChatMessage.user_id == user.id
        )
        .order_by(ChatMessage.created_at)
    )
    return result.scalars().all()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    print("New WebSocket connection established")
    await ws.accept()
    try:
        while True:
            raw_data = await ws.receive_text()
            print(f"Received WebSocket data: {raw_data}")
            data = json.loads(raw_data)
            message = data.get("message", "")
            model = data.get("model", "")
            token = data.get("token", "")
            chat_session_id = data.get("chatSessionId")  # Get chat session ID from request
            
            print(f"Parsed message: {message}, model: {model}, token present: {'yes' if token else 'no'}, chat_session_id: {chat_session_id}")

            if not chat_session_id:
                await ws.send_json({"type": "error", "error": "No chat session ID provided"})
                continue

            # Get user from token
            try:
                if not token:
                    raise HTTPException(status_code=401, detail="No token provided")
                
                # Remove 'Bearer ' prefix if present
                if token.startswith('Bearer '):
                    token = token[7:]
                
                async with AsyncSessionLocal() as db:
                    try:
                        user = await get_current_user(token, db)
                        print(f"Authenticated user: {user.username if user else 'None'}")
                        
                        # Verify chat session belongs to user
                        chat_session = (await db.execute(
                            select(ChatSession)
                            .where(
                                ChatSession.id == chat_session_id,
                                ChatSession.user_id == user.id
                            )
                        )).scalar_one_or_none()
                        
                        if not chat_session:
                            raise HTTPException(status_code=404, detail="Chat session not found")
                            
                    except Exception as e:
                        print(f"Error during user/session lookup: {str(e)}")
                        raise HTTPException(status_code=401, detail=str(e))
            except HTTPException as e:
                print(f"Authentication error: {e.status_code}: {e.detail}")
                user = None
                chat_session = None

            # Tell client stream is starting
            await ws.send_json({"type": "start"})

            # Compose full prompt with history for authenticated users
            if user and chat_session:
                async with AsyncSessionLocal() as db:
                    print(f"Saving user message to database for user {user.username}")
                    try:
                        # Save user message
                        db.add(ChatMessage(
                            user_id=user.id,
                            chat_session_id=chat_session.id,
                            role="user",
                            content=message
                        ))
                        await db.commit()
                        print("Successfully saved user message to database")
                    except Exception as e:
                        print(f"Error saving user message to database: {str(e)}")
                        await db.rollback()
                        
                    # Get last 10 messages from this chat session
                    prev_msgs = (await db.execute(
                        select(ChatMessage)
                        .where(
                            ChatMessage.chat_session_id == chat_session.id,
                            ChatMessage.user_id == user.id
                        )
                        .order_by(ChatMessage.created_at.desc())
                        .limit(10)
                    )).scalars().all()[::-1]  # oldest first
                    
                    history_text = "\n".join(f"{m.role}: {m.content}" for m in prev_msgs)
                    prompt = f"{history_text}\nuser: {message}" if history_text else message
                    print(f"Generated prompt with history: {prompt}")
            else:
                print("No authenticated user or chat session, using raw message as prompt")
                prompt = message

            assistant_chunks: list[str] = []

            if model.startswith("deepseek"):
                streamer = stream_deepseek_response(prompt, model)
            else:
                streamer = stream_openai_response(prompt, model)

            try:
                async for chunk in streamer:
                    await ws.send_json({"type": "chunk", "content": chunk})
                    assistant_chunks.append(chunk)
                await ws.send_json({"type": "end"})

                # Save assistant response for logged-in users
                if user and chat_session:
                    async with AsyncSessionLocal() as db:
                        print(f"Saving assistant response to database for user {user.username}")
                        try:
                            db.add(ChatMessage(
                                user_id=user.id,
                                chat_session_id=chat_session.id,
                                role="assistant",
                                content="".join(assistant_chunks)
                            ))
                            await db.commit()
                            print("Successfully saved assistant response to database")
                        except Exception as e:
                            print(f"Error saving assistant response to database: {str(e)}")
                            await db.rollback()

            except Exception as exc:
                print(f"Error during streaming: {str(exc)}")
                await ws.send_json({"type": "error", "error": str(exc)})
    except WebSocketDisconnect:
        print("WebSocket disconnected")

# --------------------------------------------------------------------------
# Chat history endpoint
# --------------------------------------------------------------------------
@app.get("/chat/history")
async def get_chat_history(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at)
    )
    return result.scalars().all()

# --------------------------------------------------------------------------
# Register auth routes & initialize database
# --------------------------------------------------------------------------
app.include_router(auth_router, prefix="/auth", tags=["auth"])

