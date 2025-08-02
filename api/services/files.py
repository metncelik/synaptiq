from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse
import shutil
from pathlib import Path
import uuid
from database.client import db_client

class FilesService:
    def __init__(self):
        self.files_dir = Path("files")
        self.files_dir.mkdir(exist_ok=True)
        self.db_client = db_client
    
    def upload_file(self, file: UploadFile):
        try:
            file_extension = Path(file.filename).suffix.lower() if file.filename else ""
            
            if file_extension != '.pdf':
                raise HTTPException(status_code=400, detail="Only PDF files are allowed")
            
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            file_path = self.files_dir / unique_filename
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            file_id = self.db_client.insert_file(unique_filename, file.filename, file.content_type, file_path.stat().st_size)
            
            return file_id
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not upload file: {str(e)}")
    
    def get_file(self, filename: str):
        file_path = self.files_dir / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        file_extension = Path(filename).suffix.lower()
        
        if not file_extension == '.pdf':
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        return FileResponse(
            path=file_path,
            media_type='application/pdf',
            headers={"Content-Disposition": "inline"}
        )
    
    def list_files(self):
        files = self.db_client.get_all_files()
        return files
    
    def delete_file(self, filename: str):
        file_path = self.files_dir / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        try:
            # Get file record from database to get the file ID
            files = self.db_client.get_all_files()
            file_record = next((f for f in files if f['filename'] == filename), None)
            
            if file_record:
                # Delete from database first
                self.db_client.delete_file(file_record['id'])
            
            # Delete physical file
            file_path.unlink()
            return {"message": f"File {filename} deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not delete file: {str(e)}")


files_service = FilesService()