#!/usr/bin/env python3
"""
Trello Webhook Handler
Receives webhook notifications from Trello and updates the frontend in real-time
"""

from flask import Flask, request, jsonify
from trello_client import TrelloClient
import json
import logging
from typing import Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrelloWebhookHandler:
    """Handles incoming webhook notifications from Trello"""
    
    def __init__(self):
        self.client = TrelloClient()
        
        # Board IDs for your 6-board structure
        self.boards = {
            'weekly_planning': '68e572002006cc67fa8d92c6',
            'design': '68e57202502c6ecc0ddac4ed', 
            'ux_review': '68e572b90e5306124115d227',
            'ilitigate_dev': '68e56a57b40a3273ba4d09e6',
            'master': '68e572c6443f3eb8f3009115',
            'account_management': '68e95255081b416a51143bc6'
        }
        
        # Track active webhooks
        self.active_webhooks = {}
    
    def create_webhook(self, board_id: str, callback_url: str) -> Dict[str, Any]:
        """Create a webhook for a specific board"""
        try:
            webhook_data = {
                'description': f'Webhook for board {board_id}',
                'callbackURL': callback_url,
                'idModel': board_id
            }
            
            webhook = self.client._make_request(
                'webhooks',
                method='POST',
                data=webhook_data
            )
            
            logger.info(f"Created webhook {webhook['id']} for board {board_id}")
            return webhook
            
        except Exception as e:
            logger.error(f"Failed to create webhook for board {board_id}: {e}")
            raise
    
    def setup_all_webhooks(self, base_url: str) -> Dict[str, str]:
        """Set up webhooks for all boards"""
        webhook_url = f"{base_url}/webhook/trello"
        webhooks = {}
        
        for board_name, board_id in self.boards.items():
            try:
                webhook = self.create_webhook(board_id, webhook_url)
                webhooks[board_name] = webhook['id']
                self.active_webhooks[webhook['id']] = {
                    'board_id': board_id,
                    'board_name': board_name
                }
            except Exception as e:
                logger.error(f"Failed to setup webhook for {board_name}: {e}")
        
        return webhooks
    
    def handle_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming webhook data"""
        try:
            action = webhook_data.get('action', {})
            action_type = action.get('type')
            model = webhook_data.get('model', {})
            
            logger.info(f"Received webhook: {action_type} on {model.get('name', 'Unknown')}")
            
            # Process different types of actions
            if action_type == 'createCard':
                return self._handle_card_created(action, model)
            elif action_type == 'updateCard':
                return self._handle_card_updated(action, model)
            elif action_type == 'moveCardFromBoard':
                return self._handle_card_moved(action, model)
            elif action_type == 'deleteCard':
                return self._handle_card_deleted(action, model)
            elif action_type == 'addMemberToCard':
                return self._handle_member_added(action, model)
            elif action_type == 'removeMemberFromCard':
                return self._handle_member_removed(action, model)
            else:
                logger.info(f"Unhandled action type: {action_type}")
                return {'status': 'ignored', 'action_type': action_type}
                
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def _handle_card_created(self, action: Dict, model: Dict) -> Dict[str, Any]:
        """Handle card creation"""
        card_data = action.get('data', {}).get('card', {})
        list_data = action.get('data', {}).get('list', {})
        
        return {
            'status': 'success',
            'action': 'card_created',
            'card_id': card_data.get('id'),
            'card_name': card_data.get('name'),
            'list_name': list_data.get('name'),
            'board_id': model.get('id'),
            'board_name': model.get('name')
        }
    
    def _handle_card_updated(self, action: Dict, model: Dict) -> Dict[str, Any]:
        """Handle card updates"""
        card_data = action.get('data', {}).get('card', {})
        old_data = action.get('data', {}).get('old', {})
        
        return {
            'status': 'success',
            'action': 'card_updated',
            'card_id': card_data.get('id'),
            'card_name': card_data.get('name'),
            'changes': {
                'name': old_data.get('name'),
                'desc': old_data.get('desc'),
                'due': old_data.get('due'),
                'idList': old_data.get('idList')
            },
            'board_id': model.get('id'),
            'board_name': model.get('name')
        }
    
    def _handle_card_moved(self, action: Dict, model: Dict) -> Dict[str, Any]:
        """Handle card movement between boards"""
        card_data = action.get('data', {}).get('card', {})
        list_data = action.get('data', {}).get('list', {})
        
        return {
            'status': 'success',
            'action': 'card_moved',
            'card_id': card_data.get('id'),
            'card_name': card_data.get('name'),
            'new_list': list_data.get('name'),
            'board_id': model.get('id'),
            'board_name': model.get('name')
        }
    
    def _handle_card_deleted(self, action: Dict, model: Dict) -> Dict[str, Any]:
        """Handle card deletion"""
        card_data = action.get('data', {}).get('card', {})
        
        return {
            'status': 'success',
            'action': 'card_deleted',
            'card_id': card_data.get('id'),
            'card_name': card_data.get('name'),
            'board_id': model.get('id'),
            'board_name': model.get('name')
        }
    
    def _handle_member_added(self, action: Dict, model: Dict) -> Dict[str, Any]:
        """Handle member added to card"""
        card_data = action.get('data', {}).get('card', {})
        member_data = action.get('data', {}).get('member', {})
        
        return {
            'status': 'success',
            'action': 'member_added',
            'card_id': card_data.get('id'),
            'card_name': card_data.get('name'),
            'member_id': member_data.get('id'),
            'member_name': member_data.get('fullName'),
            'board_id': model.get('id'),
            'board_name': model.get('name')
        }
    
    def _handle_member_removed(self, action: Dict, model: Dict) -> Dict[str, Any]:
        """Handle member removed from card"""
        card_data = action.get('data', {}).get('card', {})
        member_data = action.get('data', {}).get('member', {})
        
        return {
            'status': 'success',
            'action': 'member_removed',
            'card_id': card_data.get('id'),
            'card_name': card_data.get('name'),
            'member_id': member_data.get('id'),
            'member_name': member_data.get('fullName'),
            'board_id': model.get('id'),
            'board_name': model.get('name')
        }

# Flask app for webhook handling
app = Flask(__name__)
webhook_handler = TrelloWebhookHandler()

@app.route('/webhook/trello', methods=['POST'])
def trello_webhook():
    """Endpoint to receive Trello webhooks"""
    try:
        webhook_data = request.get_json()
        
        if not webhook_data:
            return jsonify({'error': 'No data received'}), 400
        
        # Process the webhook
        result = webhook_handler.handle_webhook(webhook_data)
        
        # Here you would typically:
        # 1. Update your database/cache
        # 2. Send real-time updates to connected clients (WebSocket/SSE)
        # 3. Trigger any business logic
        
        logger.info(f"Webhook processed: {result}")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/webhook/setup', methods=['POST'])
def setup_webhooks():
    """Endpoint to set up all webhooks"""
    try:
        base_url = request.json.get('base_url', 'http://localhost:5001')
        webhooks = webhook_handler.setup_all_webhooks(base_url)
        
        return jsonify({
            'status': 'success',
            'webhooks': webhooks,
            'message': f'Set up {len(webhooks)} webhooks'
        }), 200
        
    except Exception as e:
        logger.error(f"Webhook setup error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
