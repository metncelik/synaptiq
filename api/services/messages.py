from database.client import db_client
from langchain_google_genai import ChatGoogleGenerativeAI
from fastapi import HTTPException
from utils import get_node_title_desc, parse_json
from services.docs import docs_service
from langchain.prompts import ChatPromptTemplate
from langchain_core.messages import ToolMessage
from langchain_tavily import TavilySearch

class MessageService:
    def __init__(self):
        self.db_client = db_client
        self.docs_service = docs_service
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")
        self.web_search_tool = TavilySearch(max_results=2)

    def add_message(self, chat_id, role, content):
        message = self.db_client.insert_message(chat_id, role, content)
        return message

    def get_messages(self, chat_id, desc=True):
        messages = self.db_client.get_messages(chat_id, desc)
        return messages
    
    def create_new_message(self, chat_id, content):
        chat = self.db_client.get_chat_by_id(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        history = self.get_messages(chat_id, desc = False)
        print("history:", history)
        response = self.generate_response(
            chat["session_id"], chat["node_id"], chat["type"], content, history, web_search=chat["type"] == "deepdive")
        self.add_message(chat_id, "user", content)
        self.add_message(chat_id, "assistant", response)
        return response
    
    def generate_response(self, session_id, node_id, chat_type, content, history = None, web_search=False):
        mindmap = self.db_client.get_mindmap(session_id)
        mindmap_json = parse_json(mindmap["mindmap_json"]) if mindmap else None
        node_title, node_desc = get_node_title_desc(mindmap_json, node_id)
        docs = self.docs_service.query_all_docs(
            node_title + " " + node_desc, session_id)
        docs_str = "\n".join([doc.page_content for doc in docs])

        print("web_search:", web_search)
        response = self._invoke_llm(
            content, chat_type, node_title, mindmap_json, docs_str, history, web_search)
        
        return response

    def _invoke_llm(self, new_message, chat_type, topic, mindmap, docs_str, history, web_search):
        if chat_type == "normal":
            system_prompt = """
You are a helpful assistant specializing in {topic}. Provide clear, accurate answers based on the mindmap context: {mindmap}

Stay focused on {topic} and use the provided information: {docs_str}

Guidelines:
- Give concise, relevant answers
- Reference specific details from the provided information
- Avoid unrelated topics
- If information is insufficient, acknowledge limitations clearly
"""
                 
        elif chat_type == "quiz":
            system_prompt = """
You are an educational assistant that creates questions and evaluates responses about {topic} based on this mindmap: {mindmap}

Use this information to generate relevant content: {docs_str}

Guidelines:
- Create clear, focused questions about {topic}
- Provide constructive feedback on user responses
- Vary question types (multiple choice, open-ended, scenario-based)
- Stay within the topic scope
- Give helpful explanations for correct answers
"""
        
        elif chat_type == "deepdive":
            system_prompt = """
You are an expert research assistant providing comprehensive deep-dive analysis. You have access to a web search tool that you should use when:
- Current information is needed (recent developments, latest research, current events)
- The provided documents lack sufficient detail on important aspects
- Verification of facts or claims is required
- Additional context would significantly enhance the analysis

Analyze the following information thoroughly: {docs_str}

Guidelines:
- Provide comprehensive, well-structured analysis
- Use web search to supplement information when necessary
- Cross-reference multiple sources for accuracy
- Present both overview and detailed insights
- Include recent developments and current context when relevant
- Cite sources when using web search results
"""
                 
        else:
            raise HTTPException(status_code=400, detail="Invalid chat type")

        messages = [("system", system_prompt)]
        
        if history:
            for message in history:
                messages.append((message["role"], message["content"]))
        
        messages.append(("user", new_message))
        
        prompt_template = ChatPromptTemplate.from_messages(messages)
        
        prompt = prompt_template.invoke(
            {"docs_str": docs_str, "topic": topic, "mindmap": mindmap})
        
        # TODO: check if max tokens is reached
        
        # TODO: find a better way to handle web search
        if web_search:
            llm_with_tools = self.llm.bind_tools([self.web_search_tool])
            ai_msg = llm_with_tools.invoke(prompt)

            if not ai_msg.tool_calls:
                return ai_msg.content

            tool_messages = []
            for tool_call in ai_msg.tool_calls:
                tool_output = self.web_search_tool.invoke(tool_call["args"])
                tool_messages.append(
                    ToolMessage(content=str(tool_output), tool_call_id=tool_call["id"])
                )
                
            print("tool_messages:", tool_messages)

            messages = prompt.to_messages()
            messages.append(ai_msg)
            messages.extend(tool_messages)
            
            response = self.llm.invoke(messages)
        else:
            response = self.llm.invoke(prompt)
            
        return response.content
 
    

message_service = MessageService()
