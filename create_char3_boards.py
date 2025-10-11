#!/usr/bin/env python3
"""
Create the proper board structure for char3 workspace
Based on the real iLitigate Development board structure
"""

from trello_client import TrelloClient
import time

class Char3BoardCreator:
    """Creates boards for char3 workspace with proper structure"""
    
    def __init__(self):
        self.client = TrelloClient()
    
    def create_design_ux_board(self) -> dict:
        """Create a generic Design/UX board for all projects"""
        print("🎨 Creating Design/UX Board...")
        
        board = self.client.create_board(
            name="Design & UX",
            desc="Generic board for all design and UX work across projects",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create workflow lists (similar to iLitigate but for design/UX)
        workflow_lists = [
            "📋 Backlog",
            "🎨 In Design", 
            "🔧 UX Review",
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
        project_labels = [
            ("iLitigate", "blue"),
            ("RothRiver", "green"),
            ("ParentMD", "orange"),
            ("High Priority", "red_dark"),
            ("Medium Priority", "orange"),
            ("Low Priority", "yellow"),
            ("Component", "sky"),
            ("Feature", "lime")
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
        
        # Create custom fields (Effort and Milestone like iLitigate)
        self.create_custom_fields(board['id'])
        
        return board
    
    def create_project_development_board(self, project_name: str, project_label: str, label_color: str) -> dict:
        """Create a project-specific development board"""
        print(f"💻 Creating {project_name} Development Board...")
        
        board = self.client.create_board(
            name=f"{project_name} Development",
            desc=f"Development board for {project_name} project",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create workflow lists (exactly like iLitigate)
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
        
        # Create project-specific labels
        project_labels = [
            (project_label, label_color),
            ("High Priority", "red_dark"),
            ("Medium Priority", "orange"),
            ("Low Priority", "yellow"),
            ("Bug", "red"),
            ("Feature", "lime"),
            ("Enhancement", "blue")
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
        
        # Create custom fields (Effort and Milestone like iLitigate)
        self.create_custom_fields(board['id'])
        
        return board
    
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
    
    def create_master_board(self) -> dict:
        """Create a master board for project management visibility"""
        print("📊 Creating Master Project Board...")
        
        board = self.client.create_board(
            name="Master Project Board",
            desc="Master board for project management and client visibility",
            default_lists=False
        )
        
        print(f"✅ Created: {board['name']} (ID: {board['id']})")
        
        # Create lists for project management
        pm_lists = [
            "🎯 Milestones",
            "📋 All Projects",
            "🔧 In Progress",
            "🧪 Testing",
            "✅ Complete"
        ]
        
        for list_name in pm_lists:
            pm_list = self.client.create_list(
                board_id=board['id'],
                name=list_name,
                pos="bottom"
            )
            print(f"   📋 Created: {list_name}")
        
        # Create project labels
        project_labels = [
            ("iLitigate", "blue"),
            ("RothRiver", "green"),
            ("ParentMD", "orange"),
            ("High Priority", "red_dark"),
            ("Medium Priority", "orange"),
            ("Low Priority", "yellow")
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
        
        # Create custom fields
        self.create_custom_fields(board['id'])
        
        return board
    
    def create_all_char3_boards(self):
        """Create all boards for char3 workspace"""
        print("🚀 Creating Char3 Workspace Boards")
        print("=" * 50)
        
        created_boards = {}
        
        # Create Design/UX board
        design_board = self.create_design_ux_board()
        created_boards['design_ux'] = design_board
        
        # Create project development boards
        projects = [
            ("iLitigate", "iLitigate App Rebuild", "blue"),
            ("RothRiver", "RothRiver", "green"),
            ("ParentMD", "ParentMD", "orange")
        ]
        
        for project_name, project_label, label_color in projects:
            board = self.create_project_development_board(project_name, project_label, label_color)
            created_boards[f'{project_name.lower()}_dev'] = board
        
        # Create master board
        master_board = self.create_master_board()
        created_boards['master'] = master_board
        
        print("\n" + "=" * 50)
        print("🎉 Char3 Workspace Boards Created!")
        print(f"🎨 Design & UX: {design_board['url']}")
        for project_name, _, _ in projects:
            board = created_boards[f'{project_name.lower()}_dev']
            print(f"💻 {project_name} Development: {board['url']}")
        print(f"📊 Master Project Board: {master_board['url']}")
        
        print(f"\n💡 Structure:")
        print(f"• Design/UX: Generic board for all projects")
        print(f"• Development: Project-specific boards (no design/UX lists)")
        print(f"• Master: For project management and client visibility")
        print(f"• Custom Fields: Effort (1-5) and Milestone (text)")
        print(f"• Labels: Project-specific for organization")
        
        return created_boards

def main():
    """Main function to create char3 boards"""
    try:
        creator = Char3BoardCreator()
        boards = creator.create_all_char3_boards()
        return boards
    except Exception as e:
        print(f"❌ Error creating char3 boards: {e}")
        return None

if __name__ == "__main__":
    main()


