#!/usr/bin/env python3
"""
Redesign the test boards with a cleaner structure
- Remove 15 milestone columns (too overwhelming)
- Create project-specific filtered views
- Keep simple workflow lists
"""

from trello_client import TrelloClient
import time

class BoardRedesigner:
    """Redesigns the test boards with a cleaner structure"""
    
    def __init__(self):
        self.client = TrelloClient()
    
    def redesign_master_board(self, board_id: str):
        """Redesign the master board with a cleaner structure"""
        print("🔄 Redesigning Master Board...")
        
        # Get current lists
        lists = self.client.get_board_lists(board_id)
        
        # Delete all the milestone lists (keep only workflow lists)
        workflow_lists = ["📋 Backlog", "🎨 Design Components", "🔧 UX Review", "💻 Development", "✨ Polish", "✅ Complete"]
        
        for list_item in lists:
            if "Milestone" in list_item['name']:
                # Archive the milestone list instead of deleting
                try:
                    self.client._make_request(f"lists/{list_item['id']}/closed", method='PUT', data={'value': 'true'})
                    print(f"   📦 Archived: {list_item['name']}")
                except Exception as e:
                    print(f"   ⚠️  Could not archive {list_item['name']}: {e}")
        
        # Create a single "Milestones" list for milestone tracking
        try:
            milestones_list = self.client.create_list(
                board_id=board_id,
                name="🎯 Milestones",
                pos="top"
            )
            print(f"   📋 Created: 🎯 Milestones")
        except Exception as e:
            print(f"   ⚠️  Could not create Milestones list: {e}")
        
        # Create milestone cards (these will be filtered by project)
        milestone_cards = [
            "🎯 Milestone 1: Core Authentication (Due: March 15)",
            "🎯 Milestone 2: Dashboard Features (Due: March 30)", 
            "🎯 Milestone 3: Data Visualization (Due: April 15)",
            "🎯 Milestone 4: Mobile Optimization (Due: April 30)",
            "🎯 Milestone 5: API Integration (Due: May 15)",
            "🎯 Milestone 6: Testing & QA (Due: May 30)",
            "🎯 Milestone 7: Performance Optimization (Due: June 15)",
            "🎯 Milestone 8: Security Hardening (Due: June 30)",
            "🎯 Milestone 9: Documentation (Due: July 15)",
            "🎯 Milestone 10: User Training (Due: July 30)",
            "🎯 Milestone 11: Deployment Prep (Due: August 15)",
            "🎯 Milestone 12: Go-Live (Due: August 30)",
            "🎯 Milestone 13: Post-Launch Support (Due: September 15)",
            "🎯 Milestone 14: Feature Enhancements (Due: September 30)",
            "🎯 Milestone 15: Project Closure (Due: October 15)"
        ]
        
        # Get the milestones list
        lists = self.client.get_board_lists(board_id)
        milestones_list = next((lst for lst in lists if lst['name'] == "🎯 Milestones"), None)
        
        if milestones_list:
            for milestone_card in milestone_cards:
                try:
                    card = self.client.create_card(
                        list_id=milestones_list['id'],
                        name=milestone_card,
                        desc=f"Milestone tracking card\n\nProject: iLitigate\nClient: Client A\nStatus: Planning"
                    )
                    print(f"   📝 Created: {milestone_card}")
                except Exception as e:
                    print(f"   ⚠️  Could not create milestone card: {e}")
        
        print("✅ Master board redesigned!")
    
    def create_project_filtered_boards(self, master_board_id: str):
        """Create project-specific filtered views that look like separate boards"""
        print("\n🎯 Creating Project Filtered Views...")
        
        # Create a board for each project that acts as a filtered view
        projects = [
            {
                "name": "iLitigate Development",
                "client": "Client A",
                "description": "Filtered view of iLitigate project from master board"
            },
            {
                "name": "RothRiver Development", 
                "client": "Client B",
                "description": "Filtered view of RothRiver project from master board"
            },
            {
                "name": "ParentMD Development",
                "client": "Client C", 
                "description": "Filtered view of ParentMD project from master board"
            }
        ]
        
        created_boards = []
        
        for project in projects:
            try:
                # Create a project board
                board = self.client.create_board(
                    name=f"📋 {project['name']}",
                    desc=f"{project['description']}\n\nThis is a filtered view of the master board for {project['client']}",
                    default_lists=False
                )
                
                print(f"✅ Created: {board['name']} (ID: {board['id']})")
                
                # Create the same workflow lists
                workflow_lists = [
                    "🎯 Milestones",
                    "📋 Backlog", 
                    "🎨 Design Components",
                    "🔧 UX Review",
                    "💻 Development",
                    "✨ Polish",
                    "✅ Complete"
                ]
                
                for list_name in workflow_lists:
                    try:
                        workflow_list = self.client.create_list(
                            board_id=board['id'],
                            name=list_name,
                            pos="bottom"
                        )
                        print(f"   📋 Created: {list_name}")
                    except Exception as e:
                        print(f"   ⚠️  Could not create list {list_name}: {e}")
                
                # Add project-specific labels
                labels = [
                    (project['client'], "blue"),
                    ("High Priority", "red_dark"),
                    ("Medium Priority", "orange"), 
                    ("Low Priority", "yellow"),
                    ("Designer", "purple"),
                    ("UX", "yellow"),
                    ("Developer", "red"),
                    ("Component", "sky"),
                    ("Feature", "lime")
                ]
                
                for label_name, color in labels:
                    try:
                        label = self.client.create_label(
                            board_id=board['id'],
                            name=label_name,
                            color=color
                        )
                        print(f"   🏷️  Created label: {label_name}")
                    except Exception as e:
                        print(f"   ⚠️  Could not create label {label_name}: {e}")
                
                created_boards.append({
                    'board': board,
                    'project': project
                })
                
            except Exception as e:
                print(f"❌ Could not create board for {project['name']}: {e}")
        
        return created_boards
    
    def add_sample_cards_to_project_boards(self, project_boards):
        """Add sample cards to each project board"""
        print("\n📝 Adding Sample Cards to Project Boards...")
        
        for project_info in project_boards:
            board = project_info['board']
            project = project_info['project']
            
            print(f"\n📋 Adding cards to {board['name']}...")
            
            # Get the backlog list
            lists = self.client.get_board_lists(board['id'])
            backlog_list = next((lst for lst in lists if lst['name'] == "📋 Backlog"), None)
            
            if not backlog_list:
                print(f"   ❌ Could not find Backlog list in {board['name']}")
                continue
            
            # Sample features for this project
            sample_features = [
                f"User Authentication System - {project['name']}",
                f"Dashboard Component Library - {project['name']}",
                f"Data Visualization Charts - {project['name']}",
                f"Mobile Responsive Design - {project['name']}",
                f"API Integration Layer - {project['name']}",
                f"User Management System - {project['name']}",
                f"Reporting Dashboard - {project['name']}",
                f"Notification System - {project['name']}"
            ]
            
            for feature in sample_features:
                try:
                    card = self.client.create_card(
                        list_id=backlog_list['id'],
                        name=feature,
                        desc=f"Feature for {project['name']}\n\nClient: {project['client']}\nMilestone: 1\nAssignee: Developer\nPriority: High"
                    )
                    print(f"   📝 Created: {feature}")
                except Exception as e:
                    print(f"   ⚠️  Could not create card {feature}: {e}")
    
    def redesign_all_boards(self):
        """Redesign all test boards"""
        print("🚀 Redesigning Test Boards with Cleaner Structure")
        print("=" * 60)
        
        # Redesign the master board
        master_board_id = "68e56778e2931588d2c49693"
        self.redesign_master_board(master_board_id)
        
        # Create project filtered boards
        project_boards = self.create_project_filtered_boards(master_board_id)
        
        # Add sample cards
        self.add_sample_cards_to_project_boards(project_boards)
        
        print("\n" + "=" * 60)
        print("🎉 Board Redesign Complete!")
        print(f"📋 Master Board: https://trello.com/b/vpGPi9IH/🧪-test-master-project-board")
        
        for project_info in project_boards:
            board = project_info['board']
            print(f"📋 {board['name']}: {board['url']}")
        
        print(f"\n💡 How It Works:")
        print(f"1. Master board contains ALL projects and milestones")
        print(f"2. Project boards show filtered views for each team")
        print(f"3. Website dashboard creates dynamic views")
        print(f"4. Teams see 'their' project board, but it's filtered from master")

def main():
    """Main function to redesign boards"""
    try:
        redesigner = BoardRedesigner()
        redesigner.redesign_all_boards()
    except Exception as e:
        print(f"❌ Error redesigning boards: {e}")

if __name__ == "__main__":
    main()


