from dotenv import load_dotenv
load_dotenv()

import requests
from services.sources import sources_service

# def test_create_session():
#     payload = [
#         {"url": "https://www.youtube.com/watch?v=PeMlggyqz0Y", "type": "youtube"}
#     ]
#     response = requests.post("http://localhost:6463/sessions", json=payload)
#     assert response.status_code == 200

# def test_get_sessions():
#     response = requests.get("http://localhost:6463/sessions")
#     assert response.status_code == 200

def test_get_all_sources():
    sources = sources_service.get_all_sources(1)
    print(sources)

test_get_all_sources()