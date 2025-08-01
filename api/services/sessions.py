from database.client import db_client
from langchain_google_genai import GoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from fastapi import HTTPException
from utils import validate_and_parse_mindmap, parse_json
from services.docs import docs_service
from services.sources import source_service

class SessionService:
    def __init__(self):
        self.db_client = db_client
        self.docs_service = docs_service
        self.source_service = source_service
        self.llm = GoogleGenerativeAI(model="gemini-1.5-flash-8b")

    def get_sessions(self):
        sessions = self.db_client.get_sessions()
        return sessions
    
    def create_new_session(self, video_id):
        try:
            session_id = self.db_client.insert_session()
            self.source_service.add_youtube_source(video_id, session_id)
            mindmap_title, mindmap_str = self._generate_mindmap(session_id)
            if mindmap_title and mindmap_str:
                self.db_client.update_session_title(session_id, mindmap_title)
                self.db_client.insert_mindmap(session_id, mindmap_str)
            
            return session_id

        except Exception as e:
            self.db_client.delete_session(session_id)
            raise e
    
    def delete_session(self, session_id):
        self.db_client.delete_session(session_id)
    
    def get_full_session(self, session_id):
        session = self.db_client.get_session(session_id)
        print("session",session)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        mindmap = self.db_client.get_mindmap(session_id)
        mindmap_json = parse_json(mindmap["mindmap_json"]) if mindmap else None
        return {
            "session": {
                **session,
                "mindmap": mindmap_json
            }
        }

    def _generate_mindmap(self, session_id):
        docs = self.docs_service.get_all_docs(session_id)
        docs_str = "\n".join([doc for doc in docs])
        mindmap_schema = """{
            "title": "Mindmap Title",
            "description": "Mindmap Description",
            "children": [
                {
                    "title": "Subject Title",
                    "description": "Subject Description",
                    "children": [
                        {
                            "title": "Subject Title",
                            "description": "Subject Description",
                            "children": []
                        }
                    ]
                }
            ]
        }"""
        prompt_template = ChatPromptTemplate([
            ("system", """
             You are a helpful assistant that can generate a mindmaps from long documents. You will be given a document and you will need to generate a mindmap about it.
             The Mindmap should have nodes that are related to the document and has a subject and a description. You will just generate the mindmap, you will not generate any other text.
             Mindmap should be in following json format:
             {mindmap_schema}
             """),
            ("user",
             "Generate a mindmap about the following document: {docs_str}")
        ])
        prompt = prompt_template.invoke({"docs_str": docs_str, "mindmap_schema": mindmap_schema})
        response = self.llm.invoke(prompt)
        mindmap_title, mindmap_str = validate_and_parse_mindmap(response)
        
        return mindmap_title, mindmap_str

session_service = SessionService()
