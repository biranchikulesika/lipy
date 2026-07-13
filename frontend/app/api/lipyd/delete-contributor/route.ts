/**
 * POST /api/lipyd/delete-contributor
 *
 * Permanently deletes a contributor and all associated data across tables:
 *   - lipy_samples   (all samples by this contributor)
 *   - verification_logs  (all verification log entries)
 *   - lipy_sessions     (all sessions)
 *   - lipy_contributors (profile row)
 *
 * Requires an authenticated admin session. Uses the service role key to
 * bypass RLS for cascade deletion.
 *
 * Request body (JSON):
 *   { contributorId: string }
 *
 * Success response (200):
 *   { success: true, message: "Contributor deleted successfully." }
 *
 * Error responses:
 *   400 — Missing contributorId
 *   401 — Not authenticated
 *   403 — Not an admin
 *   500 — Internal server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseAdmin } from '@/lib/supabase/server';

interface DeleteRequestBody {
  contributorId: string;
}

function validateRequest(body: unknown): body is DeleteRequestBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return typeof r.contributorId === 'string' && r.contributorId.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate request
    const body: unknown = await request.json();
    if (!validateRequest(body)) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid contributorId.' },
        { status: 400 },
      );
    }

    const { contributorId } = body;

    // 2. Verify session via SSR client (reads cookies properly)
    const serverClient = await getSupabaseServerClient();

    const { data: { session }, error: sessionError } = await serverClient.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    // 3. Check admin role using service-role key — the admins table has
    //    no SELECT policy for anon/authenticated in the live DB, so the
    //    SSR client (which uses the anon key) would be blocked by RLS.
    const adminClient = getSupabaseAdmin();

    const { data: adminRow, error: adminError } = await adminClient
      .from('admins')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (adminError || !adminRow) {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required.' },
        { status: 403 },
      );
    }

    const role = adminRow.role as string;
    if (!['owner', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions. Owner or Admin role required.' },
        { status: 403 },
      );
    }

    // 4. Execute deletion across tables in order (respecting FK constraints)
    const deletionResults: Record<string, { status: string; count?: number; error?: string }> = {};

    // 3a. Delete samples
    const { count: deletedSamples, error: samplesError } = await adminClient
      .from('lipy_samples')
      .delete()
      .eq('contributor_id', contributorId);

    if (samplesError) {
      deletionResults.samples = { status: 'error', error: samplesError.message };
    } else {
      deletionResults.samples = { status: 'ok', count: deletedSamples ?? 0 };
    }

    // 3b. Delete verification logs
    const { count: deletedLogs, error: logsError } = await adminClient
      .from('verification_logs')
      .delete()
      .eq('contributor_id', contributorId);

    if (logsError) {
      deletionResults.logs = { status: 'error', error: logsError.message };
    } else {
      deletionResults.logs = { status: 'ok', count: deletedLogs ?? 0 };
    }

    // 3c. Delete sessions
    const { count: deletedSessions, error: sessionsError } = await adminClient
      .from('lipy_sessions')
      .delete()
      .eq('contributor_id', contributorId);

    if (sessionsError) {
      deletionResults.sessions = { status: 'error', error: sessionsError.message };
    } else {
      deletionResults.sessions = { status: 'ok', count: deletedSessions ?? 0 };
    }

    // 3d. Delete contributor profile (last — FK from other tables reference this)
    const { count: deletedProfiles, error: profileError } = await adminClient
      .from('lipy_contributors')
      .delete()
      .eq('contributor_id', contributorId);

    if (profileError) {
      deletionResults.profile = { status: 'error', error: profileError.message };
    } else {
      deletionResults.profile = { status: 'ok', count: deletedProfiles ?? 0 };
    }

    // 5. Check if any deletions failed
    const hasErrors = Object.values(deletionResults).some(r => r.status === 'error');

    if (hasErrors) {
      console.error('Partial contributor deletion failure:', deletionResults);
      return NextResponse.json(
        {
          success: false,
          message: 'Some records could not be deleted. Check server logs.',
          details: deletionResults,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contributor deleted successfully.',
      details: deletionResults,
    });
  } catch (error) {
    console.error('Delete contributor API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
