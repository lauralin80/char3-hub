#!/usr/bin/env python3
"""
Manual Trello Sync
Run this to manually sync all boards to Master
"""

from trello_sync import TrelloSync
from datetime import datetime

def main():
    """Run manual sync"""
    print("🔄 Manual Trello Sync")
    print("=" * 40)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        sync = TrelloSync()
        result = sync.run_full_sync()
        
        if result:
            print(f"\n🎉 Sync completed successfully!")
            print(f"   ✅ Synced: {result['synced']} new cards")
            print(f"   ⏭️  Skipped: {result['skipped']} existing cards")
            print(f"   📊 Total processed: {result['total']} cards")
        else:
            print("\n❌ Sync failed")
            
    except Exception as e:
        print(f"\n❌ Sync error: {e}")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()


