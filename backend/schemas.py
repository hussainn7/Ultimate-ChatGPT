from datetime import datetime
from pydantic import BaseModel, Field

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(UserBase):
    password: str

class ChatSessionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionOut(ChatSessionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    content: str
    role: str

class ChatMessageCreate(ChatMessageBase):
    chat_session_id: int

class ChatMessageOut(ChatMessageBase):
    id: int
    chat_session_id: int
    created_at: datetime

    class Config:
        from_attributes = True 