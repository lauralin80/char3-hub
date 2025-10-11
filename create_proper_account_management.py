#!/usr/bin/env python3
"""
Create a single, proper Account Management board in Char3 workspace
"""

from trello_client import TrelloClient
import time

def create_account_management_board():
    """Create the Account Management board with proper structure"""
    print("📋 Creating Account Management Board in Char3 workspace...")
    
    client = TrelloClient()
    
    # Create the board
    board = client.create_board(
        name="Account Management",
        desc="Account management board for client deliverables and account tasks",
        default_lists=False
    )
    
    print(f"✅ Created: {board['name']} (ID: {board['id']})")
    print(f"🔗 URL: {board['url']}")
    
    # Create the two main task type lists
    task_lists = [
        "📦 Deliverables",
        "👥 Account Tasks"
    ]
    
    for list_name in task_lists:
        task_list = client.create_list(
            board_id=board['id'],
            name=list_name,
            pos="bottom"
        )
        print(f"   📋 Created: {list_name}")
    
    # Create project labels for all active projects
    project_labels = [
        ("iLitigate 2.0", "blue"),
        ("Aurawell", "green"),
        ("FFA Phase 2", "orange"),
        ("Parle", "purple"),
        ("Roth River", "red"),
        ("Quartz Network", "sky")
    ]
    
    for label_name, color in project_labels:
        try:
            label = client.create_label(
                board_id=board['id'],
                name=label_name,
                color=color
            )
            print(f"   🏷️  Created label: {label_name}")
        except Exception as e:
            print(f"   ⚠️  Could not create label {label_name}: {e}")
    
    # Create some sample deliverables
    print("   📦 Creating sample deliverables...")
    deliverables = [
        {
            "name": "User Authentication Demo",
            "desc": "Demo of user authentication flow for client review",
            "due": "2025-02-01T00:00:00.000Z",
            "labels": ["iLitigate 2.0"]
        },
        {
            "name": "Wellness App MVP",
            "desc": "Minimum viable product for wellness tracking features",
            "due": "2025-03-01T00:00:00.000Z",
            "labels": ["Aurawell"]
        },
        {
            "name": "Phase 2 Feature Set",
            "desc": "Complete feature set for phase 2 rollout",
            "due": "2025-02-20T00:00:00.000Z",
            "labels": ["FFA Phase 2"]
        }
    ]
    
    # Get the deliverables list ID
    lists = client.get_board_lists(board['id'])
    deliverables_list = next((lst for lst in lists if lst['name'] == '📦 Deliverables'), None)
    
    if deliverables_list:
        for deliverable in deliverables:
            try:
                card = client.create_card(
                    list_id=deliverables_list['id'],
                    name=deliverable['name'],
                    desc=deliverable['desc']
                )
                
                # Set due date
                if deliverable['due']:
                    client._make_request(
                        f'cards/{card["id"]}',
                        method='PUT',
                        data={'due': deliverable['due']}
                    )
                
                # Add project label
                for label_name in deliverable['labels']:
                    client.add_label_to_card(card['id'], label_name)
                
                print(f"     ✅ Created: {deliverable['name']}")
                
            except Exception as e:
                print(f"     ⚠️  Could not create deliverable {deliverable['name']}: {e}")
    
    # Create some sample account tasks
    print("   👥 Creating sample account tasks...")
    account_tasks = [
        {
            "name": "Client Check-in Call",
            "desc": "Weekly check-in with iLitigate client to discuss progress",
            "due": "2025-01-15T14:00:00.000Z",
            "labels": ["iLitigate 2.0"]
        },
        {
            "name": "Aurawell Requirements Review",
            "desc": "Review and finalize requirements with Aurawell team",
            "due": "2025-01-17T10:00:00.000Z",
            "labels": ["Aurawell"]
        },
        {
            "name": "Monthly Client Reports",
            "desc": "Prepare and send monthly progress reports to all clients",
            "due": "2025-01-31T00:00:00.000Z",
            "labels": []
        }
    ]
    
    # Get the account tasks list ID
    account_tasks_list = next((lst for lst in lists if lst['name'] == '👥 Account Tasks'), None)
    
    if account_tasks_list:
        for task in account_tasks:
            try:
                card = client.create_card(
                    list_id=account_tasks_list['id'],
                    name=task['name'],
                    desc=task['desc']
                )
                
                # Set due date
                if task['due']:
                    client._make_request(
                        f'cards/{card["id"]}',
                        method='PUT',
                        data={'due': task['due']}
                    )
                
                # Add project label
                for label_name in task['labels']:
                    client.add_label_to_card(card['id'], label_name)
                
                print(f"     ✅ Created: {task['name']}")
                
            except Exception as e:
                print(f"     ⚠️  Could not create account task {task['name']}: {e}")
    
    return board

if __name__ == '__main__':
    print("🚀 Creating Account Management Board for Char3 Workspace")
    print("=" * 60)
    
    board = create_account_management_board()
    
    print("\n" + "=" * 60)
    print("🎉 Account Management Board Created!")
    print(f"📋 Board: {board['name']}")
    print(f"🔗 URL: {board['url']}")
    print(f"🆔 ID: {board['id']}")
    
    print(f"\n📋 Structure:")
    print(f"• 📦 Deliverables - Client commitments and deliverables")
    print(f"• 👥 Account Tasks - Internal account management tasks")
    
    print(f"\n🏷️  Project Labels Created:")
    print(f"• iLitigate 2.0, Aurawell, FFA Phase 2, Parle, Roth River, Quartz Network")
    
    print(f"\n💡 Next Steps:")
    print(f"• Set up custom fields manually (see MANUAL_CUSTOM_FIELDS_SETUP.md)")
    print(f"• Use this board for your Monday account management meetings")
    print(f"• Add more deliverables and tasks as needed")
