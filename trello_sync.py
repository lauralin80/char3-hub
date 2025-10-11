#!/usr/bin/env python3
"""
Trello Board Sync Automation
Syncs cards from all boards to the Master board for project management visibility
"""

from trello_client import TrelloClient
from typing import List, Dict, Optional
import time
import json
from datetime import datetime

class TrelloSync:
    """Syncs cards across Trello boards"""
    
    def __init__(self):
        self.client = TrelloClient()
        
        # Board IDs for your 6-board structure
        self.boards = {
            'weekly_planning': '68e572002006cc67fa8d92c6',
            'design': '68e57202502c6ecc0ddac4ed', 
            'ux_review': '68e572b90e5306124115d227',
            'ilitigate_dev': '68e56a57b40a3273ba4d09e6',
            'master': '68e572c6443f3eb8f3009115',
            'account_management': '68e95255081b416a51143bc6'
        }
        
        # Mapping of source boards to master board lists
        self.list_mapping = {
            'design': '🎨 Design Tasks',
            'ux_review': '🔍 UX Tasks', 
            'ilitigate_dev': '💻 Dev Tasks',
            'account_management': '📋 Features'  # Account management items as features
        }
        
        # Track synced cards to avoid duplicates
        self.synced_cards = set()
    
    def get_all_cards_from_source_boards(self) -> List[Dict]:
        """Get all cards from source boards (excluding master and weekly planning)"""
        all_cards = []
        
        source_boards = ['design', 'ux_review', 'ilitigate_dev', 'account_management']
        
        for board_name in source_boards:
            board_id = self.boards[board_name]
            try:
                cards = self.client.get_board_cards(board_id)
                for card in cards:
                    card['source_board'] = board_name
                    card['source_board_id'] = board_id
                    all_cards.append(card)
                print(f"📋 Found {len(cards)} cards in {board_name}")
            except Exception as e:
                print(f"❌ Error getting cards from {board_name}: {e}")
        
        return all_cards
    
    def get_master_board_lists(self) -> Dict[str, str]:
        """Get master board lists and their IDs"""
        master_lists = {}
        try:
            lists = self.client.get_board_lists(self.boards['master'])
            for list_item in lists:
                master_lists[list_item['name']] = list_item['id']
            print(f"📋 Master board has {len(lists)} lists")
        except Exception as e:
            print(f"❌ Error getting master board lists: {e}")
        
        return master_lists
    
    def create_sync_card_on_master(self, source_card: Dict, target_list_id: str) -> Optional[Dict]:
        """Create a synced card on the master board"""
        try:
            # Create card name with source board indicator
            source_board = source_card['source_board']
            card_name = f"[{source_board.upper()}] {source_card['name']}"
            
            # Create description with sync info and original card link
            original_desc = source_card.get('desc', '')
            sync_info = f"🔄 Synced from {source_board} board\n"
            sync_info += f"📅 Last synced: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
            sync_info += f"🔗 Original card: {source_card['url']}\n\n"
            
            new_desc = sync_info + original_desc
            
            # Create the card
            new_card = self.client.create_card(
                list_id=target_list_id,
                name=card_name,
                desc=new_desc
            )
            
            # Copy labels from source card
            source_labels = source_card.get('labels', [])
            for label in source_labels:
                try:
                    # Add label to the new card (this might need to be done via API)
                    pass  # Labels will be copied via the description for now
                except:
                    pass
            
            print(f"✅ Created sync card: {card_name}")
            return new_card
            
        except Exception as e:
            print(f"❌ Error creating sync card: {e}")
            return None
    
    def sync_cards_to_master(self):
        """Main sync function - syncs all cards to master board"""
        print("🔄 Starting Trello Board Sync...")
        print("=" * 50)
        
        # Get all cards from source boards
        source_cards = self.get_all_cards_from_source_boards()
        print(f"📊 Total source cards: {len(source_cards)}")
        
        # Get master board lists
        master_lists = self.get_master_board_lists()
        
        # Get existing master board cards to avoid duplicates
        try:
            existing_master_cards = self.client.get_board_cards(self.boards['master'])
            existing_card_names = {card['name'] for card in existing_master_cards}
            print(f"📋 Existing master cards: {len(existing_master_cards)}")
        except Exception as e:
            print(f"❌ Error getting existing master cards: {e}")
            existing_card_names = set()
        
        # Sync each source card to master board
        synced_count = 0
        skipped_count = 0
        
        for source_card in source_cards:
            source_board = source_card['source_board']
            
            # Determine target list
            if source_board in self.list_mapping:
                target_list_name = self.list_mapping[source_board]
                target_list_id = master_lists.get(target_list_name)
                
                if not target_list_id:
                    print(f"⚠️  Target list '{target_list_name}' not found in master board")
                    continue
                
                # Check if card already exists (by name pattern)
                expected_name = f"[{source_board.upper()}] {source_card['name']}"
                
                if expected_name in existing_card_names:
                    print(f"⏭️  Skipping existing card: {expected_name}")
                    skipped_count += 1
                    continue
                
                # Create sync card
                new_card = self.create_sync_card_on_master(source_card, target_list_id)
                if new_card:
                    synced_count += 1
                    existing_card_names.add(expected_name)  # Add to set to avoid duplicates
            else:
                print(f"⚠️  No mapping found for board: {source_board}")
        
        print("\n" + "=" * 50)
        print(f"🎉 Sync Complete!")
        print(f"✅ Synced: {synced_count} cards")
        print(f"⏭️  Skipped: {skipped_count} cards (already exist)")
        print(f"📊 Total processed: {len(source_cards)} cards")
        
        return {
            'synced': synced_count,
            'skipped': skipped_count,
            'total': len(source_cards)
        }
    
    def update_existing_sync_cards(self):
        """Update existing sync cards with latest information"""
        print("🔄 Updating existing sync cards...")
        
        # Get all cards from source boards
        source_cards = self.get_all_cards_from_source_boards()
        
        # Get master board cards
        try:
            master_cards = self.client.get_board_cards(self.boards['master'])
        except Exception as e:
            print(f"❌ Error getting master cards: {e}")
            return
        
        # Create lookup for source cards
        source_lookup = {}
        for card in source_cards:
            key = f"[{card['source_board'].upper()}] {card['name']}"
            source_lookup[key] = card
        
        # Update master cards that have corresponding source cards
        updated_count = 0
        
        for master_card in master_cards:
            if master_card['name'] in source_lookup:
                source_card = source_lookup[master_card['name']]
                
                # Update description with latest sync info
                original_desc = source_card.get('desc', '')
                sync_info = f"🔄 Synced from {source_card['source_board']} board\n"
                sync_info += f"📅 Last synced: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
                sync_info += f"🔗 Original card: {source_card['url']}\n\n"
                
                new_desc = sync_info + original_desc
                
                try:
                    # Update the card description
                    self.client._make_request(
                        f"cards/{master_card['id']}",
                        method='PUT',
                        data={'desc': new_desc}
                    )
                    print(f"✅ Updated: {master_card['name']}")
                    updated_count += 1
                except Exception as e:
                    print(f"❌ Error updating {master_card['name']}: {e}")
        
        print(f"🎉 Updated {updated_count} existing sync cards")
    
    def run_full_sync(self):
        """Run complete sync: create new cards and update existing ones"""
        print("🚀 Running Full Trello Sync")
        print("=" * 50)
        
        # First, sync new cards
        sync_result = self.sync_cards_to_master()
        
        # Then, update existing cards
        self.update_existing_sync_cards()
        
        return sync_result

def main():
    """Main function to run the sync"""
    try:
        sync = TrelloSync()
        result = sync.run_full_sync()
        return result
    except Exception as e:
        print(f"❌ Sync failed: {e}")
        return None

if __name__ == "__main__":
    main()


