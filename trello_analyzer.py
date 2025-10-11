from typing import List, Dict, Optional
from trello_client import TrelloClient
from dataclasses import dataclass
from datetime import datetime

@dataclass
class BoardAnalysis:
    """Analysis results for a Trello board"""
    board_id: str
    board_name: str
    total_cards: int
    total_lists: int
    lists: List[Dict]
    cards_by_list: Dict[str, List[Dict]]
    labels: List[Dict]
    completion_rate: Optional[float] = None

class TrelloAnalyzer:
    """Analyzer for Trello boards to understand current setup and structure"""
    
    def __init__(self):
        self.client = TrelloClient()
    
    def analyze_board(self, board_id: str) -> BoardAnalysis:
        """Analyze a specific board and return detailed information"""
        board = self.client.get_board(board_id)
        lists = self.client.get_board_lists(board_id)
        cards = self.client.get_board_cards(board_id)
        labels = self.client.get_board_labels(board_id)
        
        # Group cards by list
        cards_by_list = {}
        for list_item in lists:
            list_cards = [card for card in cards if card['idList'] == list_item['id']]
            cards_by_list[list_item['name']] = list_cards
        
        # Calculate completion rate if there are "Done" or "Completed" lists
        completion_rate = self._calculate_completion_rate(lists, cards_by_list)
        
        return BoardAnalysis(
            board_id=board_id,
            board_name=board['name'],
            total_cards=len(cards),
            total_lists=len(lists),
            lists=lists,
            cards_by_list=cards_by_list,
            labels=labels,
            completion_rate=completion_rate
        )
    
    def analyze_all_boards(self) -> List[BoardAnalysis]:
        """Analyze all boards for the authenticated user"""
        boards = self.client.get_boards()
        analyses = []
        
        for board in boards:
            try:
                analysis = self.analyze_board(board['id'])
                analyses.append(analysis)
            except Exception as e:
                print(f"Error analyzing board {board['name']}: {e}")
                continue
        
        return analyses
    
    def _calculate_completion_rate(self, lists: List[Dict], cards_by_list: Dict[str, List[Dict]]) -> Optional[float]:
        """Calculate completion rate based on cards in 'Done' or 'Completed' lists"""
        done_lists = [lst for lst in lists if any(keyword in lst['name'].lower() 
                     for keyword in ['done', 'completed', 'finished', 'closed'])]
        
        if not done_lists:
            return None
        
        total_cards = sum(len(cards) for cards in cards_by_list.values())
        done_cards = sum(len(cards_by_list.get(lst['name'], [])) for lst in done_lists)
        
        if total_cards == 0:
            return 0.0
        
        return (done_cards / total_cards) * 100
    
    def print_board_summary(self, analysis: BoardAnalysis):
        """Print a summary of board analysis"""
        print(f"\n📋 Board: {analysis.board_name}")
        print(f"   ID: {analysis.board_id}")
        print(f"   Total Cards: {analysis.total_cards}")
        print(f"   Total Lists: {analysis.total_lists}")
        
        if analysis.completion_rate is not None:
            print(f"   Completion Rate: {analysis.completion_rate:.1f}%")
        
        print(f"\n   📝 Lists:")
        for list_item in analysis.lists:
            card_count = len(analysis.cards_by_list.get(list_item['name'], []))
            print(f"      • {list_item['name']}: {card_count} cards")
        
        if analysis.labels:
            print(f"\n   🏷️  Labels:")
            for label in analysis.labels:
                print(f"      • {label['name']} ({label['color']})")
    
    def suggest_improvements(self, analysis: BoardAnalysis) -> List[str]:
        """Suggest improvements for the board structure"""
        suggestions = []
        
        # Check for common software development workflow patterns
        list_names = [lst['name'].lower() for lst in analysis.lists]
        
        if not any(keyword in ' '.join(list_names) for keyword in ['backlog', 'todo', 'to do']):
            suggestions.append("Consider adding a 'Backlog' or 'To Do' list for new features")
        
        if not any(keyword in ' '.join(list_names) for keyword in ['in progress', 'doing', 'development']):
            suggestions.append("Consider adding an 'In Progress' or 'Development' list")
        
        if not any(keyword in ' '.join(list_names) for keyword in ['review', 'testing', 'qa']):
            suggestions.append("Consider adding a 'Review' or 'Testing' list")
        
        if not any(keyword in ' '.join(list_names) for keyword in ['done', 'completed', 'finished']):
            suggestions.append("Consider adding a 'Done' or 'Completed' list")
        
        # Check for labels
        if not analysis.labels:
            suggestions.append("Consider adding labels for priority, feature type, or client visibility")
        
        # Check for card descriptions
        all_cards = []
        for cards in analysis.cards_by_list.values():
            all_cards.extend(cards)
        
        cards_without_desc = [card for card in all_cards if not card.get('desc', '').strip()]
        if cards_without_desc:
            suggestions.append(f"Consider adding descriptions to {len(cards_without_desc)} cards for better tracking")
        
        return suggestions


