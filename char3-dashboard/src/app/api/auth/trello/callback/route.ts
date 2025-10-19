import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  console.log('Full callback URL:', request.url);
  console.log('All search params:', Object.fromEntries(searchParams.entries()));

  // Trello returns the token in the URL fragment, not as a query parameter
  // We need to handle this differently
  const url = new URL(request.url);
  const hash = url.hash.substring(1); // Remove the # symbol
  const hashParams = new URLSearchParams(hash);
  
  const token = hashParams.get('token') || searchParams.get('token');

  console.log('Token from hash:', hashParams.get('token'));
  console.log('Token from params:', searchParams.get('token'));
  console.log('Final token:', token);

  if (!token) {
    console.log('No token found in callback');
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
    const cookieStore = await cookies();

    if (!apiKey) {
      throw new Error('Missing API key');
    }

    // Get user info with the token
    const userResponse = await fetch(
      `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User info error:', errorText);
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();
    console.log('User data received:', userData.fullName);

    // Set secure cookies
    cookieStore.set('trello_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    cookieStore.set('trello_user_id', userData.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    cookieStore.set('trello_user_name', userData.fullName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    cookieStore.set('trello_user_email', userData.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}
