#!/usr/bin/env python3
"""
Test webhook setup without requiring ngrok
This script will test the webhook creation process
"""

import requests
import json
from config import TrelloConfig

def test_webhook_creation():
    """Test creating a webhook for one board"""
    
    # Test with just the master board first
    board_id = '68e572c6443f3eb8f3009115'  # Master board
    
    # Use the local webhook endpoint for testing
    webhook_url = "http://127.0.0.1:5001/webhook/trello"
    
    auth_params = {
        'key': TrelloConfig.API_KEY,
        'token': TrelloConfig.TOKEN
    }
    
    print("Testing webhook creation...")
    print(f"Board ID: {board_id}")
    print(f"Webhook URL: {webhook_url}")
    print()
    
    try:
        # Test webhook creation
        webhook_data = {
            'description': 'Test webhook for master board',
            'callbackURL': webhook_url,
            'idModel': board_id
        }
        
        response = requests.post(
            'https://api.trello.com/1/webhooks',
            params=auth_params,
            json=webhook_data
        )
        
        if response.status_code == 200:
            webhook = response.json()
            print(f"✅ Successfully created webhook: {webhook['id']}")
            print(f"   Description: {webhook['description']}")
            print(f"   Callback URL: {webhook['callbackURL']}")
            print(f"   Model ID: {webhook['idModel']}")
            return webhook['id']
        else:
            print(f"❌ Failed to create webhook: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating webhook: {e}")
        return None

def list_existing_webhooks():
    """List all existing webhooks"""
    auth_params = {
        'key': TrelloConfig.API_KEY,
        'token': TrelloConfig.TOKEN
    }
    
    try:
        response = requests.get(
            f'https://api.trello.com/1/tokens/{TrelloConfig.TOKEN}/webhooks',
            params=auth_params
        )
        
        if response.status_code == 200:
            webhooks = response.json()
            print(f"Found {len(webhooks)} existing webhooks:")
            for webhook in webhooks:
                print(f"  - {webhook['id']}: {webhook['description']}")
                print(f"    URL: {webhook['callbackURL']}")
                print(f"    Model: {webhook['idModel']}")
                print()
        else:
            print(f"Failed to list webhooks: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error listing webhooks: {e}")

def delete_webhook(webhook_id):
    """Delete a specific webhook"""
    auth_params = {
        'key': TrelloConfig.API_KEY,
        'token': TrelloConfig.TOKEN
    }
    
    try:
        response = requests.delete(
            f'https://api.trello.com/1/webhooks/{webhook_id}',
            params=auth_params
        )
        
        if response.status_code == 200:
            print(f"✅ Deleted webhook {webhook_id}")
        else:
            print(f"❌ Failed to delete webhook {webhook_id}: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error deleting webhook: {e}")

if __name__ == '__main__':
    print("Trello Webhook Test")
    print("==================")
    print()
    
    # List existing webhooks first
    print("Current webhooks:")
    list_existing_webhooks()
    print()
    
    # Test webhook creation
    webhook_id = test_webhook_creation()
    
    if webhook_id:
        print()
        print("Webhook created successfully!")
        print("To set up real webhooks:")
        print("1. Get a free ngrok account: https://dashboard.ngrok.com/signup")
        print("2. Install your authtoken: ngrok config add-authtoken YOUR_TOKEN")
        print("3. Start ngrok: ngrok http 5001")
        print("4. Update setup_webhooks.py with your ngrok URL")
        print("5. Run: python setup_webhooks.py")
        print()
        
        # Ask if user wants to delete the test webhook
        delete_test = input("Delete the test webhook? (y/n): ").lower().strip()
        if delete_test == 'y':
            delete_webhook(webhook_id)
    else:
        print("Webhook creation failed. Check your Trello credentials.")
