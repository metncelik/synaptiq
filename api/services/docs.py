from youtube_transcript_api import YouTubeTranscriptApi
from langchain.text_splitter import RecursiveCharacterTextSplitter
from vectorstore.client import vectorstore_client
from langchain.docstore.document import Document
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from database.client import db_client
from utils import get_yt_video_id
from services.files import files_service


class DocsService:
    def __init__(self):
        self.vectorstore_client = vectorstore_client
        self.db_client = db_client
        self.files_service = files_service

    def add_docs(self, url, source_type, session_id, source_id):
        if source_type == "youtube":
            content = self._get_yt_transcript(url)
        elif source_type == "pdf":
            content = self._get_pdf_content(url)
        elif source_type == "web_page":
            content = self._get_web_page_content(url)
        docs = self._text_to_docs(content, session_id, source_id)

        self._store_vectorized_docs(docs)

    def get_all_docs(self, session_id):
        docs = self.vectorstore_client.get_all_session_documents(session_id)
        return docs

    def query_all_docs(self, query, session_id):
        docs = self.vectorstore_client.query(
            query, filter={"session_id": int(session_id)})
        return docs

    def _get_yt_transcript(self, url):
        ytt_api = YouTubeTranscriptApi()
        video_id = get_yt_video_id(url)
        fetched_transcript = ytt_api.fetch(video_id)

        full_transcript = ""
        for snippet in fetched_transcript:
            full_transcript += snippet.text + " "

        return full_transcript

    def _get_pdf_content(self, url):
        # TODO: use a pdf parser (markitdown)
        if url.startswith("/"):
            url = url[1:]
        loader = PyPDFLoader(url)
        docs = loader.load()
        full_text = ""
        for doc in docs:
            full_text += doc.page_content + " "
        return full_text

    def _get_web_page_content(self, url):
        try:
            loader = WebBaseLoader([url])
            docs = loader.load()
            full_text = ""
            for doc in docs:
                full_text += doc.page_content + " "
            return full_text
        except Exception as e:
            print("Error loading web page:", e)
            raise e

    def _text_to_docs(self, text, session_id, source_id):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(text)
        metadata = {
            "session_id": session_id,
            "source_id": source_id
        }
        docs = [Document(page_content=chunk, metadata=metadata)
                for chunk in chunks]
        return docs

    def _store_vectorized_docs(self, docs):
        ids = self.vectorstore_client.add_documents(docs)
        print("ids", ids)
        return ids


docs_service = DocsService()
