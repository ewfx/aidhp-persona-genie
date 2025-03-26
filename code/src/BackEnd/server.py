from flask import Flask, request, jsonify,render_template,send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import json
import pandas as pd
import os
# Add to imports at the top
from rag_helper import RAGHelper

# Add after genai configuration
# Initialize RAG helper
rag = RAGHelper()

# Add debug logging
print("\nKnowledge Base Status:")
print(f"Data path: {rag.data_path}")
print(f"Loaded files: {list(rag.knowledge_base.keys())}")
print(f"Number of documents: {len(rag.knowledge_base)}\n")
app = Flask(__name__)
CORS(app)
app.static_folder = os.path.abspath('data')
app.static_url_path = '/data/images'
# Configure Gemini
genai.configure(api_key="AIzaSyC-UJbW3MuU0fT3-JTURxmehgYoDmYN3CU")
path = "data/" 
creditcard_portfolio= pd.read_json(path + 'creditcard_portfolio.json' )
investment_portfolio = pd.read_json(path + 'investment_portfolio.json')
gemini_model = genai.GenerativeModel("gemini-2.0-flash-lite")

def sentimental_analysis_gemini(text):
    if not text:
        return "neutral"
    try:
        response = gemini_model.generate_content(
            f"Analyze the sentiment of the following text: \"{text}\". Determine whether the sentiment is positive, negative, or neutral."
        )
        return response.text.strip()
    except Exception as e:
        return f"Error: {str(e)}"

def generate_card_recommendations(profile_data, sentiment_data):
    prompt_template = """
    You are a smart financial assistant. Suggest credit cards based on:
    
    User Profile:
    - Name: {name}
    - Age: {age}
    - Gender: {gender}
    - Income: {income}
    - Location: {location}
    - Interests: {interests}
    
    Activity Frequencies:
    - Travel: {travel_freq}
    - Dining: {dining_freq}
    - Gaming: {gaming_freq}
    
    Sentiment Analysis: {sentiment}

    Suggest cards with these considerations:
    1. Location-based perks (local cashback, dining deals, travel benefits)
    2. Interest-aligned rewards
    3. Usage frequency bonuses
    4. Income-appropriate card recommendations

    Suggestions must be categorized among these card_portfolio:
    {creditcard_portfolio}

    Return only in this JSON format:
    {{
        "name": "Card Name",
        "description": "Detailed card benefits and why it matches the user"
        "color": "random color based on company cards html code",
        "imageUrl": "get it from above card_portfolio json"
    }}
    """

    try:
        formatted_prompt = prompt_template.format(
            name=profile_data.get('name'),
            age=profile_data.get('age'),
            gender=profile_data.get('gender'),
            income=profile_data.get('income', 'Not specified'),
            location=profile_data.get('location'),
            interests=', '.join(profile_data.get('interests', [])),
            travel_freq=profile_data.get('travelFrequency', 'Not specified'),
            dining_freq=profile_data.get('diningFrequency', 'Not specified'),
            gaming_freq=profile_data.get('gamingFrequency', 'Not specified'),
            sentiment=sentiment_data,
            profile_data=json.dumps(profile_data),
            creditcard_portfolio=creditcard_portfolio.to_string()  
        )

        response = gemini_model.generate_content(formatted_prompt)
        response_text = response.text.strip()
        # Clean up any special characters and format JSON properly
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        # print(response_text)
        # Parse the response and ensure it matches the frontend format
        recommendations = json.loads(response_text)
        # if not isinstance(recommendations, list):
        #     recommendations = [recommendations]
            
        return recommendations

    except Exception as e:
        print(f"Error generating recommendations: {str(e)}")
        return []

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    try:
        data = request.json.get('userInfo', {})
        
        # Analyze sentiment if social media post exists
        sentiment = sentimental_analysis_gemini(data.get('socialMediaPost', ''))
        
        # Generate recommendations
        recommendations = generate_card_recommendations(data, sentiment)
        
        return jsonify(recommendations)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add after the existing imports and before other code
with open(path + 'customer_data.json', 'r') as f:
    customer_data = json.load(f)

# Add after existing imports
from routes.card_recommendations import get_card_recommendations

# Add after loading customer_data
with open(path + 'customer_transactions.json', 'r') as f:
    transactions_data = json.load(f)

# Add before app.run
@app.route('/api/card-recommendations', methods=['POST'])
def get_customer_card_recommendations():
    try:
        data = request.json
        customer_id = data.get('customerId')
        
        # Get customer data
        customer = next((c for c in customer_data['customers'] 
                        if c['customerId'] == customer_id), None)
        
        if not customer:
            return jsonify({
                'status': 'error',
                'message': 'Customer not found'
            }), 404
            
        # Get recommendations
        recommendations = get_card_recommendations(
            customer, 
            transactions_data, 
            creditcard_portfolio,
            gemini_model
        )
        
        return jsonify({
            'status': 'success',
            'data': recommendations
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/customer', methods=['POST'])
def get_customer_data():
    try:
        data = request.json
        card_number = data.get('cardNumber')
        customer_id = data.get('customerId')
        
        for customer in customer_data['customers']:
            if (customer.get('creditCardNumber') == card_number or 
                customer.get('customerId') == customer_id):
                return jsonify({
                    'status': 'success',
                    'data': {
                        'name': customer['name'],
                        'customerId': customer['customerId'],
                        'creditCardNumber': customer.get('creditCardNumber', ''),
                        'cardName': customer.get('cardName', ''),
                        'accountNumber': customer['accountNumber'],
                        'location': customer['location'],
                        'income': customer['income']
                    }
                })
        
        return jsonify({
            'status': 'error',
            'message': 'Customer not found'
        }), 404
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500



# Store conversation history
chat_histories = {}
with open(path + 'user_transactions.json', 'r') as f:
    user_transactions_data = json.load(f)
# Add new route before app.run
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        session_id = data.get('session_id', 'default')
        print(f"User Message: {user_message}")
        print(f"Session ID: {session_id}")

        # Initialize chat for new sessions with greeting
        if session_id not in chat_histories:
            chat_histories[session_id] = gemini_model.start_chat(history=[])
            user_message= """
    You are a professional financial advisor at Wells Fargo Bank.
    
    Maintain a formal, professional tone at all times. Focus solely on providing accurate financial advice and recommendations.

    You will be interacting with a bank user and you need to give it insightful replies.

    When asked for a cards recommendation, suggest 2 to 3 cards according to user interest.
   
    When asked about investments or investment plans, suggest from these options:
    {investment_portfolio}

    Suggestions must be from within these cards:
    {creditcard_portfolio}



    In case of recommendation, do also provide reasons behind the recommendation.

    Keep the chat human-like. In case user changes their interest, make sure to update recommendation in subsequent responses.

    DOnt act the user for too many preferences .Incase of less profile data or no profile data, make generic suggestions.

    If asked for transaction details, provide them from this json:
    {transactions_data}

      Keep responses:
    - Professional and direct
    - Focused on financial matters
    - Based on provided data only
    - Free of personal anecdotes or humor

"""
            
            chat = chat_histories[session_id]
            response = chat.send_message(user_message.format(
                creditcard_portfolio=creditcard_portfolio.to_string(),
                investment_portfolio=investment_portfolio.to_string(),
                transactions_data=json.dumps(user_transactions_data)
            ))
            
            return jsonify({
                'response': "Hi, I am your financial advisor! How can I help you today?",
                'session_id': session_id
            })

        # Check if message is about credit card recommendations
        # if any(keyword in user_message.lower() for keyword in ['credit card', 'card recommendation', 'recommend card']):
        #     try:
        #         # Use existing card recommendation logic
        #         recommendations = generate_card_recommendations({
        #             'name': 'User',
        #             'age': 30,
        #             'income': 'Not specified',
        #             'location': 'Not specified',
        #             'interests': [],
        #             'travelFrequency': 'Medium',
        #             'diningFrequency': 'Medium',
        #             'gamingFrequency': 'Low'
        #         }, 'neutral')
                
        #         # Format recommendations as chat response
        #         response_text = "Here are my credit card recommendations:\n\n"
        #         if isinstance(recommendations, dict):
        #             response_text += f"• {recommendations['name']}: {recommendations['description']}\n"
        #         elif isinstance(recommendations, list):
        #             for rec in recommendations:
        #                 response_text += f"• {rec['name']}: {rec['description']}\n"
                
        #         return jsonify({
        #             'response': response_text,
        #             'session_id': session_id
        #         })
            
        #     except Exception as e:
        #         print(f"Error in card recommendations: {str(e)}")
        #         return jsonify({
        #             'response': "I apologize, but I encountered an error while generating card recommendations. Please try again.",
        #             'session_id': session_id
        #         })

        # Normal chat flow with RAG
        enhanced_prompt = rag.get_enhanced_prompt(user_message)
        chat = chat_histories[session_id]
        response = chat.send_message(user_message)
        cleaned_response = response.text.strip()

        return jsonify({
            'response': cleaned_response,
            'session_id': session_id
        })

    except Exception as e:
        print(f"Error in chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    return jsonify(rag.get_benchmark_metrics())

# @app.route('/')
# def home():
#     return render_template('index.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)