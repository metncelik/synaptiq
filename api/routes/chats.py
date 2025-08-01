from fastapi import APIRouter
from services.chats import chat_service
from pydantic import BaseModel
from enum import Enum
from utils import get_yt_video_id

router = APIRouter(prefix = "/chats", tags = ["chats"])


@router.post("/")
def create_chat(session_id: str, node_id: str, chat_type: str):
    chat = chat_service.create_new_chat(session_id, int(node_id), chat_type)
    return chat

@router.get("/")
def get_chat(session_id: str, node_id: str, chat_type: str):
    chat = chat_service.get_chat(session_id, int(node_id), chat_type)
    return chat

