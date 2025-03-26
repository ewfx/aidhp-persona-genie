import google.generativeai as genai
import json
import pandas as pd

def load_credit_card_portfolio(path):
    return pd.read_json(path + 'creditcard_portfolio.json')

def analyze_transactions(customer_id, transactions_data):
    customer_transactions = [t for t in transactions_data['transactions'] 
                           if t['customerId'] == customer_id]
    
    spending_pattern = {
        'travel': sum(t['amount'] for t in customer_transactions if t['type'] == 'Travel'),
        'dining': sum(t['amount'] for t in customer_transactions if t['type'] in ['Dining', 'Food Delivery']),
        'shopping': sum(t['amount'] for t in customer_transactions if t['type'] == 'Shopping'),
        'entertainment': sum(t['amount'] for t in customer_transactions if t['type'] == 'Entertainment')
    }
    
    return spending_pattern

def get_card_recommendations(customer_data, transactions_data, creditcard_portfolio, gemini_model):
    try:
        spending_pattern = analyze_transactions(customer_data['customerId'], transactions_data)
        
        prompt_template = """
        You are a smart financial assistant. Suggest credit cards based on:
        
        Customer Profile:
        - Name: {name}
        - Income: {income}
        - Location: {location}
        - Current Card: {current_card}
        
        Spending Pattern (Last 30 days):
        - Travel Spending: ${travel_spend}
        - Dining Spending: ${dining_spend}
        - Shopping Spending: ${shopping_spend}
        - Entertainment Spending: ${entertainment_spend}
        
        Suggestions must be categorized among these card_portfolio:
        {card_portfolio}
        
        Provide recommendations considering:
        1. Spending patterns and rewards alignment
        2. Income level appropriateness
        3. Location-based benefits
        4. Current card comparison
        
        Return in JSON format:
        {{
            "recommendations": [
                {{
                    "name": "Card Name",
                    "description": "Why this card matches the customer's profile",
                    "key_benefits": ["benefit1", "benefit2"],
                    "potential_savings": "estimated annual savings based on spending",
                    "imageUrl": "get it from above card_portfolio json"
                }}
            ]
        }}
        """
        
        formatted_prompt = prompt_template.format(
            name=customer_data['name'],
            income=customer_data['income'],
            location=customer_data['location'],
            current_card=customer_data['cardName'],
            travel_spend=spending_pattern['travel'],
            dining_spend=spending_pattern['dining'],
            shopping_spend=spending_pattern['shopping'],
            entertainment_spend=spending_pattern['entertainment'],
            card_portfolio=creditcard_portfolio.to_string()
        )
        # print(formatted_prompt);
        response = gemini_model.generate_content(formatted_prompt)
        # print(response.text);
        response_text = response.text.replace('```json', '').replace('```', '').strip()
        recommendations = json.loads(response_text)
        
        return recommendations
        
    except Exception as e:
        print(f"Error generating recommendations: {str(e)}")
        return {"recommendations": []}