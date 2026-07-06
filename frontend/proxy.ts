import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Redirect code.<domain> to the GitHub repository
  if (host.startsWith('code.')) {
    return NextResponse.redirect('https://github.com/biranchikulesika/lipy', 301);
  }

  // Protect Admin Dashboard Routes using Supabase Auth Session Middleware
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return await updateSession(request);
  }

  return NextResponse.next();
}
