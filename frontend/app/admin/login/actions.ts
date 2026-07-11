'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { logSecurityEventDirect } from '../security-actions';

// In-memory rate limiter.
// NOTE: This is suitable for development but is not reliable on
// serverless deployments where multiple instances may be created.
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export async function authenticateUser(email: string, password: string) {
  const headersList = await headers();

  const forwardedFor = headersList.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    'unknown';

  const ua = headersList.get('user-agent');

  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (record && record.expiresAt > now) {
    if (record.count >= 5) {
      return {
        error: {
          message: 'Invalid login credentials',
        },
      };
    }

    record.count += 1;
  } else {
    rateLimitMap.set(ip, {
      count: 1,
      expiresAt: now + 5 * 60 * 1000,
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error: {
        message: 'Authentication is unavailable because Supabase is not configured.',
      },
    };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logSecurityEventDirect(supabaseUrl, serviceKey || '', 'login_failed', '00000000-0000-0000-0000-000000000000', ip, ua, {
      status: 'Failed',
      metadata: { method: 'email_password', email, reason: error.message },
    }).catch(() => {});

    return {
      error: {
        message: 'Invalid login credentials',
      },
    };
  }

  // Reset rate limit after successful authentication.
  rateLimitMap.delete(ip);

  // Log successful login
  if (data.user) {
    logSecurityEventDirect(supabaseUrl, serviceKey || '', 'login', data.user.id, ip, ua, {
      status: 'Success',
      metadata: { method: 'email_password' },
    }).catch(() => {});
  }

  return {
    error: null,
  };
}
