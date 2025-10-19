import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('trello_token')?.value;
    const userId = cookieStore.get('trello_user_id')?.value;
    const userName = cookieStore.get('trello_user_name')?.value;
    const userEmail = cookieStore.get('trello_user_email')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      id: userId,
      name: userName || 'Unknown User',
      email: userEmail || '',
      trelloToken: token,
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
