from typing import List, Dict, Optional
from trello_client import TrelloClient
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ProjectView:
    """A filtered view of the master board"""
    name: str
    filters: Dict[str, str]
    cards: List[Dict]
    milestones: List[Dict]

class TrelloViewManager:
    """Manages dynamic views of the master board"""
    
    def __init__(self, master_board_id: str):
        self.client = TrelloClient()
        self.master_board_id = master_board_id
        self._cache = {}
        self._cache_time = None
    
    def _get_board_data(self, force_refresh: bool = False):
        """Get board data with caching"""
        now = datetime.now()
        if not force_refresh and self._cache_time and (now - self._cache_time).seconds < 300:  # 5 min cache
            return self._cache
        
        board = self.client.get_board(self.master_board_id)
        lists = self.client.get_board_lists(self.master_board_id)
        cards = self.client.get_board_cards(self.master_board_id)
        
        self._cache = {
            'board': board,
            'lists': lists,
            'cards': cards
        }
        self._cache_time = now
        return self._cache
    
    def create_client_view(self, client_name: str) -> ProjectView:
        """Create a view filtered by client"""
        data = self._get_board_data()
        cards = data['cards']
        lists = data['lists']
        
        # Filter cards by client
        client_cards = [card for card in cards 
                       if self._get_custom_field_value(card, 'Client') == client_name]
        
        # Get milestones for this client
        milestones = self._extract_milestones(lists, client_cards)
        
        return ProjectView(
            name=f"{client_name} Project View",
            filters={'client': client_name},
            cards=client_cards,
            milestones=milestones
        )
    
    def create_milestone_view(self, milestone_number: int) -> ProjectView:
        """Create a view filtered by milestone"""
        data = self._get_board_data()
        cards = data['cards']
        lists = data['lists']
        
        # Filter cards by milestone
        milestone_cards = [card for card in cards 
                          if self._get_custom_field_value(card, 'Milestone') == str(milestone_number)]
        
        # Get milestone info
        milestones = self._extract_milestones(lists, milestone_cards)
        
        return ProjectView(
            name=f"Milestone {milestone_number} View",
            filters={'milestone': str(milestone_number)},
            cards=milestone_cards,
            milestones=milestones
        )
    
    def create_team_view(self, team_member: str) -> ProjectView:
        """Create a view filtered by team member"""
        data = self._get_board_data()
        cards = data['cards']
        lists = data['lists']
        
        # Filter cards by assignee
        team_cards = [card for card in cards 
                     if self._get_custom_field_value(card, 'Assignee') == team_member]
        
        # Get milestones for this team member
        milestones = self._extract_milestones(lists, team_cards)
        
        return ProjectView(
            name=f"{team_member} Work View",
            filters={'assignee': team_member},
            cards=team_cards,
            milestones=milestones
        )
    
    def create_project_view(self, project_name: str) -> ProjectView:
        """Create a view filtered by project"""
        data = self._get_board_data()
        cards = data['cards']
        lists = data['lists']
        
        # Filter cards by project
        project_cards = [card for card in cards 
                        if self._get_custom_field_value(card, 'Project') == project_name]
        
        # Get milestones for this project
        milestones = self._extract_milestones(lists, project_cards)
        
        return ProjectView(
            name=f"{project_name} Project View",
            filters={'project': project_name},
            cards=project_cards,
            milestones=milestones
        )
    
    def create_planning_view(self, week_start: str) -> ProjectView:
        """Create a view for weekly planning"""
        data = self._get_board_data()
        cards = data['cards']
        lists = data['lists']
        
        # Filter cards by week label
        planning_cards = [card for card in cards 
                         if week_start in [label.get('name', '') for label in card.get('labels', [])]]
        
        return ProjectView(
            name=f"Week of {week_start} Planning",
            filters={'week': week_start},
            cards=planning_cards,
            milestones=[]
        )
    
    def _get_custom_field_value(self, card: Dict, field_name: str) -> Optional[str]:
        """Extract custom field value from card"""
        # This would need to be implemented based on how custom fields are stored
        # For now, we'll check card name patterns or custom field data
        custom_fields = card.get('customFieldItems', [])
        for field in custom_fields:
            if field.get('idCustomField') == field_name:
                return field.get('value', {}).get('text', '')
        return None
    
    def _extract_milestones(self, lists: List[Dict], cards: List[Dict]) -> List[Dict]:
        """Extract milestone information from lists and cards"""
        milestones = []
        for list_item in lists:
            if 'Milestone' in list_item['name']:
                milestone_cards = [card for card in cards if card['idList'] == list_item['id']]
                milestones.append({
                    'name': list_item['name'],
                    'id': list_item['id'],
                    'cards': milestone_cards,
                    'progress': self._calculate_milestone_progress(milestone_cards)
                })
        return milestones
    
    def _calculate_milestone_progress(self, cards: List[Dict]) -> float:
        """Calculate progress percentage for a milestone"""
        if not cards:
            return 0.0
        
        completed = len([card for card in cards if card['closed']])
        return (completed / len(cards)) * 100
    
    def get_all_views(self) -> List[ProjectView]:
        """Get all possible views"""
        data = self._get_board_data()
        cards = data['cards']
        
        # Extract unique values for filtering
        clients = set()
        projects = set()
        assignees = set()
        milestones = set()
        
        for card in cards:
            client = self._get_custom_field_value(card, 'Client')
            project = self._get_custom_field_value(card, 'Project')
            assignee = self._get_custom_field_value(card, 'Assignee')
            milestone = self._get_custom_field_value(card, 'Milestone')
            
            if client:
                clients.add(client)
            if project:
                projects.add(project)
            if assignee:
                assignees.add(assignee)
            if milestone:
                milestones.add(milestone)
        
        views = []
        
        # Create views for each unique value
        for client in clients:
            views.append(self.create_client_view(client))
        
        for project in projects:
            views.append(self.create_project_view(project))
        
        for assignee in assignees:
            views.append(self.create_team_view(assignee))
        
        for milestone in milestones:
            views.append(self.create_milestone_view(int(milestone)))
        
        return views


