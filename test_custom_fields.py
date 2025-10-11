#!/usr/bin/env python3

import os

TRELLO_TOKEN = os.getenv('TRELLO_TOKEN')
if not TRELLO_TOKEN:
    print("Please set TRELLO_TOKEN environment variable")
    exit(1)

from trello_client import TrelloClient

def test_custom_fields():
    client = TrelloClient()
    board_id = '68e95255081b416a51143bc6'  # Account Management board
    
    print("=== Testing Custom Fields ===")
    
    try:
        # Get custom fields
        custom_fields = client._make_request(f'boards/{board_id}/customFields')
        print(f"Found {len(custom_fields)} custom fields:")
        
        for cf in custom_fields:
            print(f"\nField: {cf['name']} (ID: {cf['id']})")
            print(f"Type: {cf.get('type', 'unknown')}")
            print(f"Full definition: {cf}")
            
            # Check if it has options
            if 'options' in cf:
                print(f"Options: {cf['options']}")
            else:
                print("No options found")
        
        # Get a sample card to see custom field items
        cards = client._make_request(f'boards/{board_id}/cards')
        if cards:
            sample_card = cards[0]
            print(f"\n=== Sample Card: {sample_card['name']} ===")
            
            card_custom_fields = client._make_request(f'cards/{sample_card["id"]}/customFieldItems')
            print(f"Custom field items: {card_custom_fields}")
            
            for cf_item in card_custom_fields:
                print(f"Item: {cf_item}")
                if cf_item.get('idValue'):
                    print(f"  idValue: {cf_item['idValue']}")
                if cf_item.get('value'):
                    print(f"  value: {cf_item['value']}")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_custom_fields()
