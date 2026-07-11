import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logSecurityEventDirect } from '../../security-actions';
import { getSupabaseAdmin } from '@/lib/supabase/server';

function parseBrowser(ua: string | null): string {
  if (!ua) return 'Other';
  if (ua.includes('Firefox/') && !ua.includes('Seamonkey')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  return 'Other';
}

function parseOs(ua: string | null): string {
  if (!ua) return 'Other';
  if (ua.includes('Windows NT 10')) return 'Windows 11';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Other';
}

function deviceInfo(os: string, browser: string): string {
  return os === 'Other' && browser === 'Other'
    ? 'Unknown Device'
    : os === 'Other' ? browser : browser === 'Other' ? os : `${browser} on ${os}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host;
  
  let cleanHost = host;
  if (cleanHost.startsWith('0.0.0.0')) {
    cleanHost = cleanHost.replace('0.0.0.0', 'localhost');
  }

  const protocol = request.headers.get('x-forwarded-proto') || (requestUrl.protocol === 'https:' ? 'https' : 'http');
  const origin = `${protocol}://${cleanHost}`;

  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/admin';
  const provider = searchParams.get('provider');

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const ua = request.headers.get('user-agent');
  const browser = parseBrowser(ua);
  const os = parseOs(ua);
  const device = deviceInfo(os, browser);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // ── Admin authorization check ──
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (serviceKey) {
        const admin = getSupabaseAdmin();
        const { data: adminRow } = await admin
          .from('admins')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!adminRow) {
          // User authenticated successfully but is not in the admins table
          await supabase.auth.signOut();

          await logSecurityEventDirect(
            supabaseUrl, serviceKey,
            'login_failed', data.user.id, ip, ua,
            { status: 'Not Authorized', metadata: { provider: provider || 'unknown', reason: 'not_in_admins_table' } }
          );

          return NextResponse.redirect(new URL('/admin/login?error=not_registered', origin).toString());
        }
      }

      logSecurityEventDirect(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'oauth_login',
        data.user.id,
        ip,
        ua,
        { status: 'Success', metadata: { provider: provider || 'unknown' } }
      ).catch(() => {});

      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Log failed OAuth exchange
    logSecurityEventDirect(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      'login_failed',
      '00000000-0000-0000-0000-000000000000',
      ip,
      ua,
      { status: 'Failed', metadata: { method: 'oauth', provider: provider || 'unknown', reason: error?.message || 'code_exchange_failed' } }
    ).catch(() => {});
  }

  return NextResponse.redirect(new URL('/admin/login?error=auth_failed', origin).toString());
}
