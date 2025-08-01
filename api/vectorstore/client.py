
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pathlib import Path

VECTORESTORE_PATH = Path(__file__).parent / ".chroma"

class VectoreStoreClient:
    def __init__(self):
        self.vectorstore_path = VECTORESTORE_PATH
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        self.vectorstore = Chroma(
            persist_directory=self.vectorstore_path,
            embedding_function=self.embeddings
        )

    def add_documents(self, documents):
        ids = self.vectorstore.add_documents(documents)
        return ids
        
    def get_all_session_documents(self, session_id):
        all_docs = self.vectorstore.get(where={"session_id": int(session_id)})
        return all_docs["documents"]
    
    def get_source_documents(self, source_id):
        docs = self.vectorstore.get(where={"source_id": int(source_id)})
        return docs["documents"]

    def query(self, query, k=4, filter=None):
        docs =  self.vectorstore.similarity_search(query, k=k, filter=filter)
        return docs
    
vectorstore_client = VectoreStoreClient()