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
  // Protect Admin Dashboard Routes using Supabase Auth Session Middleware
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return await updateSession(request);
  }

  return NextResponse.next();
}
