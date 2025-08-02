import os
import json
import requests
from bs4 import BeautifulSoup

def check_env_vars():
    required_env_vars = ["GOOGLE_API_KEY"]
    for var in required_env_vars:
        if os.getenv(var) is None:
            raise ValueError(f"Environment variable {var} is not set")
        
def parse_json(text):
    return json.loads(text)

#TODO: change the mindmap format
def validate_and_parse_mindmap(mindmap_str):
    mindmap_str = mindmap_str.replace("```json", "").replace("```", "")
    mindmap_json = parse_json(mindmap_str)
    mindmap_title = mindmap_json["title"]
    
    node_counter = [1] 
    
    def add_node_ids(node):
        node["node_id"] = node_counter[0]
        node_counter[0] += 1
        
        if "children" in node:
            for child in node["children"]:
                add_node_ids(child)
    
    add_node_ids(mindmap_json)
    
    mindmap_str = json.dumps(mindmap_json)
    
    return mindmap_title, mindmap_str

def get_yt_video_id(url):
    if "youtube.com" in url:
        video_id = url.split("v=")[-1].split("&")[0]
        return video_id
    else:
        raise ValueError("Invalid YouTube URL")

def get_yt_title(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    title = soup.find("title").text
    title = title.split("- YouTube")[0]
    return title


def get_node_title_desc(mindmap_json, target_node_id):
        # TODO: find a better way to get the node title by id
        def traverse_node(node):
            if node.get("node_id") == target_node_id:
                return node.get("title"), node.get("description")
            
            if "children" in node and isinstance(node["children"], list):
                for child in node["children"]:
                    result = traverse_node(child)
                    if result:
                        return result
            
            return None
        
        return traverse_node(mindmap_json)