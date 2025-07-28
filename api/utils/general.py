import os
import json

def check_env_vars():
    required_env_vars = ["GOOGLE_API_KEY"]
    for var in required_env_vars:
        if os.getenv(var) is None:
            raise ValueError(f"Environment variable {var} is not set")
        
        
def validate_and_parse_mindmap(mindmap_str):
    mindmap_str = mindmap_str.replace("```json", "").replace("```", "")
    mindmap_str = mindmap_str.replace("```", "").replace("```", "")
    mindmap = json.loads(mindmap_str)
    return mindmap