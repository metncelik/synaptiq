
from youtube_transcript_api import YouTubeTranscriptApi
from langchain.text_splitter import RecursiveCharacterTextSplitter
from vectorstore.client import vectorstore_client
from langchain.docstore.document import Document
from database.client import db_client

class DocsService:
    def __init__(self):
        self.vectorstore_client = vectorstore_client
        self.db_client = db_client
        
    def add_youtube_docs(self, video_id, session_id, source_id):
        transcript = self._get_yt_transcript(video_id)
        docs = self._transcript_to_docs(transcript, session_id, source_id)
        self._store_vectorized_docs(docs)
    
    def get_all_docs(self, session_id):
        docs = self.vectorstore_client.get_all_session_documents(session_id)
        return docs
    
    def query_all_docs(self, query, session_id):
        docs = self.vectorstore_client.query(query, filter={"session_id": int(session_id)})
        return docs

    def _get_yt_transcript(self, video_id):
        ytt_api = YouTubeTranscriptApi()
        fetched_transcript = ytt_api.fetch(video_id)

        full_transcript = ""
        for snippet in fetched_transcript:
            full_transcript += snippet.text + " "

        return full_transcript

    def _transcript_to_docs(self, transcript, session_id, source_id):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(transcript)
        metadata = {
            "session_id": session_id,
            "source_id": source_id
        }
        docs = [Document(page_content=chunk,metadata=metadata) for chunk in chunks]
        return docs
    
    def _store_vectorized_docs(self, docs):
        ids = self.vectorstore_client.add_documents(docs)
        print("ids",ids)
        return ids

docs_service = DocsService()