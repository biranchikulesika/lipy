/**
 * POST /api/lipyd/verify/reject
 *
 * Records a definitive rejection for a sample whose auto-retries have been
 * exhausted. Applies the rejection penalty to the contributor *once* per
 * clientSampleId (idempotent via an in-memory set).
 *
 * This is the retry-aware anti-abuse endpoint: unlike the per-attempt
 * penalties that were removed from the verification pipeline, this endpoint
 * only penalises samples that have failed every auto-retry attempt.
 *
 * Request body (JSON):
 * {
 *   contributorId: string;
 *   contributorName: string;
 *   clientSampleId: string;
 * }
 *
 * Success response (200):
 * {
 *   ok: true,
 *   invalidStreak: number,
 *   banned: boolean,
 *   bannedUntil: string | null
 * }
 *
 * Already-penalised response (200):
 * {
 *   ok: true,
 *   alreadyPenalised: true,
 *   invalidStreak: number,
 *   banned: boolean
 * }
 *
 * Error response (500):
 * {
 *   ok: false,
 *   error: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  MAX_INVALID_STREAK,
  TEMP_BAN_DURATION_HOURS,
  TRUST_SCORE_INITIAL,
  TRUST_BAN_THRESHOLD,
  TRUST_PENALTY,
} from '@/constants/LiPy';

// ─── Idempotency set ───
// Tracks which clientSampleIds have already been penalised across this
// server instance. Resets on deploy/restart, which is acceptable — a
// duplicate penalty after a server restart is harmless.
const penalisedSamples = new Set<string>();

// ─── Request type ───

interface RejectRequestBody {
  contributorId: string;
  contributorName: string;
  clientSampleId: string;
}

// ─── Supabase helper ───

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    throw new Error('Supabase URL or service role key is not configured');
  }
  return createClient(url, key);
}

// ─── Validation ───

function validateRequest(body: unknown): body is RejectRequestBody {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.contributorId === 'string' && r.contributorId.length > 0 &&
    typeof r.contributorName === 'string' &&
    typeof r.clientSampleId === 'string' && r.clientSampleId.length > 0
  );
}

// ─── Handler ───

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!validateRequest(body)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { contributorId, contributorName, clientSampleId } = body;

    // Idempotency check — skip if this sample was already penalised
    if (penalisedSamples.has(clientSampleId)) {
      return NextResponse.json(
        { ok: true, alreadyPenalised: true },
        { status: 200 },
      );
    }

    const supabase = getServiceClient();
    const now = new Date().toISOString();

    // ─── Read current contributor state ───

    const { data: existing } = await supabase
      .from('lipy_contributors')
      .select('invalid_streak, trust_score, total_rejected')
      .eq('contributor_id', contributorId)
      .single();

    const currentStreak = existing?.invalid_streak != null ? Number(existing.invalid_streak) : 0;
    const currentTrust = existing?.trust_score != null ? Number(existing.trust_score) : TRUST_SCORE_INITIAL;

    // ─── Apply penalty ───

    const newStreak = currentStreak + 1;
    const newTrust = Math.max(0, currentTrust + TRUST_PENALTY);
    const currentRejected = existing?.total_rejected != null ? Number(existing.total_rejected) : 0;

    const payload: Record<string, unknown> = {
      contributor_id: contributorId,
      contributor_name: contributorName,
      last_seen_at: now,
      invalid_streak: newStreak,
      last_invalid_at: now,
      trust_score: newTrust,
      total_rejected: currentRejected + 1,
    };

    let banned = false;
    let bannedUntil: string | null = null;

    if (newStreak >= MAX_INVALID_STREAK || newTrust < TRUST_BAN_THRESHOLD) {
      bannedUntil = new Date(
        Date.now() + TEMP_BAN_DURATION_HOURS * 60 * 60 * 1000,
      ).toISOString();
      payload.banned_until = bannedUntil;
      banned = true;
    }

    const { error: upsertError } = await supabase
      .from('lipy_contributors')
      .upsert(payload, { onConflict: 'contributor_id' });

    if (upsertError) {
      console.error('Reject upsert failed:', String(upsertError));
      return NextResponse.json(
        { ok: false, error: 'Failed to record rejection' },
        { status: 500 },
      );
    }

    // Mark as penalised so future calls for the same sample are idempotent
    penalisedSamples.add(clientSampleId);

    return NextResponse.json({
      ok: true,
      alreadyPenalised: false,
      invalidStreak: newStreak,
      banned,
      bannedUntil,
    });
  } catch (error) {
    console.error('Reject API error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
