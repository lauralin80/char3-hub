#!/usr/bin/env python3
"""
Trello Project Management Analyzer
Connects to Trello and analyzes current board setup for software development projects
"""

import os
from trello_analyzer import TrelloAnalyzer
from trello_client import TrelloClient

def main():
    """Main function to analyze Trello setup"""
    print("🔗 Connecting to Trello...")
    
    try:
        # Initialize analyzer
        analyzer = TrelloAnalyzer()
        client = TrelloClient()
        
        print("✅ Successfully connected to Trello!")
        
        # Get all boards
        print("\n📊 Analyzing your Trello boards...")
        analyses = analyzer.analyze_all_boards()
        
        if not analyses:
            print("❌ No boards found. Please check your Trello account.")
            return
        
        print(f"\n📋 Found {len(analyses)} board(s):")
        
        # Print summary for each board
        for analysis in analyses:
            analyzer.print_board_summary(analysis)
            
            # Print suggestions
            suggestions = analyzer.suggest_improvements(analysis)
            if suggestions:
                print(f"\n   💡 Suggestions for {analysis.board_name}:")
                for suggestion in suggestions:
                    print(f"      • {suggestion}")
        
        print("\n" + "="*60)
        print("🎯 Next Steps:")
        print("1. Review the current board structure")
        print("2. Consider implementing the suggested improvements")
        print("3. Let's discuss your specific challenges and requirements")
        print("4. Plan the feature tracking and milestone system")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n🔧 Setup Instructions:")
        print("1. Go to https://trello.com/app-key and click 'Go to the Power-Up Admin Portal'")
        print("2. Create a new Power-Up to get your API key")
        print("3. Get your token from: https://trello.com/1/authorize?key=YOUR_API_KEY&response_type=token&scope=read,write&expiration=never")
        print("4. Create a .env file with:")
        print("   TRELLO_API_KEY=your_api_key_here")
        print("   TRELLO_TOKEN=your_token_here")

if __name__ == "__main__":
    main()
