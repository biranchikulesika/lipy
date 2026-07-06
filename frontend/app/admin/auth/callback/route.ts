import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl.toString());
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/admin/login?error=auth_failed', origin).toString());
}
