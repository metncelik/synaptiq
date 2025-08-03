from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")
from utils import check_env_vars
check_env_vars()

import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes.chats import router as chats_router
from routes.sessions import router as sessions_router
from routes.docs import router as docs_router
from routes.messages import router as messages_router
from routes.files import router as files_router

app = FastAPI(
    title="Synaptiq",
    description="An AI-powered learning assistant that enables interactive Q&A using mindmaps",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],    
)

@app.exception_handler(ValueError)
async def value_error_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": "Validation Error", "detail": str(exc)}
    )

@app.exception_handler(sqlite3.IntegrityError)
async def sqlite_integrity_error_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": "Validation Error", "detail": str(exc)}
    )
    
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": "An unexpected error occurred"}
    )
    

@app.get("/")
async def root():
    return {
        "title": "Synaptiq",
        "version": "1.0.0",
        "docs": "/docs",
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(sessions_router)
app.include_router(docs_router)
app.include_router(chats_router)
app.include_router(messages_router)
app.include_router(files_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6463)
    
    
    # session_id = session_service.create_new_session("446E-r0rXHI")
    
    # chat_id = chat_service.create_new_chat(session_id, "quiz", "Syntax and Data Types of Go")
    # print(message_service.get_messages(chat_id))
    # print("--------------------------------")
    
    # chat_service.new_user_message(chat_id, "I dont know")
    # print(message_service.get_messages(chat_id))
    # print("--------------------------------")
    
    # chat_service.new_user_message(chat_id, "Tell Me More")
    # print(message_service.get_messages(chat_id))