#!/usr/bin/env python3
"""
Create Account Management board in char3 workspace
This board will have two main task types: Deliverables and Account tasks
"""

from trello_client import TrelloClient
import time

class AccountManagementBoardCreator:
    """Creates the Account Management board for char3 workspace"""
    
    def __init__(self):
        self.client = TrelloClient()
    
    def create_account_management_board(self) -> dict:
        """Create the Account Management board with proper structure"""
        print("📋 Creating Account Management Board...")
        
        board = self.client.create_board(
            name="Account Management",
            desc="Account management board for client deliverables and account tasks",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create the two main task type lists
        task_lists = [
            "📦 Deliverables",
            "👥 Account Tasks"
        ]
        
        for list_name in task_lists:
            task_list = self.client.create_list(
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
                label = self.client.create_label(
                    board_id=board['id'],
                    name=label_name,
                    color=color
                )
                print(f"   🏷️  Created label: {label_name}")
            except Exception as e:
                print(f"   ⚠️  Could not create label {label_name}: {e}")
        
        # Create priority labels
        priority_labels = [
            ("High Priority", "red_dark"),
            ("Medium Priority", "orange"),
            ("Low Priority", "yellow"),
            ("Urgent", "red")
        ]
        
        for label_name, color in priority_labels:
            try:
                label = self.client.create_label(
                    board_id=board['id'],
                    name=label_name,
                    color=color
                )
                print(f"   🏷️  Created label: {label_name}")
            except Exception as e:
                print(f"   ⚠️  Could not create label {label_name}: {e}")
        
        # Create task type labels
        task_type_labels = [
            ("Deliverable", "lime"),
            ("Account Task", "pink"),
            ("Client Meeting", "sky"),
            ("Follow-up", "yellow")
        ]
        
        for label_name, color in task_type_labels:
            try:
                label = self.client.create_label(
                    board_id=board['id'],
                    name=label_name,
                    color=color
                )
                print(f"   🏷️  Created label: {label_name}")
            except Exception as e:
                print(f"   ⚠️  Could not create label {label_name}: {e}")
        
        # Create some sample deliverables
        self.create_sample_deliverables(board['id'])
        
        # Create some sample account tasks
        self.create_sample_account_tasks(board['id'])
        
        return board
    
    def create_sample_deliverables(self, board_id: str):
        """Create sample deliverable cards"""
        print("   📦 Creating sample deliverables...")
        
        deliverables = [
            {
                "name": "User Authentication Demo",
                "desc": "Demo of user authentication flow for client review",
                "due": "2025-02-01T00:00:00.000Z",
                "labels": ["iLitigate 2.0", "Deliverable", "High Priority"]
            },
            {
                "name": "Dashboard Prototype",
                "desc": "Interactive prototype of the main dashboard",
                "due": "2025-02-15T00:00:00.000Z",
                "labels": ["iLitigate 2.0", "Deliverable", "Medium Priority"]
            },
            {
                "name": "Wellness App MVP",
                "desc": "Minimum viable product for wellness tracking features",
                "due": "2025-03-01T00:00:00.000Z",
                "labels": ["Aurawell", "Deliverable", "High Priority"]
            },
            {
                "name": "Health Tracking Features",
                "desc": "Core health tracking functionality",
                "due": "2025-02-22T00:00:00.000Z",
                "labels": ["Aurawell", "Deliverable", "Medium Priority"]
            },
            {
                "name": "Phase 2 Feature Set",
                "desc": "Complete feature set for phase 2 rollout",
                "due": "2025-02-20T00:00:00.000Z",
                "labels": ["FFA Phase 2", "Deliverable", "High Priority"]
            },
            {
                "name": "Integration Testing",
                "desc": "Comprehensive integration testing results",
                "due": "2025-02-25T00:00:00.000Z",
                "labels": ["FFA Phase 2", "Deliverable", "Medium Priority"]
            },
            {
                "name": "Mobile App Launch",
                "desc": "Launch of mobile application to app stores",
                "due": "2025-02-12T00:00:00.000Z",
                "labels": ["Parle", "Deliverable", "High Priority"]
            },
            {
                "name": "User Onboarding Flow",
                "desc": "Complete user onboarding experience",
                "due": "2025-02-28T00:00:00.000Z",
                "labels": ["Parle", "Deliverable", "Medium Priority"]
            },
            {
                "name": "Roth River Analytics",
                "desc": "Analytics dashboard for Roth River project",
                "due": "2025-03-05T00:00:00.000Z",
                "labels": ["Roth River", "Deliverable", "High Priority"]
            },
            {
                "name": "Quartz Network API",
                "desc": "API documentation and testing suite",
                "due": "2025-03-10T00:00:00.000Z",
                "labels": ["Quartz Network", "Deliverable", "Medium Priority"]
            }
        ]
        
        # Get the deliverables list ID
        lists = self.client.get_board_lists(board_id)
        deliverables_list = next((lst for lst in lists if lst['name'] == '📦 Deliverables'), None)
        
        if deliverables_list:
            for deliverable in deliverables:
                try:
                    card = self.client.create_card(
                        list_id=deliverables_list['id'],
                        name=deliverable['name'],
                        desc=deliverable['desc']
                    )
                    
                    # Set due date separately
                    if deliverable['due']:
                        self.client._make_request(
                            f'cards/{card["id"]}',
                            method='PUT',
                            data={'due': deliverable['due']}
                        )
                    
                    # Add labels
                    for label_name in deliverable['labels']:
                        self.client.add_label_to_card(card['id'], label_name)
                    
                    print(f"     ✅ Created: {deliverable['name']}")
                    
                except Exception as e:
                    print(f"     ⚠️  Could not create deliverable {deliverable['name']}: {e}")
    
    def create_sample_account_tasks(self, board_id: str):
        """Create sample account task cards"""
        print("   👥 Creating sample account tasks...")
        
        account_tasks = [
            {
                "name": "Client Check-in Call",
                "desc": "Weekly check-in with iLitigate client to discuss progress",
                "due": "2025-01-15T14:00:00.000Z",
                "labels": ["iLitigate 2.0", "Account Task", "Client Meeting", "High Priority"]
            },
            {
                "name": "Update Project Timeline",
                "desc": "Update project timeline based on latest development progress",
                "due": "2025-01-16T00:00:00.000Z",
                "labels": ["iLitigate 2.0", "Account Task", "Medium Priority"]
            },
            {
                "name": "Aurawell Requirements Review",
                "desc": "Review and finalize requirements with Aurawell team",
                "due": "2025-01-17T10:00:00.000Z",
                "labels": ["Aurawell", "Account Task", "Client Meeting", "High Priority"]
            },
            {
                "name": "FFA Phase 2 Kickoff",
                "desc": "Kickoff meeting for FFA Phase 2 project",
                "due": "2025-01-18T09:00:00.000Z",
                "labels": ["FFA Phase 2", "Account Task", "Client Meeting", "High Priority"]
            },
            {
                "name": "Parle Demo Preparation",
                "desc": "Prepare demo materials for Parle client presentation",
                "due": "2025-01-19T00:00:00.000Z",
                "labels": ["Parle", "Account Task", "Medium Priority"]
            },
            {
                "name": "Roth River Contract Review",
                "desc": "Review contract terms and deliverables for Roth River",
                "due": "2025-01-20T00:00:00.000Z",
                "labels": ["Roth River", "Account Task", "High Priority"]
            },
            {
                "name": "Quartz Network Follow-up",
                "desc": "Follow up on Quartz Network proposal and next steps",
                "due": "2025-01-21T00:00:00.000Z",
                "labels": ["Quartz Network", "Account Task", "Follow-up", "Medium Priority"]
            },
            {
                "name": "Monthly Client Reports",
                "desc": "Prepare and send monthly progress reports to all clients",
                "due": "2025-01-31T00:00:00.000Z",
                "labels": ["Account Task", "High Priority"]
            }
        ]
        
        # Get the account tasks list ID
        lists = self.client.get_board_lists(board_id)
        account_tasks_list = next((lst for lst in lists if lst['name'] == '👥 Account Tasks'), None)
        
        if account_tasks_list:
            for task in account_tasks:
                try:
                    card = self.client.create_card(
                        list_id=account_tasks_list['id'],
                        name=task['name'],
                        desc=task['desc']
                    )
                    
                    # Set due date separately
                    if task['due']:
                        self.client._make_request(
                            f'cards/{card["id"]}',
                            method='PUT',
                            data={'due': task['due']}
                        )
                    
                    # Add labels
                    for label_name in task['labels']:
                        self.client.add_label_to_card(card['id'], label_name)
                    
                    print(f"     ✅ Created: {task['name']}")
                    
                except Exception as e:
                    print(f"     ⚠️  Could not create account task {task['name']}: {e}")

def main():
    """Create the Account Management board"""
    print("🚀 Creating Account Management Board for Char3 Workspace")
    print("=" * 60)
    
    creator = AccountManagementBoardCreator()
    board = creator.create_account_management_board()
    
    print("\n" + "=" * 60)
    print("🎉 Account Management Board Created!")
    print(f"📋 Board: {board['name']}")
    print(f"🔗 URL: {board['url']}")
    print(f"🆔 ID: {board['id']}")
    
    print(f"\n📋 Structure:")
    print(f"• 📦 Deliverables - Client commitments and deliverables")
    print(f"• 👥 Account Tasks - Internal account management tasks")
    
    print(f"\n🏷️  Labels Created:")
    print(f"• Project Labels: iLitigate 2.0, Aurawell, FFA Phase 2, Parle, Roth River, Quartz Network")
    print(f"• Priority Labels: High Priority, Medium Priority, Low Priority, Urgent")
    print(f"• Task Type Labels: Deliverable, Account Task, Client Meeting, Follow-up")
    
    print(f"\n💡 Usage:")
    print(f"• Use Deliverables list for client commitments with due dates")
    print(f"• Use Account Tasks list for internal account management work")
    print(f"• Add project labels to track which client each item belongs to")
    print(f"• Use priority labels to indicate urgency")
    
    return board

if __name__ == '__main__':
    main()
