import { createClient } from '@/lib/supabase/client';

// Reuse the main auth client singleton to avoid multiple GoTrueClient instances.
// The LiPyD module does not need its own Supabase client — it only performs
// anonymous data operations (storage uploads + table upserts) which work fine
// through the same client that handles admin authentication.

let client: ReturnType<typeof createClient> | null = null;

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  }
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseConfig();
  return Boolean(url && publishableKey);
}

export function getSupabaseClient() {
  const { url, publishableKey } = getSupabaseConfig();
  if (!url || !publishableKey) return null;

  // Persist across HMR to avoid recreating on hot reloads
  if (!client) {
    if (typeof window !== 'undefined' && (window as any).__lipy_supabase_client) {
      client = (window as any).__lipy_supabase_client;
    } else {
      // Use the shared browser client singleton — no more duplicate GoTrueClient
      client = createClient(url, publishableKey);
      if (typeof window !== 'undefined') {
        (window as any).__lipy_supabase_client = client;
      }
    }
  }

  return client;
}
