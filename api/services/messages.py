from database.client import db_client
from langchain_google_genai import ChatGoogleGenerativeAI
from fastapi import HTTPException
from utils import get_node_title_desc, parse_json
from services.docs import docs_service
from langchain.prompts import ChatPromptTemplate
from langchain_core.tools import Tool


class MessageService:
    def __init__(self):
        self.db_client = db_client
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")
        self.docs_service = docs_service

    def create_new_message(self, chat_id, content):
        chat = self.db_client.get_chat_by_id(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        history = self.get_messages(chat_id, desc = False)
        print("history:", history)
        response = self.generate_response(
            chat["session_id"], chat["node_id"], chat["type"], content, history)
        self.add_message(chat_id, "user", content)
        self.add_message(chat_id, "assistant", response)
        return response

    def generate_response(self, session_id, node_id, chat_type, content, history = None):
        mindmap = self.db_client.get_mindmap(session_id)
        mindmap_json = parse_json(mindmap["mindmap_json"]) if mindmap else None
        node_title, node_desc = get_node_title_desc(mindmap_json, node_id)
        docs = self.docs_service.query_all_docs(
            node_title + " " + node_desc, session_id)
        docs_str = "\n".join([doc.page_content for doc in docs])

        response = self._invoke_llm(
            content, chat_type, node_title, mindmap_json, docs_str, history)

        return response

    def _invoke_llm(self, new_message, chat_type, topic, mindmap, docs_str, history):
        if chat_type == "quiz":
            system_prompt = """
                 You are a helpful assistant that can generate a questions and evaluate user responses about the {topic} in this mindmap: {mindmap}. Do not generate unrelated questions just stay in the topic ({topic}). Here is the related information you need: {docs_str}
                 """
        
        # TODO: change deepdive prompt & add web search tool (?)
        elif chat_type == "deepdive":
            system_prompt = """
                 You are a helpful assistant that can generate a deepdive about the following text: {docs_str}
                 """

        elif chat_type == "normal":
            system_prompt = """
                 You are a helpful assistant. Answer questions about the {topic} in this mindmap: {mindmap}. Do not give unrelated information just stay in the topic ({topic}). Here is the related information you need: {docs_str}
                 """

        else:
            raise HTTPException(status_code=400, detail="Invalid chat type")
        
        prompt_template = ChatPromptTemplate.from_messages([
               ("system", system_prompt),
               
           ])
        
        if history:
            for message in history:
                prompt_template.append(("user", message["content"]))
        
        prompt_template.append(("user", new_message))
        
        prompt = prompt_template.invoke(
            {"docs_str": docs_str, "topic": topic, "mindmap": mindmap})
        
        print("prompt:", prompt)
        response = self.llm.invoke(prompt)

        return response.content

    def add_message(self, chat_id, role, content):
        message = self.db_client.insert_message(chat_id, role, content)
        return message

    def get_messages(self, chat_id, desc=True):
        messages = self.db_client.get_messages(chat_id, desc)
        return messages


message_service = MessageService()
