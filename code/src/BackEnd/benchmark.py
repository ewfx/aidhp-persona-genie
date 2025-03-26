
import time
from typing import Dict, List
from datetime import datetime

class ChatbotBenchmark:
    def __init__(self):
        self.metrics = {
            'response_times': [],
            'context_retrieval_times': [],
            'token_counts': [],
            'queries': []
        }

    def start_timer(self) -> float:
        return time.time()

    def end_timer(self, start_time: float) -> float:
        return time.time() - start_time

    def add_metric(self, query: str, response_time: float, context_time: float, token_count: int):
        self.metrics['queries'].append({
            'timestamp': datetime.now().isoformat(),
            'query': query,
            'response_time': response_time,
            'context_time': context_time,
            'token_count': token_count
        })
        self.metrics['response_times'].append(response_time)
        self.metrics['context_retrieval_times'].append(context_time)
        self.metrics['token_counts'].append(token_count)

    def get_average_metrics(self) -> Dict:
        if not self.metrics['response_times']:
            return {'error': 'No metrics available'}
        
        return {
            'avg_response_time': sum(self.metrics['response_times']) / len(self.metrics['response_times']),
            'avg_context_time': sum(self.metrics['context_retrieval_times']) / len(self.metrics['context_retrieval_times']),
            'avg_token_count': sum(self.metrics['token_counts']) / len(self.metrics['token_counts']),
            'total_queries': len(self.metrics['queries'])
        }

    def export_metrics(self, filepath: str):
        import json
        with open(filepath, 'w') as f:
            json.dump(self.metrics, f, indent=2)