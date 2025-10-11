#!/usr/bin/env python3
"""
Update Account Management board to use custom fields instead of labels
This will create proper custom fields for Task Type, Project, Priority, etc.
"""

from trello_client import TrelloClient
import time

class AccountManagementCustomFields:
    """Updates Account Management board with custom fields"""
    
    def __init__(self):
        self.client = TrelloClient()
        self.board_id = '68e9491ab86c4d02b5cdd889'  # Account Management board
    
    def create_custom_fields(self):
        """Create custom fields for the Account Management board"""
        print("🔧 Creating custom fields for Account Management board...")
        
        # Define custom fields
        custom_fields = [
            {
                'name': 'Task Type',
                'type': 'list',
                'options': [
                    {'text': 'Deliverable', 'color': 'lime'},
                    {'text': 'Account Task', 'color': 'pink'},
                    {'text': 'Client Meeting', 'color': 'sky'},
                    {'text': 'Follow-up', 'color': 'yellow'}
                ]
            },
            {
                'name': 'Project',
                'type': 'list',
                'options': [
                    {'text': 'iLitigate 2.0', 'color': 'blue'},
                    {'text': 'Aurawell', 'color': 'green'},
                    {'text': 'FFA Phase 2', 'color': 'orange'},
                    {'text': 'Parle', 'color': 'purple'},
                    {'text': 'Roth River', 'color': 'red'},
                    {'text': 'Quartz Network', 'color': 'sky'}
                ]
            },
            {
                'name': 'Priority',
                'type': 'list',
                'options': [
                    {'text': 'High', 'color': 'red_dark'},
                    {'text': 'Medium', 'color': 'orange'},
                    {'text': 'Low', 'color': 'yellow'},
                    {'text': 'Urgent', 'color': 'red'}
                ]
            },
            {
                'name': 'Status',
                'type': 'list',
                'options': [
                    {'text': 'Not Started', 'color': 'gray'},
                    {'text': 'In Progress', 'color': 'blue'},
                    {'text': 'Review', 'color': 'yellow'},
                    {'text': 'Complete', 'color': 'green'}
                ]
            }
        ]
        
        created_fields = {}
        
        for field_def in custom_fields:
            try:
                # Create the custom field
                field_data = {
                    'name': field_def['name'],
                    'type': field_def['type'],
                    'idModel': self.board_id,
                    'modelType': 'board'
                }
                
                field = self.client._make_request(
                    'customFields',
                    method='POST',
                    data=field_data
                )
                
                field_id = field['id']
                created_fields[field_def['name']] = field_id
                
                print(f"   ✅ Created custom field: {field_def['name']}")
                
                # Add options for list-type fields
                if field_def['type'] == 'list':
                    for option in field_def['options']:
                        try:
                            option_data = {
                                'value': {
                                    'text': option['text'],
                                    'color': option['color']
                                }
                            }
                            
                            self.client._make_request(
                                f'customFields/{field_id}/options',
                                method='POST',
                                data=option_data
                            )
                            
                            print(f"     📋 Added option: {option['text']}")
                            
                        except Exception as e:
                            print(f"     ⚠️  Could not add option {option['text']}: {e}")
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"   ❌ Could not create custom field {field_def['name']}: {e}")
        
        return created_fields
    
    def update_existing_cards(self, custom_fields):
        """Update existing cards with custom field values"""
        print("\n🔄 Updating existing cards with custom field values...")
        
        # Get all cards from the board
        cards = self.client.get_board_cards(self.board_id)
        
        for card in cards:
            try:
                # Get card details to see which list it's in
                card_details = self.client._make_request(f'cards/{card["id"]}')
                list_id = card_details['idList']
                
                # Get list name to determine task type
                lists = self.client.get_board_lists(self.board_id)
                list_name = next((lst['name'] for lst in lists if lst['id'] == list_id), 'Unknown')
                
                # Set Task Type based on list
                if 'Deliverables' in list_name:
                    task_type = 'Deliverable'
                elif 'Account Tasks' in list_name:
                    task_type = 'Account Task'
                else:
                    task_type = 'Account Task'  # Default
                
                # Set custom field values
                updates = {
                    'customFieldItems': []
                }
                
                # Task Type
                if 'Task Type' in custom_fields:
                    updates['customFieldItems'].append({
                        'idCustomField': custom_fields['Task Type'],
                        'value': {'text': task_type}
                    })
                
                # Priority (default to Medium for existing cards)
                if 'Priority' in custom_fields:
                    updates['customFieldItems'].append({
                        'idCustomField': custom_fields['Priority'],
                        'value': {'text': 'Medium'}
                    })
                
                # Status (default to Not Started)
                if 'Status' in custom_fields:
                    updates['customFieldItems'].append({
                        'idCustomField': custom_fields['Status'],
                        'value': {'text': 'Not Started'}
                    })
                
                # Update the card
                if updates['customFieldItems']:
                    self.client._make_request(
                        f'cards/{card["id"]}',
                        method='PUT',
                        data=updates
                    )
                    
                    print(f"   ✅ Updated: {card['name']} (Task Type: {task_type})")
                
                time.sleep(0.3)  # Rate limiting
                
            except Exception as e:
                print(f"   ⚠️  Could not update card {card['name']}: {e}")
    
    def clean_up_old_labels(self):
        """Remove the old labels that are now replaced by custom fields"""
        print("\n🧹 Cleaning up old labels...")
        
        # Labels to remove (keep project labels for now)
        labels_to_remove = [
            'Deliverable',
            'Account Task', 
            'Client Meeting',
            'Follow-up',
            'High Priority',
            'Medium Priority',
            'Low Priority',
            'Urgent'
        ]
        
        # Get all labels
        labels = self.client.get_board_labels(self.board_id)
        
        for label in labels:
            if label['name'] in labels_to_remove:
                try:
                    self.client._make_request(
                        f'labels/{label["id"]}',
                        method='DELETE'
                    )
                    print(f"   🗑️  Removed label: {label['name']}")
                except Exception as e:
                    print(f"   ⚠️  Could not remove label {label['name']}: {e}")

def main():
    """Update Account Management board with custom fields"""
    print("🔧 Updating Account Management Board with Custom Fields")
    print("=" * 60)
    
    updater = AccountManagementCustomFields()
    
    # Create custom fields
    custom_fields = updater.create_custom_fields()
    
    # Update existing cards
    updater.update_existing_cards(custom_fields)
    
    # Clean up old labels
    updater.clean_up_old_labels()
    
    print("\n" + "=" * 60)
    print("🎉 Account Management Board Updated!")
    
    print(f"\n🔧 Custom Fields Created:")
    print(f"• Task Type: Deliverable, Account Task, Client Meeting, Follow-up")
    print(f"• Project: iLitigate 2.0, Aurawell, FFA Phase 2, Parle, Roth River, Quartz Network")
    print(f"• Priority: High, Medium, Low, Urgent")
    print(f"• Status: Not Started, In Progress, Review, Complete")
    
    print(f"\n💡 Benefits of Custom Fields:")
    print(f"• Structured data that's easy to filter and sort")
    print(f"• Consistent values across all cards")
    print(f"• Better for reporting and analytics")
    print(f"• Can be used in your custom frontend for filtering")
    
    print(f"\n🏷️  Labels Kept:")
    print(f"• Project labels (iLitigate 2.0, Aurawell, etc.) for flexible tagging")
    print(f"• Can add additional labels for specific needs")

if __name__ == '__main__':
    main()
