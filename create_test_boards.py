#!/usr/bin/env python3
"""
Create test boards for the project management system
These will be private boards for testing purposes
"""

from trello_client import TrelloClient
from typing import List, Dict
import time

class TestBoardCreator:
    """Creates test boards for the project management system"""
    
    def __init__(self):
        self.client = TrelloClient()
    
    def create_master_test_board(self) -> Dict:
        """Create the master test board with milestones and workflow"""
        print("🏗️  Creating Master Test Board...")
        
        # Create the master board
        board = self.client.create_board(
            name="🧪 TEST - Master Project Board",
            desc="Test board for project management system - PRIVATE TESTING ONLY",
            default_lists=False
        )
        
        print(f"✅ Created board: {board['name']} (ID: {board['id']})")
        
        # Create milestone lists
        milestone_lists = []
        for i in range(1, 16):  # 15 milestones
            list_name = f"🎯 Milestone {i}: Feature Set {i}"
            milestone_list = self.client.create_list(
                board_id=board['id'],
                name=list_name,
                pos="top"
            )
            milestone_lists.append(milestone_list)
            print(f"   📋 Created: {list_name}")
        
        # Create workflow lists
        workflow_lists = [
            "📋 Backlog",
            "🎨 Design Components", 
            "🔧 UX Review",
            "💻 Development",
            "✨ Polish",
            "✅ Complete"
        ]
        
        for list_name in workflow_lists:
            workflow_list = self.client.create_list(
                board_id=board['id'],
                name=list_name,
                pos="bottom"
            )
            print(f"   📋 Created: {list_name}")
        
        # Create labels for filtering
        labels = [
            ("Client A", "blue"),
            ("Client B", "green"), 
            ("Client C", "orange"),
            ("Designer", "purple"),
            ("UX", "yellow"),
            ("Developer", "red"),
            ("Component", "sky"),
            ("Feature", "lime"),
            ("High Priority", "red_dark"),
            ("Medium Priority", "orange"),
            ("Low Priority", "yellow")
        ]
        
        for label_name, color in labels:
            try:
                label = self.client.create_label(
                    board_id=board['id'],
                    name=label_name,
                    color=color
                )
                print(f"   🏷️  Created label: {label_name} ({color})")
            except Exception as e:
                print(f"   ⚠️  Could not create label {label_name}: {e}")
        
        return board
    
    def create_planning_test_board(self) -> Dict:
        """Create the weekly planning test board"""
        print("\n📅 Creating Planning Test Board...")
        
        # Create the planning board
        board = self.client.create_board(
            name="🧪 TEST - Weekly Planning Board",
            desc="Test board for weekly planning - PRIVATE TESTING ONLY",
            default_lists=False
        )
        
        print(f"✅ Created board: {board['name']} (ID: {board['id']})")
        
        # Create day lists
        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        for day in days:
            day_list = self.client.create_list(
                board_id=board['id'],
                name=day,
                pos="bottom"
            )
            print(f"   📅 Created: {day}")
        
        # Create some sample planning cards
        sample_cards = [
            ("Work on authentication features", "Sunday"),
            ("Review dashboard UX", "Monday"),
            ("Build component library", "Tuesday"),
            ("Client meeting prep", "Wednesday"),
            ("Polish user onboarding", "Thursday"),
            ("Testing and bug fixes", "Friday"),
            ("Week review and planning", "Saturday")
        ]
        
        for card_name, day in sample_cards:
            # Find the list for this day
            lists = self.client.get_board_lists(board['id'])
            day_list = next((lst for lst in lists if lst['name'] == day), None)
            
            if day_list:
                card = self.client.create_card(
                    list_id=day_list['id'],
                    name=card_name,
                    desc=f"Sample planning card for {day}\n\nRelated to: [Link to master board feature]"
                )
                print(f"   📝 Created card: {card_name} in {day}")
        
        return board
    
    def create_sample_feature_cards(self, master_board_id: str):
        """Create sample feature cards in the master board"""
        print("\n📝 Creating Sample Feature Cards...")
        
        # Get the backlog list
        lists = self.client.get_board_lists(master_board_id)
        backlog_list = next((lst for lst in lists if lst['name'] == "📋 Backlog"), None)
        
        if not backlog_list:
            print("❌ Could not find Backlog list")
            return
        
        # Sample features for different milestones
        sample_features = [
            {
                "name": "User Authentication System",
                "desc": "Complete user login/logout functionality\n\nMilestone: 1\nClient: Client A\nAssignee: Developer\nPriority: High",
                "milestone": "1",
                "client": "Client A",
                "assignee": "Developer",
                "priority": "High Priority"
            },
            {
                "name": "Dashboard Component Library",
                "desc": "Build reusable dashboard components\n\nMilestone: 1\nClient: Client A\nAssignee: Designer\nPriority: High",
                "milestone": "1", 
                "client": "Client A",
                "assignee": "Designer",
                "priority": "High Priority"
            },
            {
                "name": "Data Visualization Charts",
                "desc": "Create interactive charts and graphs\n\nMilestone: 2\nClient: Client B\nAssignee: Developer\nPriority: Medium",
                "milestone": "2",
                "client": "Client B", 
                "assignee": "Developer",
                "priority": "Medium Priority"
            },
            {
                "name": "Mobile Responsive Design",
                "desc": "Ensure all components work on mobile\n\nMilestone: 3\nClient: Client A\nAssignee: UX\nPriority: Medium",
                "milestone": "3",
                "client": "Client A",
                "assignee": "UX", 
                "priority": "Medium Priority"
            },
            {
                "name": "API Integration Layer",
                "desc": "Connect frontend to backend APIs\n\nMilestone: 2\nClient: Client C\nAssignee: Developer\nPriority: High",
                "milestone": "2",
                "client": "Client C",
                "assignee": "Developer",
                "priority": "High Priority"
            }
        ]
        
        for feature in sample_features:
            card = self.client.create_card(
                list_id=backlog_list['id'],
                name=feature['name'],
                desc=feature['desc']
            )
            print(f"   📝 Created: {feature['name']} (Milestone {feature['milestone']})")
            
            # Add labels (if the label system works)
            try:
                # This would need to be implemented based on Trello's label system
                pass
            except Exception as e:
                print(f"   ⚠️  Could not add labels: {e}")
    
    def create_all_test_boards(self):
        """Create all test boards"""
        print("🚀 Creating Test Boards for Project Management System")
        print("=" * 60)
        
        # Create master board
        master_board = self.create_master_test_board()
        
        # Create planning board  
        planning_board = self.create_planning_test_board()
        
        # Add sample features to master board
        self.create_sample_feature_cards(master_board['id'])
        
        print("\n" + "=" * 60)
        print("🎉 Test Boards Created Successfully!")
        print(f"📋 Master Board: {master_board['name']}")
        print(f"   ID: {master_board['id']}")
        print(f"   URL: {master_board['url']}")
        print(f"\n📅 Planning Board: {planning_board['name']}")
        print(f"   ID: {planning_board['id']}")
        print(f"   URL: {planning_board['url']}")
        
        print(f"\n🔧 Next Steps:")
        print(f"1. Update MASTER_BOARD_ID in website_dashboard.py to: {master_board['id']}")
        print(f"2. Test the dynamic views system")
        print(f"3. Customize the boards for your actual projects")
        
        return {
            'master_board': master_board,
            'planning_board': planning_board
        }

def main():
    """Main function to create test boards"""
    try:
        creator = TestBoardCreator()
        boards = creator.create_all_test_boards()
        return boards
    except Exception as e:
        print(f"❌ Error creating test boards: {e}")
        return None

if __name__ == "__main__":
    main()


