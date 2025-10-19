import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const authHeader = request.headers.get('authorization');
    
    if (!boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token is required' }, { status: 401 });
    }
    
    const userToken = authHeader.substring(7);
    
    // Check if user has access to the board
    const response = await fetch(
      `https://api.trello.com/1/boards/${boardId}?key=${process.env.NEXT_PUBLIC_TRELLO_API_KEY}&token=${userToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.ok) {
      return NextResponse.json({ hasAccess: true });
    } else if (response.status === 401) {
      return NextResponse.json({ hasAccess: false, error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.json({ hasAccess: false, error: 'Access denied' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error checking board access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

