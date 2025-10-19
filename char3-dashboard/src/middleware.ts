import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for auth routes and API routes
  if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const token = request.cookies.get('trello_token');
  
  if (!token) {
    // Redirect to sign-in page if not authenticated
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

