'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export type SecurityEventType =
  | 'login'
  | 'logout'
  | 'auto_logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'oauth_login'
  | 'passkey_login'
  | 'passkey_register'
  | 'provider_link'
  | 'provider_unlink'
  | 'active_session'
  | 'sessions_revoked';

function parseUserAgent(ua: string | null) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };

  let browser = 'Other';
  if (ua.includes('Firefox/') && !ua.includes('Seamonkey')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  let os = 'Other';
  if (ua.includes('Windows NT 10')) os = 'Windows 11';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Windows NT 6.2') || ua.includes('Windows NT 6.3')) os = 'Windows 8';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

function getDeviceLabel(browser: string, os: string) {
  if (os === 'Other' && browser === 'Other') return 'Unknown Device';
  if (os === 'Other') return browser;
  if (browser === 'Other') return os;
  return `${browser} on ${os}`;
}

export async function logSecurityEvent(eventType: SecurityEventType, opts?: { userId?: string; metadata?: Record<string, unknown> }) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) return;

    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip =
      forwardedFor?.split(',')[0].trim() ||
      headersList.get('x-real-ip') ||
      'unknown';

    const ua = headersList.get('user-agent');
    const { browser, os } = parseUserAgent(ua);
    const deviceInfo = getDeviceLabel(browser, os);

    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    let userId = opts?.userId;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    if (!userId) return;

    await supabase.from('security_events').insert({
      user_id: userId,
      event_type: eventType,
      status: opts?.metadata?.status || (eventType.endsWith('_failed') ? 'Failed' : 'Success'),
      device_info: deviceInfo,
      browser,
      os,
      ip_address: ip,
      metadata: opts?.metadata || undefined,
    });
  } catch {
    // Gracefully ignore if database table is not created yet
  }
}

export async function logActiveSessionIfStale(userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) return false;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: recentEvents } = await supabase
      .from('security_events')
      .select('created_at')
      .eq('user_id', userId)
      .eq('event_type', 'active_session')
      .order('created_at', { ascending: false })
      .limit(1);

    const hoursSinceLastLog = recentEvents && recentEvents.length > 0
      ? (Date.now() - new Date(recentEvents[0].created_at).getTime()) / (1000 * 60 * 60)
      : 999;

    if (hoursSinceLastLog > 12) {
      const headersList = await headers();
      const forwardedFor = headersList.get('x-forwarded-for');
      const ip = forwardedFor?.split(',')[0].trim() || headersList.get('x-real-ip') || 'unknown';
      const ua = headersList.get('user-agent');
      const { browser, os } = parseUserAgent(ua);

      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'active_session',
        status: 'Success',
        device_info: getDeviceLabel(browser, os),
        browser,
        os,
        ip_address: ip,
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function logSecurityEventDirect(
  supabaseUrl: string,
  serviceKey: string,
  eventType: SecurityEventType,
  userId: string,
  ip: string,
  ua: string | null,
  opts?: { status?: string; metadata?: Record<string, unknown> }
) {
  try {
    const { browser, os } = parseUserAgent(ua);
    const deviceInfo = getDeviceLabel(browser, os);

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);

    await supabase.from('security_events').insert({
      user_id: userId,
      event_type: eventType,
      status: opts?.status || (eventType.endsWith('_failed') ? 'Failed' : 'Success'),
      device_info: deviceInfo,
      browser,
      os,
      ip_address: ip,
      metadata: opts?.metadata || undefined,
    });
  } catch {
    // Gracefully ignore
  }
}

export async function revokeOtherSessions(
  userId: string,
  currentSessionId: string,
  clientInfo?: { browser: string; os: string; ip?: string }
): Promise<{ success: boolean; revokedCount: number; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return { success: false, revokedCount: 0, error: 'Missing Supabase configuration' };
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc('revoke_other_sessions', {
      p_user_id: userId,
      p_current_session_id: currentSessionId,
    });

    if (error) {
      console.error('revokeOtherSessions RPC error:', error);
      return { success: false, revokedCount: 0, error: error.message };
    }

    const revokedCount = typeof data === 'number' ? data : 0;

    // Log the event using client-provided browser/OS (more reliable than server-side UA parsing)
    try {
      let browser = 'Unknown';
      let os = 'Unknown';

      if (clientInfo?.browser) {
        // Client sends raw navigator.userAgent — parse it
        const parsed = parseUserAgent(clientInfo.browser);
        browser = parsed.browser;
        os = parsed.os;
      } else if (clientInfo?.os) {
        // Client sent pre-parsed platform string
        os = clientInfo.os;
      }

      const ip = clientInfo?.ip || 'unknown';

      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'sessions_revoked',
        status: 'Success',
        device_info: getDeviceLabel(browser, os),
        browser,
        os,
        ip_address: ip,
        metadata: { revoked_count: revokedCount, current_session_id: currentSessionId },
      });
    } catch {
      // Non-critical: don't fail the revoke if logging fails
    }

    return { success: true, revokedCount };
  } catch (err: unknown) {
    console.error('revokeOtherSessions error:', err);
    return {
      success: false,
      revokedCount: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
