from database.client import db_client
from utils import get_yt_title
from services.docs import docs_service

class SourceService:
    def __init__(self):
        self.db_client = db_client
        self.docs_service = docs_service
        
    def add_youtube_source(self, video_id, session_id):
        yt_title = get_yt_title(video_id)
        source_id = self.db_client.insert_source(yt_title, "youtube", session_id)
        self.docs_service.add_youtube_docs(video_id, session_id, source_id)

source_service = SourceService()