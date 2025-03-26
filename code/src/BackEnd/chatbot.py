from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import google.generativeai as genai
import os
from rag_helper import RAGHelper

app = Flask(__name__)
CORS(app)

# Configure Gemini
genai.configure(api_key="AIzaSyC-UJbW3MuU0fT3-JTURxmehgYoDmYN3CU")
model = genai.GenerativeModel('gemini-2.0-flash-lite')

# Initialize RAG helper
# After initializing RAG helper
rag = RAGHelper()

# Add debug logging
print("\nKnowledge Base Status:")
print(f"Data path: {rag.data_path}")
print(f"Loaded files: {list(rag.knowledge_base.keys())}")
print(f"Number of documents: {len(rag.knowledge_base)}\n")

# Store conversation history
chat_histories = {}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Debug incoming request
        print("\n=== New Chat Request ===")
        data = request.json
        user_message = data.get('message')
        session_id = data.get('session_id', 'default')
        print(f"User Message: {user_message}")
        print(f"Session ID: {session_id}")

        # Debug session status
        print(f"\nSession Status:")
        print(f"Active Sessions: {list(chat_histories.keys())}")
        print(f"New Session: {session_id not in chat_histories}")

        # Initialize chat for new sessions
        if session_id not in chat_histories:
            chat_histories[session_id] = model.start_chat(history=[])

        # Debug RAG process
        print("\nRAG Processing:")
        enhanced_prompt, context_time, prep_time = rag.get_enhanced_prompt(user_message)
        print(f"Context Retrieval Time: {context_time:.4f}s")
        print(f"Preparation Time: {prep_time:.4f}s")
        print(f"Enhanced Prompt:\n{enhanced_prompt}\n")

        # Debug Gemini response
        print("\nGemini Processing:")
        start_time = rag.benchmark.start_timer()
        chat = chat_histories[session_id]
        response = chat.send_message(enhanced_prompt)
        response_time = rag.benchmark.end_timer(start_time)
        print(f"Response Time: {response_time:.4f}s")
        print(f"Response Text:\n{response.text}\n")

        # Debug metrics
        token_count = len(enhanced_prompt.split())
        print("\nMetrics:")
        print(f"Token Count: {token_count}")
        print(f"Total Time: {context_time + response_time:.4f}s")

        rag.benchmark.add_metric(
            user_message,
            response_time,
            context_time,
            token_count
        )

        return jsonify({
            'response': response.text,
            'session_id': session_id,
            'metrics': {
                'context_time': context_time,
                'response_time': response_time,
                'total_time': context_time + response_time,
                'token_count': token_count
            }
        })

    except Exception as e:
        print(f"\n=== Error in Chat Endpoint ===")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        import traceback
        print(f"Traceback:\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    return jsonify(rag.get_benchmark_metrics())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)