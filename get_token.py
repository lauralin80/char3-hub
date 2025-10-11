#!/usr/bin/env python3
"""
Helper script to get Trello token through OAuth flow
"""

from config import TrelloConfig
import webbrowser
import urllib.parse

def get_authorization_url():
    """Generate the authorization URL for Trello OAuth"""
    base_url = "https://trello.com/1/authorize"
    params = {
        'key': TrelloConfig.API_KEY,
        'response_type': 'token',
        'scope': 'read,write',
        'expiration': 'never',
        'name': 'Project Management Tool'
    }
    
    # For local development, we'll use a simple redirect
    # In production, you'd want to use a proper callback URL
    query_string = urllib.parse.urlencode(params)
    return f"{base_url}?{query_string}"

def main():
    """Main function to get Trello token"""
    print("🔑 Trello Token Setup")
    print("=" * 40)
    
    # Validate API key is set
    try:
        TrelloConfig.validate()
        print("✅ API Key and Secret are configured")
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return
    
    # Show redirect origins for Power-Up setup
    redirect_origins = TrelloConfig.get_redirect_origins()
    print(f"\n🔧 For Power-Up Admin Portal, use these redirect origins:")
    for origin in redirect_origins:
        print(f"   • {origin}")
    
    # Generate authorization URL
    auth_url = get_authorization_url()
    
    print(f"\n📋 Your API Key: {TrelloConfig.API_KEY}")
    print(f"🔐 Your Secret: {TrelloConfig.SECRET}")
    
    print(f"\n🌐 Authorization URL:")
    print(auth_url)
    
    print(f"\n📝 Instructions:")
    print("1. In Power-Up Admin Portal, add the redirect origins listed above")
    print("2. Copy the URL above and paste it into your browser")
    print("3. Authorize the application")
    print("4. Copy the token from the resulting page")
    print("5. Set it as an environment variable: export TRELLO_TOKEN=your_token_here")
    print("6. Or add it to your .env file: TRELLO_TOKEN=your_token_here")
    
    print(f"\n🚀 For Vercel deployment later:")
    print("   • Update redirect origins in Power-Up Admin Portal to your Vercel domain")
    print("   • Set TRELLO_TOKEN as environment variable in Vercel dashboard")
    
    # Try to open the URL automatically
    try:
        webbrowser.open(auth_url)
        print(f"\n🚀 Opened authorization URL in your default browser!")
    except Exception as e:
        print(f"\n⚠️  Could not open browser automatically: {e}")
        print("Please copy and paste the URL manually.")

if __name__ == "__main__":
    main()
