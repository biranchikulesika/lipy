import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

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
    const url = request.nextUrl.clone()
    if (url.host.startsWith('0.0.0.0')) {
      url.host = url.host.replace('0.0.0.0', 'localhost');
    }
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone()
    if (url.host.startsWith('0.0.0.0')) {
      url.host = url.host.replace('0.0.0.0', 'localhost');
    }
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // ── Admin authorization check ──
  // Authenticated users must exist in the admins table to access the dashboard.
  const isPasswordFlow = request.nextUrl.pathname.startsWith('/admin/forgot-password') ||
    request.nextUrl.pathname.startsWith('/admin/reset-password')

  if (user && !isLoginRoute && !isPasswordFlow) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (serviceKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const admin = createClient(supabaseUrl, serviceKey);
        const { data: adminRow } = await admin
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!adminRow) {
          // User is authenticated but not an admin — sign out immediately
          await supabase.auth.signOut();

          const forwardedFor = request.headers.get('x-forwarded-for');
          const ip = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
          const ua = request.headers.get('user-agent');

          let browser = 'Other';
          let os = 'Other';
          if (ua) {
            if (ua.includes('Firefox/') && !ua.includes('Seamonkey')) browser = 'Firefox';
            else if (ua.includes('Edg/')) browser = 'Edge';
            else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
            else if (ua.includes('Chrome/')) browser = 'Chrome';
            else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

            if (ua.includes('Windows NT 10')) os = 'Windows 11';
            else if (ua.includes('Windows')) os = 'Windows';
            else if (ua.includes('Mac OS X')) os = 'macOS';
            else if (ua.includes('Android')) os = 'Android';
            else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
            else if (ua.includes('Linux')) os = 'Linux';
          }

          const deviceInfo = os === 'Other' && browser === 'Other'
            ? 'Unknown Device'
            : os === 'Other' ? browser : browser === 'Other' ? os : `${browser} on ${os}`;

          await admin.from('security_events').insert({
            user_id: user.id,
            event_type: 'login_failed',
            status: 'Not Authorized',
            device_info: deviceInfo,
            browser,
            os,
            ip_address: ip,
            metadata: { reason: 'not_in_admins_table' },
          });

          const url = request.nextUrl.clone()
          if (url.host.startsWith('0.0.0.0')) {
            url.host = url.host.replace('0.0.0.0', 'localhost');
          }
          url.pathname = '/admin/login'
          url.searchParams.set('error', 'not_registered')
          return NextResponse.redirect(url)
        }
      } catch {
        // If admin check fails (e.g. table doesn't exist), allow through
        // to avoid locking out all users during initial setup
      }
    }
  }

  // ── 24-hour session expiry enforcement ──
  if (user) {
    const session = (await supabase.auth.getSession()).data.session
    if (session?.access_token) {
      const payload = decodeJwtPayload(session.access_token)
      const iat = payload?.iat as number | undefined

      if (iat) {
        const sessionAgeMs = Date.now() - iat * 1000
        if (sessionAgeMs > SESSION_MAX_AGE_MS) {
          // Session exceeded 24 hours — sign out and log the auto-expiry
          await supabase.auth.signOut()

          // Log the auto-logout event directly (middleware can't use server actions)
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
          if (serviceKey) {
            try {
              const { createClient } = await import('@supabase/supabase-js');
              const admin = createClient(supabaseUrl, serviceKey);

              const forwardedFor = request.headers.get('x-forwarded-for');
              const ip = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
              const ua = request.headers.get('user-agent');

              let browser = 'Other';
              let os = 'Other';
              if (ua) {
                if (ua.includes('Firefox/') && !ua.includes('Seamonkey')) browser = 'Firefox';
                else if (ua.includes('Edg/')) browser = 'Edge';
                else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
                else if (ua.includes('Chrome/')) browser = 'Chrome';
                else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

                if (ua.includes('Windows NT 10')) os = 'Windows 11';
                else if (ua.includes('Windows')) os = 'Windows';
                else if (ua.includes('Mac OS X')) os = 'macOS';
                else if (ua.includes('Android')) os = 'Android';
                else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
                else if (ua.includes('Linux')) os = 'Linux';
              }

              const deviceInfo = os === 'Other' && browser === 'Other'
                ? 'Unknown Device'
                : os === 'Other' ? browser : browser === 'Other' ? os : `${browser} on ${os}`;

              await admin.from('security_events').insert({
                user_id: user.id,
                event_type: 'auto_logout',
                status: 'Auto-Expired',
                device_info: deviceInfo,
                browser,
                os,
                ip_address: ip,
                metadata: { reason: 'session_expired_24h', session_age_hours: Math.round(sessionAgeMs / (1000 * 60 * 60)) },
              });
            } catch {
              // Best-effort logging — don't block the redirect
            }
          }

          const url = request.nextUrl.clone()
          if (url.host.startsWith('0.0.0.0')) {
            url.host = url.host.replace('0.0.0.0', 'localhost');
          }
          url.pathname = '/admin/login'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}
