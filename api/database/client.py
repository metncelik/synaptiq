import sqlite3
from pathlib import Path
from contextlib import contextmanager
SQLITE_DB_PATH = Path(__file__).parent / ".sqlite" / "database.db"


class DatabaseClient:
    def __init__(self):
        self.db_path = SQLITE_DB_PATH
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
       
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        self.init_database()
        
    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  
        conn.execute("PRAGMA foreign_keys = ON") 
        try:
            yield conn
        finally:
            conn.close()
            
    def init_database(self):
        schema_path = Path(__file__).parent / "schemas.sql"
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        with self.get_connection() as conn:
            conn.executescript(schema_sql)
            conn.commit()
            
    def insert_session(self):
        with self.get_connection() as conn:
            cursor = conn.execute("INSERT INTO sessions DEFAULT VALUES")
            conn.commit()
            return cursor.lastrowid
        
    def update_session_title(self, session_id, title):
        with self.get_connection() as conn:
            conn.execute("UPDATE sessions SET title = ? WHERE id = ?", (title, session_id))
            conn.commit()
            
    def get_session(self, session_id):
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
            session = cursor.fetchone()
            return dict(session) if session else None
            
    def get_sessions(self):
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM sessions ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]
        
    def delete_session(self, session_id):
        with self.get_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
            conn.commit()
        
    def insert_mindmap(self, session_id, mindmap):
        with self.get_connection() as conn:
            conn.execute("INSERT INTO mindmaps (session_id, mindmap_json) VALUES (?, ?)", (session_id, mindmap))
            conn.commit()
            
    def get_mindmap(self, session_id):
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM mindmaps WHERE session_id = ?", (session_id,))
            mindmap = cursor.fetchone()
            return dict(mindmap) if mindmap else None
            
    def insert_chat(self, session_id, node_id, chat_type):
        with self.get_connection() as conn:
            cursor = conn.execute("INSERT INTO chats (session_id, node_id, type) VALUES (?, ?, ?) RETURNING *", (session_id, node_id, chat_type))
            chat = cursor.fetchone()
            conn.commit()
            return dict(chat) if chat else None
        
    def get_chats(self, session_id, node_id):
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM chats WHERE session_id = ? AND node_id = ? ORDER BY created_at DESC", (session_id, node_id))
            return [dict(row) for row in cursor.fetchall()]
        
    def get_chat(self, session_id, node_id, chat_type):
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM chats WHERE session_id = ? AND node_id = ? AND type = ?", (session_id, node_id, chat_type))
            chat = cursor.fetchone()
            return dict(chat) if chat else None
        
    def get_chat_by_id(self, chat_id):
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM chats WHERE id = ?", (chat_id,))
            chat = cursor.fetchone()
            return dict(chat) if chat else None
            
    def insert_source(self, source_title, source_type, session_id):
        with self.get_connection() as conn:
            cursor = conn.execute("INSERT INTO sources (title, type, session_id) VALUES (?, ?, ?)", (source_title, source_type, session_id))
            conn.commit()
            return cursor.lastrowid

    def insert_message(self, chat_id, role, content):
        with self.get_connection() as conn:
            cursor = conn.execute("INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?) RETURNING *", (chat_id, role, content))
            message = cursor.fetchone()
            conn.commit()
            return dict(message) if message else None
        
    def get_messages(self, chat_id, desc = True):
        with self.get_connection() as conn:
            cursor = conn.execute(f"SELECT * FROM messages WHERE chat_id = ? ORDER BY id {'DESC' if desc else 'ASC'}", (chat_id,))
            return [dict(row) for row in cursor.fetchall()]
        
    def get_last_message(self, chat_id):
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT 1", (chat_id,))
            return dict(cursor.fetchone())


db_client = DatabaseClient()