import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear all authentication cookies
  cookieStore.delete('trello_token');
  cookieStore.delete('trello_user_id');
  cookieStore.delete('trello_user_name');
  cookieStore.delete('trello_user_email');

  return NextResponse.json({ success: true });
}
