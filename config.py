import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TrelloConfig:
    # Your Trello API credentials
    API_KEY = "c31098c5e8f0950912fc406cafee00b6"
    SECRET = "db8162b4741e199546c61f5771b09420d5f2d9edcd7da5863e96ab86b015f709"
    TOKEN = os.getenv('TRELLO_TOKEN')  # We'll get this from the authorization flow
    
    # Environment-based configuration
    IS_PRODUCTION = os.getenv('VERCEL') == '1'  # Vercel sets this automatically
    BASE_URL = os.getenv('BASE_URL', 'http://localhost:8080')
    
    @classmethod
    def get_redirect_origins(cls):
        """Get appropriate redirect origins based on environment"""
        if cls.IS_PRODUCTION:
            # For Vercel deployment - update this with your actual domain
            return [
                "https://your-project-name.vercel.app",
                "https://your-custom-domain.com"
            ]
        else:
            # For local development
            return [
                "http://localhost:8080",
                "http://127.0.0.1:8080"
            ]
    
    @classmethod
    def validate(cls):
        """Validate that required Trello credentials are present"""
        if not cls.API_KEY:
            raise ValueError("TRELLO_API_KEY is required")
        if not cls.SECRET:
            raise ValueError("TRELLO_SECRET is required")
        return True
