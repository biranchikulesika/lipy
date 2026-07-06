'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

// In-Memory Rate Limiter Map
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export async function authenticateUser(email: string, password: string) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 
             'admin-ip';
  const now = Date.now();
  
  const record = rateLimitMap.get(ip);
  if (record && record.expiresAt > now) {
    if (record.count >= 5) {
      return { error: { message: 'Invalid login credentials' } };
    }
    record.count += 1;
  } else {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 5 * 60 * 1000 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Fallback: If Supabase configuration keys are missing, validate local admin account
  if (!supabaseUrl || !supabaseAnonKey) {
    if (email === 'admin@lipy.app' && password === 'LiPyD@2026') {
      rateLimitMap.delete(ip);
      return { error: null };
    }
    return { error: { message: 'Invalid login credentials (Missing Supabase configuration keys)' } };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: { message: 'Invalid login credentials' } };
  }

  // Reset rate limits on success
  rateLimitMap.delete(ip);
  return { error: null };
}
