#!/usr/bin/env python3
"""
Create the final 6-board structure for char3 workspace
"""

from trello_client import TrelloClient
import time

class FinalBoardCreator:
    """Creates the final 6-board structure"""
    
    def __init__(self):
        self.client = TrelloClient()
    
    def create_weekly_planning_board(self) -> dict:
        """Create the weekly planning board (Sun-Sat)"""
        print("📅 Creating Weekly Planning Board...")
        
        board = self.client.create_board(
            name="Weekly Planning",
            desc="Weekly planning board for team coordination",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create day lists
        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        for day in days:
            day_list = self.client.create_list(
                board_id=board['id'],
                name=day,
                pos="bottom"
            )
            print(f"   📅 Created: {day}")
        
        return board
    
    def create_design_board(self) -> dict:
        """Create the design board for all projects"""
        print("🎨 Creating Design Board...")
        
        board = self.client.create_board(
            name="Design",
            desc="Design work for all projects",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create design workflow lists
        workflow_lists = [
            "📋 Backlog",
            "🎨 In Design", 
            "🔧 Review",
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
        
        # Create project labels
        self.create_project_labels(board['id'])
        
        # Create custom fields
        self.create_custom_fields(board['id'])
        
        return board
    
    def create_ux_review_board(self) -> dict:
        """Create the UX Review board for gap analysis"""
        print("🔍 Creating UX Review Board...")
        
        board = self.client.create_board(
            name="UX Review",
            desc="UX gap analysis and workflow improvements",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create UX workflow lists
        workflow_lists = [
            "📋 Backlog",
            "🔍 Analysis", 
            "💡 Recommendations",
            "🔧 Implementation",
            "✅ Complete"
        ]
        
        for list_name in workflow_lists:
            workflow_list = self.client.create_list(
                board_id=board['id'],
                name=list_name,
                pos="bottom"
            )
            print(f"   📋 Created: {list_name}")
        
        # Create project labels
        self.create_project_labels(board['id'])
        
        # Create custom fields
        self.create_custom_fields(board['id'])
        
        return board
    
    def create_ilitigate_dev_board(self) -> dict:
        """Create the iLitigate Development board"""
        print("💻 Creating iLitigate Development Board...")
        
        board = self.client.create_board(
            name="iLitigate Development",
            desc="Development work for iLitigate project",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create development workflow lists (like the real iLitigate board)
        workflow_lists = [
            "Backlog",
            "On Deck", 
            "Working",
            "Review",
            "Staging",
            "Production",
            "Complete"
        ]
        
        for list_name in workflow_lists:
            workflow_list = self.client.create_list(
                board_id=board['id'],
                name=list_name,
                pos="bottom"
            )
            print(f"   📋 Created: {list_name}")
        
        # Create iLitigate-specific labels
        labels = [
            ("iLitigate", "blue"),
            ("High Priority", "red_dark"),
            ("Medium Priority", "orange"),
            ("Low Priority", "yellow"),
            ("Bug", "red"),
            ("Feature", "lime"),
            ("Enhancement", "sky")
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
        
        # Create custom fields
        self.create_custom_fields(board['id'])
        
        return board
    
    def create_master_board(self) -> dict:
        """Create the master project management board"""
        print("📊 Creating Master Board...")
        
        board = self.client.create_board(
            name="Master",
            desc="Master project management and client visibility board",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create master board lists
        master_lists = [
            "🎯 Milestones",
            "📋 Features",
            "🎨 Design Tasks",
            "🔍 UX Tasks", 
            "💻 Dev Tasks",
            "✅ Complete"
        ]
        
        for list_name in master_lists:
            master_list = self.client.create_list(
                board_id=board['id'],
                name=list_name,
                pos="bottom"
            )
            print(f"   📋 Created: {list_name}")
        
        # Create project labels
        self.create_project_labels(board['id'])
        
        # Create custom fields
        self.create_custom_fields(board['id'])
        
        return board
    
    def create_account_management_board(self) -> dict:
        """Create the account management board for project lead"""
        print("👥 Creating Account Management Board...")
        
        board = self.client.create_board(
            name="Account Management",
            desc="Project lead's client deliverables and account management tasks",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create account management workflow lists
        workflow_lists = [
            "📋 Backlog",
            "📞 Client Communication", 
            "📊 Reporting",
            "🎯 Deliverables",
            "✅ Complete"
        ]
        
        for list_name in workflow_lists:
            workflow_list = self.client.create_list(
                board_id=board['id'],
                name=list_name,
                pos="bottom"
            )
            print(f"   📋 Created: {list_name}")
        
        # Create client labels
        labels = [
            ("iLitigate", "blue"),
            ("RothRiver", "green"),
            ("ParentMD", "orange"),
            ("High Priority", "red_dark"),
            ("Medium Priority", "orange"),
            ("Low Priority", "yellow"),
            ("Client Meeting", "purple"),
            ("Deliverable", "lime")
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
        
        # Create custom fields
        self.create_custom_fields(board['id'])
        
        return board
    
    def create_project_labels(self, board_id: str):
        """Create standard project labels"""
        labels = [
            ("iLitigate", "blue"),
            ("RothRiver", "green"),
            ("ParentMD", "orange"),
            ("High Priority", "red_dark"),
            ("Medium Priority", "orange"),
            ("Low Priority", "yellow")
        ]
        
        for label_name, color in labels:
            try:
                label = self.client.create_label(
                    board_id=board_id,
                    name=label_name,
                    color=color
                )
                print(f"   🏷️  Created label: {label_name}")
            except Exception as e:
                print(f"   ⚠️  Could not create label {label_name}: {e}")
    
    def create_custom_fields(self, board_id: str):
        """Create custom fields for effort and milestone tracking"""
        print("   🔧 Creating custom fields...")
        
        # Create Effort field (list type)
        try:
            effort_field = self.client._make_request(
                'customFields',
                method='POST',
                data={
                    'idModel': board_id,
                    'modelType': 'board',
                    'name': 'Effort',
                    'type': 'list',
                    'options': [
                        {'color': 'green', 'value': {'text': '1 - Small'}},
                        {'color': 'yellow', 'value': {'text': '2 - Medium'}},
                        {'color': 'orange', 'value': {'text': '3 - Large'}},
                        {'color': 'red', 'value': {'text': '5 - Extra Large'}}
                    ]
                }
            )
            print(f"   ✅ Created Effort field")
        except Exception as e:
            print(f"   ⚠️  Could not create Effort field: {e}")
        
        # Create Milestone field (text type)
        try:
            milestone_field = self.client._make_request(
                'customFields',
                method='POST',
                data={
                    'idModel': board_id,
                    'modelType': 'board',
                    'name': 'Milestone',
                    'type': 'text'
                }
            )
            print(f"   ✅ Created Milestone field")
        except Exception as e:
            print(f"   ⚠️  Could not create Milestone field: {e}")
    
    def create_all_boards(self):
        """Create all 6 boards"""
        print("🚀 Creating Final 6-Board Structure")
        print("=" * 50)
        
        created_boards = {}
        
        # Create all boards
        created_boards['weekly_planning'] = self.create_weekly_planning_board()
        created_boards['design'] = self.create_design_board()
        created_boards['ux_review'] = self.create_ux_review_board()
        created_boards['ilitigate_dev'] = self.create_ilitigate_dev_board()
        created_boards['master'] = self.create_master_board()
        created_boards['account_management'] = self.create_account_management_board()
        
        print("\n" + "=" * 50)
        print("🎉 All 6 Boards Created Successfully!")
        print(f"📅 Weekly Planning: {created_boards['weekly_planning']['url']}")
        print(f"🎨 Design: {created_boards['design']['url']}")
        print(f"🔍 UX Review: {created_boards['ux_review']['url']}")
        print(f"💻 iLitigate Development: {created_boards['ilitigate_dev']['url']}")
        print(f"📊 Master: {created_boards['master']['url']}")
        print(f"👥 Account Management: {created_boards['account_management']['url']}")
        
        print(f"\n💡 Board Structure:")
        print(f"• Weekly Planning: Sun-Sat planning for team coordination")
        print(f"• Design: Design work for all projects")
        print(f"• UX Review: Gap analysis and workflow improvements")
        print(f"• iLitigate Development: Dev work for iLitigate project")
        print(f"• Master: Project management and client visibility")
        print(f"• Account Management: Project lead's client deliverables")
        
        print(f"\n🔧 Features:")
        print(f"• Custom Fields: Effort (1-5) and Milestone (text)")
        print(f"• Project Labels: iLitigate, RothRiver, ParentMD")
        print(f"• Priority Labels: High, Medium, Low")
        print(f"• Cross-board tracking via project labels")
        
        return created_boards

def main():
    """Main function to create all boards"""
    try:
        creator = FinalBoardCreator()
        boards = creator.create_all_boards()
        return boards
    except Exception as e:
        print(f"❌ Error creating boards: {e}")
        return None

if __name__ == "__main__":
    main()


