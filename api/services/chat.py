from services.sources import sources_service
from langchain_google_genai import GoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from utils.general import validate_and_parse_mindmap

class ChatService:
    def __init__(self):
        self.sources_service = sources_service
        self.llm = GoogleGenerativeAI(model="gemini-1.5-flash-8b")

    def chat(self, query, chat_id):
        docs = self.sources_service.query_all_sources(query, chat_id)
        docs_str = "\n".join([doc.page_content for doc in docs])

        prompt_template = ChatPromptTemplate([
            ("system",
             "You are a helpful assistant that can answer questions about the following sources: {docs_str}"),
            ("user", "Answer the following question: {query}")
        ])
        prompt = prompt_template.invoke({"docs_str": docs_str, "query": query})

        response = self.llm.invoke(prompt)
        return response

    def generate_mindmap(self, chat_id):
        docs = self.sources_service.get_all_sources(chat_id)
        docs_str = "\n".join([doc for doc in docs])
        mindmap_schema = """{
            "title": "Mindmap Title",
            "description": "Mindmap Description",
            "children": [
                {
                    "title": "Subject Title",
                    "description": "Subject Description",
                    "children": [
                        {
                            "title": "Subject Title",
                            "description": "Subject Description",
                            "children": []
                        }
                    ]
                }
            ]
        }"""
        prompt_template = ChatPromptTemplate([
            ("system", """
             You are a helpful assistant that can generate a mindmaps from long documents. You will be given a document and you will need to generate a mindmap about it.
             The Mindmap should have nodes that are related to the document and has a subject and a description.
             Mindmap should be in following json format:
             {mindmap_schema}
             """),
            ("user",
             "Generate a mindmap about the following document: {docs_str}")
        ])
        prompt = prompt_template.invoke({"docs_str": docs_str, "mindmap_schema": mindmap_schema})
        
        response = self.llm.invoke(prompt)
        mindmap = validate_and_parse_mindmap(response)
        
        return mindmap

    def generate_question(self, topic, chat_id):
        docs = self.sources_service.query_all_sources(topic, chat_id)
        docs_str = "\n".join([doc.page_content for doc in docs])

        prompt_template = ChatPromptTemplate([
            ("system",
             "You are a helpful assistant that can generate questions about the following sources: {docs_str}"),
            ("user",
             "Generate a question about the following sources: {docs_str}")
        ])
        prompt = prompt_template.invoke({"docs_str": docs_str})
        response = self.llm.invoke(prompt)
        return response


chat_service = ChatService()
