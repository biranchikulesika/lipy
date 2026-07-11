import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

const authOptions = {
  auth: {
    experimental: { passkey: true },
  },
} as const;

export function createClient(url?: string, key?: string) {
  if (typeof window === 'undefined') {
    const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
    return createBrowserClient(supabaseUrl, supabaseAnonKey, authOptions);
  }

  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey, authOptions);
  }

  return client;
}

