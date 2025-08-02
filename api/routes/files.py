from fastapi import APIRouter, UploadFile, File
from services.files import files_service

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    return files_service.upload_file(file)

@router.get("/{filename}")
async def get_file(filename: str):
    return files_service.get_file(filename)
    
@router.get("/")
async def list_files():
    return files_service.list_files()

@router.delete("/{filename}")
async def delete_file(filename: str):
    return files_service.delete_file(filename)