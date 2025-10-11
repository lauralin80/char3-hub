#!/usr/bin/env python3
"""
Automated Trello Sync Scheduler
Runs the sync automation on a schedule
"""

import schedule
import time
from trello_sync import TrelloSync
from datetime import datetime

def run_sync():
    """Run the sync automation"""
    print(f"\n🔄 Running scheduled sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    try:
        sync = TrelloSync()
        result = sync.run_full_sync()
        
        if result:
            print(f"✅ Sync completed successfully")
            print(f"   - Synced: {result['synced']} cards")
            print(f"   - Skipped: {result['skipped']} cards")
            print(f"   - Total: {result['total']} cards")
        else:
            print("❌ Sync failed")
            
    except Exception as e:
        print(f"❌ Sync error: {e}")
    
    print("=" * 60)

def main():
    """Main scheduler function"""
    print("🚀 Starting Trello Auto-Sync Scheduler")
    print("=" * 50)
    
    # Schedule syncs
    schedule.every(15).minutes.do(run_sync)  # Every 15 minutes
    schedule.every().hour.do(run_sync)       # Every hour
    schedule.every().day.at("09:00").do(run_sync)  # Daily at 9 AM
    schedule.every().day.at("17:00").do(run_sync)  # Daily at 5 PM
    
    print("📅 Sync schedule:")
    print("   - Every 15 minutes")
    print("   - Every hour")
    print("   - Daily at 9:00 AM")
    print("   - Daily at 5:00 PM")
    print("\n🔄 Starting scheduler... (Press Ctrl+C to stop)")
    
    # Run initial sync
    run_sync()
    
    # Keep running
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        print("\n🛑 Scheduler stopped by user")

if __name__ == "__main__":
    main()


