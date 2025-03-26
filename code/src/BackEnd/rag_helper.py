
import os
from typing import List, Dict
import pandas as pd
import json
import re
from benchmark import ChatbotBenchmark

class RAGHelper:
    def __init__(self, data_path: str = "data"):
        # Convert to absolute path
        self.data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), data_path))
        self.knowledge_base = {}
        self.load_knowledge_base()
        self.benchmark = ChatbotBenchmark()

    def load_knowledge_base(self):
        """Load documents from the data directory"""
        try:
            # Check if directory exists
            if not os.path.exists(self.data_path):
                os.makedirs(self.data_path)
                print(f"Created data directory at: {self.data_path}")
                return

            # List files in directory
            files = os.listdir(self.data_path)
            if not files:
                print(f"No files found in {self.data_path}")
                return

            # Load different types of documents
            for file in files:
                file_path = os.path.join(self.data_path, file)
                try:
                    if file.endswith('.txt'):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            print(f"Loading {file}...")
                            self.knowledge_base[file] = f.read()
                    elif file.endswith('.json'):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            print(f"Loading {file}...")
                            self.knowledge_base[file] = json.load(f)
                    elif file.endswith('.csv'):
                        print(f"Loading {file}...")
                        self.knowledge_base[file] = pd.read_csv(file_path).to_dict()
                    else:
                        print(f"Skipping unsupported file: {file}")
                except Exception as e:
                    print(f"Error loading {file}: {str(e)}")
                    continue

            print(f"Loaded {len(self.knowledge_base)} files into knowledge base")
            
        except Exception as e:
            print(f"Error loading knowledge base: {str(e)}")

    def format_content_as_html(self, content: str) -> str:
        """Format content with proper HTML tags"""
        # Format code blocks
        content = re.sub(r'```(\w+)?\n(.*?)\n```', r'<pre><code>\2</code></pre>', content, flags=re.DOTALL)
        
        # Format bullet points
        content = re.sub(r'^\s*[-*]\s(.+)$', r'<li>\1</li>', content, flags=re.MULTILINE)
        
        # Format numbered lists
        content = re.sub(r'^\s*(\d+)\.\s(.+)$', r'<li>\1. \2</li>', content, flags=re.MULTILINE)
        
        # Format bold text
        content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', content)
        
        # Format italic text
        content = re.sub(r'_(.*?)_', r'<em>\1</em>', content)
        
        # Wrap lists in ul/ol tags
        content = re.sub(r'(<li>.*?</li>\n*)+', r'<ul>\g<0></ul>', content, flags=re.DOTALL)
        
        # Convert newlines to paragraphs
        content = re.sub(r'\n\n+', '</p><p>', content)
        content = f'<p>{content}</p>'
        
        return content

    def search_context(self, query: str) -> str:
        """Simple context retrieval based on keyword matching with timing"""
        start_time = self.benchmark.start_timer()
        relevant_contexts = []
        
        for source, content in self.knowledge_base.items():
            if isinstance(content, str):
                if query.lower() in content.lower():
                    formatted_content = self.format_content_as_html(content[:500])
                    relevant_contexts.append(f"<div class='source'>{source}</div>{formatted_content}")
            elif isinstance(content, dict):
                content_str = json.dumps(content)
                if query.lower() in content_str.lower():
                    formatted_content = self.format_content_as_html(content_str[:500])
                    relevant_contexts.append(f"<div class='source'>{source}</div>{formatted_content}")

        context_time = self.benchmark.end_timer(start_time)
        result = "<div class='context-section'>" + "\n\n".join(relevant_contexts) + "</div>" if relevant_contexts else ""
        return result, context_time

    def get_enhanced_prompt(self, user_query: str) -> tuple:
        """Create an enhanced prompt with relevant context and timing"""
        start_time = self.benchmark.start_timer()
        context, context_time = self.search_context(user_query)
        
        if context:
            prompt = f"""Based on the following context and the user's question, provide a detailed response. Format your response using HTML tags for better readability:

Context:
{context}

User Question: {user_query}

Please provide a well-structured answer using HTML formatting and the context provided."""
        else:
            prompt = f"Please provide a well-structured answer using HTML formatting for this question: {user_query}"

        total_time = self.benchmark.end_timer(start_time)
        return prompt, context_time, total_time

    def get_benchmark_metrics(self):
        return self.benchmark.get_average_metrics()

    def export_benchmark_data(self, filepath: str = "c:\\AIML\\python-api-1\\benchmark_results.json"):

        self.benchmark.export_metrics(filepath)