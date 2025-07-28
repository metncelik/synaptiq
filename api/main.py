from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")
from utils.general import check_env_vars
check_env_vars()

from services.chat import chat_service
from services.sources import sources_service
from vectorstore.client import VectoreStoreClient

if __name__ == "__main__":
    # sources_service.add_youtube_source("kxT8-C1vmd4", "1")
    
    # print(chat_service.generate_mindmap("1"))
    
    
    print(chat_service.generate_question("Explicit Deallocation", "1"))
    # print(chat_service.chat("Acording to this explain The Future of Manual Programming", "123"))
