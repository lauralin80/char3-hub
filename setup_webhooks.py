#!/usr/bin/env python3
"""
Setup script for Trello webhooks
This script will set up webhooks for all your boards to enable real-time updates
"""

import requests
import json
from config import TrelloConfig

def setup_webhooks():
    """Set up webhooks for all boards"""
    
    # Your board IDs
    boards = {
        'weekly_planning': '68e572002006cc67fa8d92c6',
        'design': '68e57202502c6ecc0ddac4ed', 
        'ux_review': '68e572b90e5306124115d227',
        'ilitigate_dev': '68e56a57b40a3273ba4d09e6',
        'master': '68e572c6443f3eb8f3009115',
        'account_management': '61e8298e9d60b874fe92af31'
    }
    
    # Webhook URL - update this with your actual domain
    # For local development, you can use ngrok or similar
    webhook_url = "https://your-ngrok-url.ngrok.io/webhook/trello"  # Update this!
    
    # For production, use your actual domain
    # webhook_url = "https://your-domain.com/webhook/trello"
    
    auth_params = {
        'key': TrelloConfig.API_KEY,
        'token': TrelloConfig.TOKEN
    }
    
    print("Setting up Trello webhooks...")
    print(f"Webhook URL: {webhook_url}")
    print()
    
    created_webhooks = {}
    
    for board_name, board_id in boards.items():
        try:
            # Create webhook
            webhook_data = {
                'description': f'Webhook for {board_name} board',
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
                created_webhooks[board_name] = webhook['id']
                print(f"✅ Created webhook for {board_name}: {webhook['id']}")
            else:
                print(f"❌ Failed to create webhook for {board_name}: {response.text}")
                
        except Exception as e:
            print(f"❌ Error creating webhook for {board_name}: {e}")
    
    print()
    print("Webhook setup complete!")
    print(f"Created {len(created_webhooks)} webhooks")
    
    # Save webhook IDs for reference
    with open('webhook_ids.json', 'w') as f:
        json.dump(created_webhooks, f, indent=2)
    
    print("Webhook IDs saved to webhook_ids.json")
    
    return created_webhooks

def list_existing_webhooks():
    """List all existing webhooks"""
    auth_params = {
        'key': TrelloConfig.API_KEY,
        'token': TrelloConfig.TOKEN
    }
    
    try:
        response = requests.get(
            'https://api.trello.com/1/tokens/{}/webhooks'.format(TrelloConfig.TOKEN),
            params=auth_params
        )
        
        if response.status_code == 200:
            webhooks = response.json()
            print(f"Found {len(webhooks)} existing webhooks:")
            for webhook in webhooks:
                print(f"  - {webhook['id']}: {webhook['description']} -> {webhook['callbackURL']}")
        else:
            print(f"Failed to list webhooks: {response.text}")
            
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
            print(f"❌ Failed to delete webhook {webhook_id}: {response.text}")
            
    except Exception as e:
        print(f"Error deleting webhook: {e}")

if __name__ == '__main__':
    print("Trello Webhook Setup")
    print("===================")
    print()
    
    # List existing webhooks first
    print("Current webhooks:")
    list_existing_webhooks()
    print()
    
    # Ask user if they want to proceed
    proceed = input("Do you want to create new webhooks? (y/n): ").lower().strip()
    
    if proceed == 'y':
        # Update the webhook URL before running
        print()
        print("⚠️  IMPORTANT: Update the webhook_url in this script before running!")
        print("   For local development, use ngrok or similar tunneling service")
        print("   For production, use your actual domain")
        print()
        
        confirm = input("Have you updated the webhook URL? (y/n): ").lower().strip()
        if confirm == 'y':
            setup_webhooks()
        else:
            print("Please update the webhook_url and run again.")
    else:
        print("Webhook setup cancelled.")
