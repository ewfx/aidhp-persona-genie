import unittest
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from server import app

class TestServer(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_chat_new_session(self):
        """Test chat endpoint with new session"""
        response = self.app.post('/api/chat',
            json={'message': 'hello', 'session_id': 'test_session_1'})
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['response'], "Hi, I am your financial advisor! How can I help you today?")

    def test_chat_card_recommendation(self):
        """Test chat endpoint for credit card recommendations"""
        response = self.app.post('/api/chat',
            json={'message': 'recommend me a credit card', 'session_id': 'test_session_2'})
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('response', data)
        self.assertIn('credit card', data['response'].lower())

    def test_recommendations_endpoint(self):
        """Test recommendations endpoint"""
        test_user_info = {
            'name': 'Test User',
            'age': 30,
            'gender': 'Male',
            'income': '75000',
            'location': 'New York',
            'interests': ['travel', 'dining'],
            'travelFrequency': 'High',
            'diningFrequency': 'Medium',
            'gamingFrequency': 'Low',
            'socialMediaPost': 'I love traveling!'
        }
        response = self.app.post('/api/recommendations',
            json={'userInfo': test_user_info})
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(isinstance(data, (dict, list)))

    def test_customer_data_endpoint(self):
        """Test customer data endpoint"""
        response = self.app.post('/api/customer',
            json={'customerId': '12345'})
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('status', data)

    def test_card_recommendations_endpoint(self):
        """Test card recommendations endpoint"""
        response = self.app.post('/api/card-recommendations',
            json={'customerId': '12345'})
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('status', data)

    def test_invalid_customer_id(self):
        """Test invalid customer ID handling"""
        response = self.app.post('/api/customer',
            json={'customerId': 'invalid_id'})
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(data['status'], 'error')

    def test_error_handling(self):
        """Test general error handling"""
        response = self.app.post('/api/chat',
            json={'invalid': 'data'})
        self.assertEqual(response.status_code, 500)

if __name__ == '__main__':
    unittest.main()