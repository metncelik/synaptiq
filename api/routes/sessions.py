from fastapi import APIRouter
from services.sessions import session_service
from services.chats import chat_service
from services.messages import message_service
from pydantic import BaseModel
from enum import Enum
from utils import get_yt_video_id

router = APIRouter(prefix = "/sessions", tags = ["sessions"])

class SourceType(str, Enum):
    YOUTUBE = "youtube"

class Source(BaseModel):
    url: str
    type: SourceType

@router.get("/")
def get_sessions():
    sessions = session_service.get_sessions()
    return sessions

@router.post("/")
def create_session(sources: list[Source]):
    for source in sources:
        if source.type == SourceType.YOUTUBE:
            video_id = get_yt_video_id(source.url)
            session_id = session_service.create_new_session(video_id)
            return {
                "session_id": session_id
            }
            
    raise ValueError("Invalid source type")

@router.delete("/{session_id}")
def delete_session(session_id: str):
    session_service.delete_session(session_id)
    return {"message": "Session deleted"}

@router.get("/{session_id}")
def get_session(session_id: str):
    print("session_id",session_id)
    session = session_service.get_full_session(session_id)
    return session