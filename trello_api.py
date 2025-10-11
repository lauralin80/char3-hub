#!/usr/bin/env python3
"""
Trello API Integration for Frontend
Handles all frontend-to-Trello operations (create, update, move cards)
"""

from flask import Flask, request, jsonify
from trello_client import TrelloClient
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrelloAPIService:
    """Service for handling frontend-to-Trello operations"""
    
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
        
        # Day columns for weekly planning
        self.weekly_columns = {
            'sunday': 'Sunday',
            'monday': 'Monday', 
            'tuesday': 'Tuesday',
            'wednesday': 'Wednesday',
            'thursday': 'Thursday',
            'friday': 'Friday',
            'saturday': 'Saturday'
        }
        
        # Project labels mapping
        self.project_labels = {
            'ilitigate': 'iLitigate 2.0',
            'aurawell': 'Aurawell',
            'ffa': 'FFA Phase 2',
            'parle': 'Parle',
            'roth': 'Roth River',
            'quartz': 'Quartz Network'
        }
    
    def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new task card"""
        try:
            # Determine which board to create the card on
            board_id = self._get_board_id_for_task(task_data)
            list_id = self._get_list_id_for_task(task_data, board_id)
            
            # Prepare card data
            card_data = {
                'name': task_data.get('title', 'New Task'),
                'desc': task_data.get('description', ''),
                'idList': list_id,
                'pos': 'bottom'
            }
            
            # Add due date if provided
            if task_data.get('due_date'):
                card_data['due'] = task_data['due_date']
            
            # Create the card
            card = self.client._make_request(
                f'cards',
                method='POST',
                data=card_data
            )
            
            # Add labels (project, effort, etc.)
            self._add_labels_to_card(card['id'], task_data)
            
            # Add members if specified
            if task_data.get('assignee'):
                self._add_member_to_card(card['id'], task_data['assignee'])
            
            # If this is a master task, also create on master board
            if board_id != self.boards['master']:
                self._sync_to_master_board(card, task_data)
            
            logger.info(f"Created task: {card['name']} on board {board_id}")
            
            return {
                'status': 'success',
                'card_id': card['id'],
                'card_name': card['name'],
                'board_id': board_id
            }
            
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def update_task(self, card_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing task card"""
        try:
            # Prepare update data
            update_data = {}
            
            if 'title' in updates:
                update_data['name'] = updates['title']
            if 'description' in updates:
                update_data['desc'] = updates['description']
            if 'due_date' in updates:
                update_data['due'] = updates['due_date']
            
            # Update the card
            if update_data:
                self.client._make_request(
                    f'cards/{card_id}',
                    method='PUT',
                    data=update_data
                )
            
            # Update labels if needed
            if 'project' in updates or 'effort' in updates:
                self._update_card_labels(card_id, updates)
            
            # Update assignee if needed
            if 'assignee' in updates:
                self._update_card_assignee(card_id, updates['assignee'])
            
            logger.info(f"Updated task: {card_id}")
            
            return {'status': 'success', 'card_id': card_id}
            
        except Exception as e:
            logger.error(f"Failed to update task: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def move_task(self, card_id: str, target_board: str, target_list: str = None) -> Dict[str, Any]:
        """Move a task to a different board/list"""
        try:
            target_board_id = self.boards.get(target_board)
            if not target_board_id:
                return {'status': 'error', 'message': f'Unknown board: {target_board}'}
            
            # Get target list ID
            if target_list:
                target_list_id = self._get_list_id_by_name(target_board_id, target_list)
            else:
                # Get the first list (usually "To Do" or similar)
                lists = self.client.get_board_lists(target_board_id)
                target_list_id = lists[0]['id'] if lists else None
            
            if not target_list_id:
                return {'status': 'error', 'message': f'No list found on board {target_board}'}
            
            # Move the card
            self.client._make_request(
                f'cards/{card_id}',
                method='PUT',
                data={
                    'idBoard': target_board_id,
                    'idList': target_list_id
                }
            )
            
            logger.info(f"Moved task {card_id} to {target_board}/{target_list}")
            
            return {
                'status': 'success',
                'card_id': card_id,
                'target_board': target_board,
                'target_list': target_list
            }
            
        except Exception as e:
            logger.error(f"Failed to move task: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def create_deliverable(self, deliverable_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new deliverable"""
        try:
            # Create on account management board
            board_id = self.boards['account_management']
            list_id = self._get_list_id_by_name(board_id, '📦 Deliverables')
            
            card_data = {
                'name': deliverable_data.get('title', 'New Deliverable'),
                'desc': deliverable_data.get('description', ''),
                'idList': list_id,
                'pos': 'bottom'
            }
            
            if deliverable_data.get('due_date'):
                card_data['due'] = deliverable_data['due_date']
            
            card = self.client._make_request(
                f'cards',
                method='POST',
                data=card_data
            )
            
            # Set custom field values
            self._set_custom_field_values(card['id'], {
                'Task Type': 'Deliverable',
                'Project': deliverable_data.get('project', ''),
                'Priority': deliverable_data.get('priority', 'Medium'),
                'Status': 'Not Started'
            })
            
            logger.info(f"Created deliverable: {card['name']}")
            
            return {
                'status': 'success',
                'card_id': card['id'],
                'card_name': card['name']
            }
            
        except Exception as e:
            logger.error(f"Failed to create deliverable: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def _get_board_id_for_task(self, task_data: Dict[str, Any]) -> str:
        """Determine which board a task should be created on"""
        task_type = task_data.get('type', '').lower()
        
        if task_type == 'design':
            return self.boards['design']
        elif task_type == 'ux':
            return self.boards['ux_review']
        elif task_type == 'development':
            return self.boards['ilitigate_dev']  # Default to iLitigate for now
        else:
            return self.boards['master']  # Default to master
    
    def _get_list_id_for_task(self, task_data: Dict[str, Any], board_id: str) -> str:
        """Get the appropriate list ID for a task"""
        # For weekly planning, use the specified day
        if board_id == self.boards['weekly_planning']:
            day = task_data.get('day', 'monday').lower()
            return self._get_list_id_by_name(board_id, self.weekly_columns[day])
        
        # For other boards, use the first list (usually "To Do")
        lists = self.client.get_board_lists(board_id)
        return lists[0]['id'] if lists else None
    
    def _get_list_id_by_name(self, board_id: str, list_name: str) -> Optional[str]:
        """Get list ID by name"""
        lists = self.client.get_board_lists(board_id)
        for list_item in lists:
            if list_item['name'] == list_name:
                return list_item['id']
        return None
    
    def _add_labels_to_card(self, card_id: str, task_data: Dict[str, Any]):
        """Add labels to a card"""
        labels_to_add = []
        
        # Add project label
        if task_data.get('project'):
            project_label = self._get_or_create_label(
                self.boards['master'], 
                self.project_labels.get(task_data['project'], task_data['project'])
            )
            if project_label:
                labels_to_add.append(project_label['id'])
        
        # Add effort label
        if task_data.get('effort'):
            effort_label = self._get_or_create_label(
                self.boards['master'],
                f"Effort: {task_data['effort'].upper()}"
            )
            if effort_label:
                labels_to_add.append(effort_label['id'])
        
        # Add task type label
        if task_data.get('type'):
            type_label = self._get_or_create_label(
                self.boards['master'],
                f"Type: {task_data['type'].title()}"
            )
            if type_label:
                labels_to_add.append(type_label['id'])
        
        # Apply labels
        for label_id in labels_to_add:
            try:
                self.client._make_request(
                    f'cards/{card_id}/idLabels',
                    method='POST',
                    data={'value': label_id}
                )
            except Exception as e:
                logger.warning(f"Failed to add label {label_id} to card {card_id}: {e}")
    
    def _get_or_create_label(self, board_id: str, label_name: str) -> Optional[Dict]:
        """Get existing label or create new one"""
        try:
            # Get existing labels
            labels = self.client._make_request(f'boards/{board_id}/labels')
            
            # Check if label exists
            for label in labels:
                if label['name'] == label_name:
                    return label
            
            # Create new label
            label_data = {'name': label_name, 'color': 'blue'}
            new_label = self.client._make_request(
                f'boards/{board_id}/labels',
                method='POST',
                data=label_data
            )
            
            return new_label
            
        except Exception as e:
            logger.error(f"Failed to get/create label {label_name}: {e}")
            return None
    
    def _add_member_to_card(self, card_id: str, assignee: str):
        """Add a member to a card"""
        try:
            # This would need to map assignee names to Trello member IDs
            # For now, we'll skip this as it requires member management
            logger.info(f"Would add member {assignee} to card {card_id}")
        except Exception as e:
            logger.warning(f"Failed to add member to card: {e}")
    
    def _set_custom_field_values(self, card_id: str, field_values: Dict[str, str]):
        """Set custom field values on a card"""
        try:
            # Get the board ID from the card
            card = self.client._make_request(f'cards/{card_id}')
            board_id = card['idBoard']
            
            # Get all custom fields for the board
            custom_fields = self.client._make_request(f'boards/{board_id}/customFields')
            
            # Set each custom field value
            for field_name, field_value in field_values.items():
                if not field_value:  # Skip empty values
                    continue
                    
                # Find the custom field by name
                custom_field = next((cf for cf in custom_fields if cf['name'] == field_name), None)
                
                if custom_field:
                    # Set the custom field value
                    field_data = {
                        'value': {'text': field_value}
                    }
                    
                    self.client._make_request(
                        f'cards/{card_id}/customField/{custom_field["id"]}/item',
                        method='PUT',
                        data=field_data
                    )
                    
                    logger.info(f"Set {field_name} = {field_value} on card {card_id}")
                else:
                    logger.warning(f"Custom field '{field_name}' not found on board")
                    
        except Exception as e:
            logger.error(f"Failed to set custom field values on card {card_id}: {e}")
    
    def _sync_to_master_board(self, card: Dict, task_data: Dict):
        """Sync a card to the master board"""
        try:
            # Create a copy on the master board
            master_list_id = self._get_list_id_by_name(
                self.boards['master'], 
                'All Tasks'
            )
            
            if master_list_id:
                master_card_data = {
                    'name': f"[{task_data.get('type', 'Task').upper()}] {card['name']}",
                    'desc': card.get('desc', ''),
                    'idList': master_list_id,
                    'pos': 'bottom'
                }
                
                master_card = self.client._make_request(
                    f'cards',
                    method='POST',
                    data=master_card_data
                )
                
                # Set custom field values on master card
                self._set_custom_field_values(master_card['id'], {
                    'Task Type': task_data.get('type', 'Task'),
                    'Project': task_data.get('project', ''),
                    'Priority': task_data.get('priority', 'Medium'),
                    'Status': 'Not Started'
                })
                
                logger.info(f"Synced card to master board: {master_card['name']}")
                
        except Exception as e:
            logger.error(f"Failed to sync to master board: {e}")

# Flask app for API endpoints
app = Flask(__name__)
api_service = TrelloAPIService()

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        task_data = request.get_json()
        result = api_service.create_task(task_data)
        return jsonify(result), 200 if result['status'] == 'success' else 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/tasks/<card_id>', methods=['PUT'])
def update_task(card_id):
    """Update an existing task"""
    try:
        updates = request.get_json()
        result = api_service.update_task(card_id, updates)
        return jsonify(result), 200 if result['status'] == 'success' else 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/tasks/<card_id>/move', methods=['POST'])
def move_task(card_id):
    """Move a task to a different board/list"""
    try:
        move_data = request.get_json()
        result = api_service.move_task(
            card_id, 
            move_data.get('target_board'),
            move_data.get('target_list')
        )
        return jsonify(result), 200 if result['status'] == 'success' else 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/deliverables', methods=['POST'])
def create_deliverable():
    """Create a new deliverable"""
    try:
        deliverable_data = request.get_json()
        result = api_service.create_deliverable(deliverable_data)
        return jsonify(result), 200 if result['status'] == 'success' else 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5003)
