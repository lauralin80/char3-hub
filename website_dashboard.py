from flask import Flask, render_template, jsonify, request
from trello_views import TrelloViewManager
from trello_api import TrelloAPIService
import os

app = Flask(__name__)

# Initialize Trello view manager with your master board ID
MASTER_BOARD_ID = "68e56778e2931588d2c49693"  # Test master board ID

# Get the token from environment
TRELLO_TOKEN = os.getenv('TRELLO_TOKEN')
if not TRELLO_TOKEN:
    raise ValueError("TRELLO_TOKEN environment variable is required")

view_manager = TrelloViewManager(MASTER_BOARD_ID)
api_service = TrelloAPIService()

@app.route('/')
def dashboard():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/views')
def get_views():
    """Get all available views"""
    views = view_manager.get_all_views()
    return jsonify([{
        'name': view.name,
        'filters': view.filters,
        'card_count': len(view.cards),
        'milestone_count': len(view.milestones)
    } for view in views])

@app.route('/api/view/<view_type>/<view_value>')
def get_view(view_type, view_value):
    """Get specific view data"""
    if view_type == 'client':
        view = view_manager.create_client_view(view_value)
    elif view_type == 'milestone':
        view = view_manager.create_milestone_view(int(view_value))
    elif view_type == 'team':
        view = view_manager.create_team_view(view_value)
    elif view_type == 'project':
        view = view_manager.create_project_view(view_value)
    else:
        return jsonify({'error': 'Invalid view type'}), 400
    
    return jsonify({
        'name': view.name,
        'filters': view.filters,
        'cards': view.cards,
        'milestones': view.milestones
    })

@app.route('/api/milestones')
def get_milestones():
    """Get all milestones with progress"""
    data = view_manager._get_board_data()
    lists = data['lists']
    cards = data['cards']
    
    milestones = []
    for list_item in lists:
        if 'Milestone' in list_item['name']:
            milestone_cards = [card for card in cards if card['idList'] == list_item['id']]
            progress = view_manager._calculate_milestone_progress(milestone_cards)
            
            milestones.append({
                'name': list_item['name'],
                'id': list_item['id'],
                'progress': progress,
                'total_cards': len(milestone_cards),
                'completed_cards': len([card for card in milestone_cards if card['closed']])
            })
    
    return jsonify(milestones)

@app.route('/api/progress')
def get_overall_progress():
    """Get overall project progress"""
    data = view_manager._get_board_data()
    cards = data['cards']
    
    total_cards = len(cards)
    completed_cards = len([card for card in cards if card['closed']])
    
    # Group by milestone
    milestone_progress = {}
    for card in cards:
        milestone = view_manager._get_custom_field_value(card, 'Milestone')
        if milestone:
            if milestone not in milestone_progress:
                milestone_progress[milestone] = {'total': 0, 'completed': 0}
            milestone_progress[milestone]['total'] += 1
            if card['closed']:
                milestone_progress[milestone]['completed'] += 1
    
    # Calculate percentages
    for milestone in milestone_progress:
        total = milestone_progress[milestone]['total']
        completed = milestone_progress[milestone]['completed']
        milestone_progress[milestone]['percentage'] = (completed / total * 100) if total > 0 else 0
    
    return jsonify({
        'overall_progress': (completed_cards / total_cards * 100) if total_cards > 0 else 0,
        'total_cards': total_cards,
        'completed_cards': completed_cards,
        'milestone_progress': milestone_progress
    })

# API endpoints for frontend-to-Trello operations
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

@app.route('/api/account-management')
def get_account_management_data():
    """Get data from the Account Management board"""
    try:
        from trello_client import TrelloClient
        client = TrelloClient()
        
        # Get the Account Management board
        board_id = '68e95255081b416a51143bc6'
        board = client.get_board(board_id)
        lists = client.get_board_lists(board_id)
        cards = client.get_board_cards(board_id)
        
        # Organize data by lists
        deliverables = []
        account_tasks = []
        
        # Get custom fields for the board
        try:
            custom_fields = client._make_request(f'boards/{board_id}/customFields')
            print(f"Custom fields found: {len(custom_fields)}")
            
            # Build a mapping of custom field options
            custom_field_options = {}
            for cf in custom_fields:
                if 'options' in cf:
                    custom_field_options[cf['id']] = {opt['id']: opt['value']['text'] for opt in cf['options']}
                else:
                    custom_field_options[cf['id']] = {}
        except Exception as e:
            print(f"Error fetching custom fields: {e}")
            custom_fields = []
            custom_field_options = {}
        
        for card in cards:
            # Find which list the card is in
            card_list = next((lst for lst in lists if lst['id'] == card['idList']), None)
            
            if card_list:
                # Get custom field values for this card
                custom_field_values = {}
                try:
                    card_custom_fields = client._make_request(f'cards/{card["id"]}/customFieldItems')
                    for cf_item in card_custom_fields:
                        # Find the custom field definition
                        cf_def = next((cf for cf in custom_fields if cf['id'] == cf_item['idCustomField']), None)
                        if cf_def:
                            # Check if this field has options and use idValue to get the text
                            if cf_item.get('idValue') and cf_def['id'] in custom_field_options:
                                option_id = cf_item['idValue']
                                if option_id in custom_field_options[cf_def['id']]:
                                    value = custom_field_options[cf_def['id']][option_id]
                                    custom_field_values[cf_def['name']] = value
                            elif cf_item.get('value'):
                                # Handle different custom field types for non-option fields
                                if isinstance(cf_item['value'], dict):
                                    value = cf_item['value'].get('text', '')
                                else:
                                    value = str(cf_item['value'])
                                custom_field_values[cf_def['name']] = value
                except Exception as e:
                    print(f"Error fetching custom fields for card {card['id']}: {e}")
                    # Continue without custom fields if there's an error
                
                card_data = {
                    'id': card['id'],
                    'name': card['name'],
                    'desc': card.get('desc', ''),
                    'due': card.get('due', ''),
                    'url': card.get('url', ''),
                    'labels': [{'name': label['name'], 'color': label.get('color', 'grey')} for label in card.get('labels', [])],
                    'customFields': custom_field_values,
                    'members': [member.get('fullName', member.get('username', '')) for member in card.get('members', [])]
                }
                
                if 'Deliverables' in card_list['name']:
                    deliverables.append(card_data)
                elif 'Account Tasks' in card_list['name']:
                    account_tasks.append(card_data)
        
        return jsonify({
            'status': 'success',
            'deliverables': deliverables,
            'account_tasks': account_tasks,
            'board_name': board['name'],
            'board_url': board['url']
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Webhook endpoint for Trello
@app.route('/webhook/trello', methods=['POST'])
def trello_webhook():
    """Endpoint to receive Trello webhooks"""
    try:
        webhook_data = request.get_json()
        print(f"Received webhook: {webhook_data}")
        
        # Process the webhook data
        if webhook_data:
            action = webhook_data.get('action', {})
            action_type = action.get('type')
            model = webhook_data.get('model', {})
            
            print(f"Action: {action_type} on {model.get('name', 'Unknown')}")
            
            # Here you would typically:
            # 1. Update your database/cache
            # 2. Send real-time updates to connected clients (WebSocket/SSE)
            # 3. Trigger any business logic
            
            return jsonify({'status': 'success'}), 200
        else:
            return jsonify({'error': 'No data received'}), 400
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
