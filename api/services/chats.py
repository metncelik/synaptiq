from database.client import db_client
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import GoogleGenerativeAI
from services.docs import docs_service
from services.messages import message_service
from utils import parse_json
from fastapi import HTTPException
from utils import get_node_title_desc

class ChatService:
    def __init__(self):
        self.db_client = db_client
        self.llm = GoogleGenerativeAI(model="gemini-1.5-flash-8b")
        self.docs_service = docs_service
        self.message_service = message_service

    def create_new_chat(self, session_id, node_id, chat_type):
        chat = self.db_client.insert_chat(session_id, node_id, chat_type)
        if not chat:
            raise HTTPException(status_code=400, detail="Failed to create chat")
        
        try:
            if chat_type == "quiz":
                response = message_service.generate_response(session_id, node_id, chat_type, "Generate a question")
                message_service.add_message(chat["id"], "assistant", response)
            return chat
                
        except Exception as e:
            self.db_client.delete_chat(chat["id"])
            raise e
        
    
    
    def get_chat(self, session_id, node_id, chat_type):
        chat = self.db_client.get_chat(session_id, node_id, chat_type)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        messages = self.message_service.get_messages(chat["id"], desc = False)
        chat["messages"] = messages
        return chat
    
    def get_chat_by_id(self, chat_id):
        chat = self.db_client.get_chat_by_id(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return chat
    
chat_service = ChatService()