import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // If Supabase keys are not set, bypass authentication check (e.g. local setup without Supabase env keys)
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginRoute = request.nextUrl.pathname.startsWith('/admin/login')
  const isAuthCallback = request.nextUrl.pathname.startsWith('/admin/auth/callback')

  if (isAuthCallback) {
     return supabaseResponse;
  }

  if (!user && !isLoginRoute) {
    // no user, redirect to the login page
    const url = request.nextUrl.clone()
    if (url.host.startsWith('0.0.0.0')) {
      url.host = url.host.replace('0.0.0.0', 'localhost');
    }
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginRoute) {
    // redirect off login page if already authenticated 
    const url = request.nextUrl.clone()
    if (url.host.startsWith('0.0.0.0')) {
      url.host = url.host.replace('0.0.0.0', 'localhost');
    }
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
