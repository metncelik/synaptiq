from fastapi import APIRouter
from pydantic import BaseModel
from services.messages import message_service
from services.chats import chat_service

router = APIRouter(prefix="/messages", tags=["messages"])

class MessageRequest(BaseModel):
    content: str
    chat_id: str

@router.post("/")
async def add_message(request: MessageRequest):
    response = message_service.create_new_message(chat_id = request.chat_id, content = request.content)
    return response