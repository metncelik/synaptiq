from fastapi import APIRouter
from services.docs import docs_service

router = APIRouter(prefix="/docs", tags=["docs"])

@router.get("/") 
def get_all_session_docs(session_id):
    docs = docs_service.get_all_docs(session_id)
    return docs

@router.get("/query")
def query_session_docs(session_id, query):
    docs = docs_service.query_all_docs(query, session_id)
    contents = []
    for doc in docs:
        contents.append(doc.page_content)
    return contents