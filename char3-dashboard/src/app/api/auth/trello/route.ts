import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'login') {
    try {
      const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
      const callbackUrl = `${process.env.NEXTAUTH_URL}/auth/callback`;

      if (!apiKey) {
        throw new Error('Missing API key');
      }

      // Use the correct Trello authorization URL format
      const authUrl = `https://trello.com/1/authorize?key=${apiKey}&return_url=${encodeURIComponent(callbackUrl)}&scope=read,write,account&expiration=never&name=Char3%20Dashboard`;
      
      console.log('Redirecting to Trello authorization:', authUrl);
      
      return NextResponse.redirect(authUrl);
    } catch (error) {
      console.error('Authorization error:', error);
      return NextResponse.redirect(new URL('/auth/error', request.url));
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
