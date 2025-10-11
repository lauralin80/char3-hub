import requests
from typing import List, Dict, Optional
from config import TrelloConfig

class TrelloClient:
    """Client for interacting with Trello API"""
    
    BASE_URL = "https://api.trello.com/1"
    
    def __init__(self):
        TrelloConfig.validate()
        self.api_key = TrelloConfig.API_KEY
        self.token = TrelloConfig.TOKEN
        self.auth_params = {
            'key': self.api_key,
            'token': self.token
        }
    
    def _make_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict:
        """Make a request to the Trello API"""
        url = f"{self.BASE_URL}/{endpoint}"
        request_params = self.auth_params.copy()
        
        # Add any additional parameters
        if params:
            request_params.update(params)
        
        if method == 'GET':
            response = requests.get(url, params=request_params)
        elif method == 'POST':
            response = requests.post(url, params=request_params, json=data)
        elif method == 'PUT':
            response = requests.put(url, params=request_params, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, params=request_params)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        return response.json()
    
    def get_boards(self) -> List[Dict]:
        """Get all boards for the authenticated user"""
        return self._make_request('members/me/boards')
    
    def get_board(self, board_id: str) -> Dict:
        """Get a specific board by ID"""
        return self._make_request(f'boards/{board_id}')
    
    def get_board_lists(self, board_id: str) -> List[Dict]:
        """Get all lists for a specific board"""
        return self._make_request(f'boards/{board_id}/lists')
    
    def get_board_cards(self, board_id: str) -> List[Dict]:
        """Get all cards for a specific board"""
        return self._make_request(f'boards/{board_id}/cards', params={'members': 'true'})
    
    def get_list_cards(self, list_id: str) -> List[Dict]:
        """Get all cards for a specific list"""
        return self._make_request(f'lists/{list_id}/cards')
    
    def create_board(self, name: str, desc: str = "", default_lists: bool = True, org_id: str = None) -> Dict:
        """Create a new board"""
        data = {
            'name': name,
            'desc': desc,
            'defaultLists': default_lists
        }
        if org_id:
            data['idOrganization'] = org_id
        return self._make_request('boards', method='POST', data=data)
    
    def create_list(self, board_id: str, name: str, pos: str = "bottom") -> Dict:
        """Create a new list on a board"""
        data = {
            'name': name,
            'idBoard': board_id,
            'pos': pos
        }
        return self._make_request('lists', method='POST', data=data)
    
    def create_card(self, list_id: str, name: str, desc: str = "", labels: List[str] = None) -> Dict:
        """Create a new card in a list"""
        data = {
            'name': name,
            'desc': desc,
            'idList': list_id
        }
        if labels:
            data['idLabels'] = ','.join(labels)
        return self._make_request('cards', method='POST', data=data)
    
    def get_board_labels(self, board_id: str) -> List[Dict]:
        """Get all labels for a specific board"""
        return self._make_request(f'boards/{board_id}/labels')
    
    def create_label(self, board_id: str, name: str, color: str = "blue") -> Dict:
        """Create a new label on a board"""
        data = {
            'name': name,
            'color': color,
            'idBoard': board_id
        }
        return self._make_request('labels', method='POST', data=data)
    
    def add_label_to_card(self, card_id: str, label_name: str) -> bool:
        """Add a label to a card by name"""
        try:
            # First, get the board ID from the card
            card = self._make_request(f'cards/{card_id}')
            board_id = card['idBoard']
            
            # Get all labels for the board
            labels = self._make_request(f'boards/{board_id}/labels')
            
            # Find the label by name
            label = next((lbl for lbl in labels if lbl['name'] == label_name), None)
            
            if label:
                # Add the label to the card
                self._make_request(
                    f'cards/{card_id}/idLabels',
                    method='POST',
                    data={'value': label['id']}
                )
                return True
            else:
                print(f"Label '{label_name}' not found on board")
                return False
                
        except Exception as e:
            print(f"Error adding label '{label_name}' to card {card_id}: {e}")
            return False


