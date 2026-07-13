/**
 * GET /api/lipyd/verify/logs
 *
 * Admin-only endpoint exposing verification logs and contributor anti-abuse state.
 * Returns the in-memory verification logs and current contributor bans/streaks.
 *
 * This endpoint is NOT exposed to contributors — it requires admin authorization.
 *
 * Response:
 * {
 *   logs: VerificationLogEntry[],
 *   contributors: ContributorStats[],
 *   totalBanned: number,
 *   totalWithStreak: number,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getVerificationLogs, getPersistedLogs } from '@/lib/lipyd/verificationService';

interface ContributorRow {
  contributor_id: string;
  contributor_name: string;
  total_verified: number;
  last_verified_at: string | null;
  last_seen_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Verify admin authorization via cookie/session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    // Check authorization using the user's session
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: adminRow } = await supabase
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch contributor stats from the database using service role (bypasses RLS)
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: contributors, error: contribError } = await adminClient
      .from('lipy_contributors')
      .select(
        'contributor_id, contributor_name, total_verified, last_verified_at, last_seen_at',
      )
      .order('last_seen_at', { ascending: false })
      .limit(200);

    if (contribError) {
      console.error('Error fetching contributors:', contribError);
    }

    const contributorStats: ContributorRow[] = (contributors || []) as unknown as ContributorRow[];

    // 3. Get verification logs — merge persisted (Supabase) with in-memory for freshness
    // The persisted logs provide historical depth, while in-memory covers the latest
    // entries that may not have been flushed yet.
    const persistedLogs = await getPersistedLogs(200);
    const memoryLogs = getVerificationLogs(50);

    // Merge: start with persisted, add in-memory entries not already in persisted
    const seenKeys = new Set(persistedLogs.map((l) => `${l.timestamp}-${l.contributorId}`));
    const mergedLogs = [...persistedLogs];
    for (const memLog of memoryLogs) {
      const key = `${memLog.timestamp}-${memLog.contributorId}`;
      if (!seenKeys.has(key)) {
        mergedLogs.push(memLog);
        seenKeys.add(key);
      }
    }

    // Sort by timestamp descending (newest first)
    mergedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(
      {
        logs: mergedLogs.slice(0, 200),
        contributors: contributorStats,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching verification logs:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
