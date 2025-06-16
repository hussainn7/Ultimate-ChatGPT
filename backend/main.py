from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import os
import asyncio
from typing import AsyncGenerator, Optional
from datetime import timedelta

from .database import get_db, User
from .auth import (
    verify_password, get_password_hash, create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user, SECRET_KEY, ALGORITHM
)
from jose import jwt, JWTError

try:
    import openai
except ImportError:
    openai = None  # Will raise later if missing

app = FastAPI(title="EchoTalkFlow Backend", version="0.1.0")

# Allow front-end dev server (vite) during local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API KEYS --------------------------------------------------------------
OPENAI_API_KEY = "THE_KEY"
DEEPSEEK_API_KEY = "THE_KEY"
if not OPENAI_API_KEY:
    print("[WARN] OPENAI_API_KEY env var not set – OpenAI requests will fail.")
if not DEEPSEEK_API_KEY:
    print("[WARN] DEEPSEEK_API_KEY env var not set – DeepSeek requests will fail.")

# Cheapest default models
CHEAP_CHATGPT_MODEL = "gpt-3.5-turbo"
CHEAP_DEEPSEEK_MODEL = "deepseek-chat"

# Pydantic models for request/response
class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Authentication endpoints
@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# --------------------------------------------------------------------------
def get_openai_client(model: str):
    """Get the appropriate OpenAI client based on the model."""
    client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
    return client

async def stream_openai_response(messages: list[dict], model: str):
    """Stream the response from OpenAI API"""
    try:
        # Get the appropriate client based on the model
        client = get_openai_client(model)
        

        
        # Stream the response
        stream = await client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=1000
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
                
    except Exception as e:
        print(f"Error in stream_openai_response: {str(e)}")
        yield f"Error: {str(e)}"

async def stream_deepseek_response(message: str, model: str | None = None, username: Optional[str] = None) -> AsyncGenerator[str, None]:
    """Stream response from DeepSeek using OpenAI-compatible API base url."""
    if openai is None:
        raise RuntimeError("openai python package is not installed.")

    client = openai.AsyncOpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
    )
    stream = await client.chat.completions.create(
        model=model,
                    messages=[
                {"role": "system", "content": (f"You are a helpful AI assistant. Respond in the same language as the user's message. "
                                                f"The user's name is {username}." if username else "You are a helpful AI assistant. Respond in the same language as the user's message.")},
                {"role": "user", "content": message},
            ],
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        if delta:
            yield delta

# --------------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(None)):
    print("New WebSocket connection request")
    
    # Accept the connection first
    await ws.accept()
    print("WebSocket connection accepted")
    # Per-connection chat history to provide context on each request
    chat_history: list[dict] = []
    
    try:
        # If token is provided, verify it
        if token:
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username: str = payload.get("sub")
                if username is None:
                    await ws.close(code=status.WS_1008_POLICY_VIOLATION)
                    return
                
                # Get user from database
                db = next(get_db())
                # Accept either username or email from token 'sub'
                if "@" in username:
                    user = db.query(User).filter(User.email == username).first()
                else:
                    user = db.query(User).filter(User.username == username).first()
                if not user:
                    print(f"Token valid but user not found in DB: {username}. Treating as guest.")
                    username = None  # fall back to guest
                else:
                    print(f"Authenticated user connected: {username}")
            except JWTError:
                await ws.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        else:
            print("Guest user connected")
    
        while True:
            try:
                data = await ws.receive_text()
                print(f"Received message: {data}")
                
                try:
                    raw_data = json.loads(data)
                    message = raw_data.get("message", "")
                    model = raw_data.get("model", "gpt-3.5-turbo")
                    print(f"Processing message: {message} with model: {model}")

                    # Tell client stream is starting
                    await ws.send_json({"type": "start"})
                    print("Sent start message")

                    # Build full message array with prior context
                    messages_payload = ([
                        {"role": "system", "content": "Here is the context of the conversation so far. Use it to answer helpfully."}
                    ] + chat_history + [
                        {"role": "user", "content": message}
                    ])

                    # Stream the response
                    streamer = stream_openai_response(messages_payload, model)
                    assistant_response = ""
                    async for chunk in streamer:
                        assistant_response += chunk
                        if ws.client_state.CONNECTED:
                            await ws.send_json({"type": "chunk", "content": chunk})
                    
                    # Tell the client the stream ended
                    if ws.client_state.CONNECTED:
                        await ws.send_json({"type": "end"})

                    # Update history
                    chat_history.extend([
                        {"role": "user", "content": message},
                        {"role": "assistant", "content": assistant_response},
                    ])

                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {str(e)}")
                    if ws.client_state.CONNECTED:
                        await ws.send_json({"type": "error", "error": "Invalid message format"})
                except Exception as e:
                    print(f"Error processing message: {str(e)}")
                    if ws.client_state.CONNECTED:
                        await ws.send_json({"type": "error", "error": str(e)})

            except WebSocketDisconnect:
                print("WebSocket disconnected")
                break
            except Exception as e:
                print(f"Unexpected error: {str(e)}")
                if ws.client_state.CONNECTED:
                    await ws.send_json({"type": "error", "error": str(e)})
                break

    except Exception as e:
        print(f"Fatal error in WebSocket connection: {str(e)}")
        try:
            await ws.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass
