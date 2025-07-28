
from youtube_transcript_api import YouTubeTranscriptApi
from langchain.text_splitter import RecursiveCharacterTextSplitter
from vectorstore.client import VectoreStoreClient
from langchain.docstore.document import Document


class SourceService:
    def __init__(self):
        self.vectorstore_client = VectoreStoreClient()
        
    def add_youtube_source(self, video_id, chat_id):
        transcript = self._get_yt_transcript(video_id)
        docs = self._vectorize_transcript(transcript, chat_id)
        ids = self._store_vectorized_docs(docs, chat_id)
        return ids
    
    def get_all_sources(self, chat_id):
        docs = self.vectorstore_client.get_all_chat_documents(chat_id)
        return docs
    
    def query_all_sources(self, query, chat_id):
        docs = self.vectorstore_client.query(query, filter={"chat_id": chat_id})
        return docs

    def _get_yt_transcript(self, video_id):
        ytt_api = YouTubeTranscriptApi()
        fetched_transcript = ytt_api.fetch(video_id)

        full_transcript = ""
        for snippet in fetched_transcript:
            full_transcript += snippet.text + " "

        return full_transcript

    def _vectorize_transcript(self, transcript, chat_id):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(transcript)
        metadata = {
            "chat_id": chat_id
        }
        docs = [Document(page_content=chunk,metadata=metadata) for chunk in chunks]
        return docs

    def _store_vectorized_docs(self, docs, id_prefix):
        ids = self.vectorstore_client.add_documents(docs)
        return ids
    
    
sources_service = SourceService()