from fastapi import APIRouter
from services.sessions import session_service
from pydantic import BaseModel
from enum import Enum

router = APIRouter(prefix = "/sessions", tags = ["sessions"])

class SourceType(str, Enum):
    YOUTUBE = "youtube"
    PDF = "pdf"
    WEB_PAGE = "web_page"

class Source(BaseModel):
    url: str
    type: SourceType
    title: str = None

@router.get("/")
def get_sessions():
    sessions = session_service.get_sessions()
    return sessions

@router.post("/")
def create_session(sources: list[Source]):        
    session_id = session_service.create_new_session(sources)
    
    return {
        "session_id": session_id
    }

@router.delete("/{session_id}")
def delete_session(session_id: str):
    session_service.delete_session(session_id)
    return {"message": "Session deleted"}

@router.get("/{session_id}")
def get_session(session_id: str):
    print("session_id",session_id)
    session = session_service.get_full_session(session_id)
    return session