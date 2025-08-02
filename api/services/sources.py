from database.client import db_client
from utils import get_yt_title
from services.docs import docs_service

class SourceService:
    def __init__(self):
        self.db_client = db_client
        self.docs_service = docs_service
        
    def add_source(self, source, session_id):
        if source.type == "youtube":
            source.title = get_yt_title(source.url)
        if source.type == "web_page":
            source.title = source.url.split("//")[-1]
        
        source_id = self.db_client.insert_source(source.title, source.type, source.url, session_id)
        self.docs_service.add_docs(source.url, source.type, session_id, source_id)

    def get_sources(self, session_id):
        sources = self.db_client.get_sources(session_id)
        return sources

source_service = SourceService()