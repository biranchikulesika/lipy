/**
 * POST /api/lipyd/verify
 *
 * Verifies a handwriting sample submission using the LiPy recognition model.
 *
 * Request body (JSON):
 * {
 *   image: string;           // Base64-encoded image data
 *   mimeType: string;        // MIME type of the image (e.g., "image/png")
 *   expectedCharacterId: string;  // Character class ID (e.g., "VOW_A")
 *   expectedCharacter: string;    // The Odia character text (e.g., "ଅ")
 *   contributorId: string;
 *   contributorName: string;
 *   sessionId: string;
 *   mode: string;
 *   clientSampleId: string;
 *   sampleNumber: number;
 *   filename: string;
 *   timestamp: string;
 * }
 *
 * Success response (200):
 * {
 *   accepted: true,
 *   message: "Sample submitted successfully."
 * }
 *
 * Failure response (200):
 * {
 *   accepted: false,
 *   message: "Unable to process this submission. Please try again."
 * }
 *
 * Both success and failure return HTTP 200. The pipeline now stores every
 * sample; failures only occur on actual storage or database errors.
 * Internal errors (500) are returned only for server configuration issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySample } from '@/lib/lipyd/verificationService';

interface VerifyRequestBody {
  image: string;
  mimeType: string;
  expectedCharacterId: string;
  expectedCharacter: string;
  contributorId: string;
  contributorName: string;
  sessionId: string;
  mode: string;
  clientSampleId: string;
  sampleNumber: number;
  filename: string;
  timestamp: string;
}

const GENERIC_FAILURE = 'Unable to process this submission. Please try again.';

function validateRequest(body: unknown): body is VerifyRequestBody {
  if (!body || typeof body !== 'object') return false;

  const r = body as Record<string, unknown>;

  return (
    typeof r.image === 'string' &&
    r.image.length > 0 &&
    typeof r.mimeType === 'string' &&
    typeof r.expectedCharacterId === 'string' &&
    typeof r.expectedCharacter === 'string' &&
    r.expectedCharacter.length > 0 &&
    typeof r.contributorId === 'string' &&
    r.contributorId.length > 0 &&
    typeof r.contributorName === 'string' &&
    typeof r.sessionId === 'string' &&
    typeof r.mode === 'string' &&
    typeof r.clientSampleId === 'string' &&
    typeof r.sampleNumber === 'number' && !Number.isNaN(r.sampleNumber) &&
    typeof r.filename === 'string' &&
    typeof r.timestamp === 'string'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!validateRequest(body)) {
      return NextResponse.json(
        { accepted: false, message: GENERIC_FAILURE },
        { status: 200 },
      );
    }

    const result = await verifySample({
      imageBase64: body.image,
      mimeType: body.mimeType,
      expectedCharacterId: body.expectedCharacterId,
      expectedCharacter: body.expectedCharacter,
      contributorId: body.contributorId,
      contributorName: body.contributorName,
      sessionId: body.sessionId,
      mode: body.mode,
      clientSampleId: body.clientSampleId,
      sampleNumber: body.sampleNumber,
      filename: body.filename,
      timestamp: body.timestamp,
    });

    // Always return HTTP 200. The pipeline now stores every sample;
    // failures only occur on actual storage/database errors.
    return NextResponse.json(
      {
        accepted: result.accepted,
        message: result.accepted ? 'Sample submitted successfully.' : GENERIC_FAILURE,
      },
      { status: 200 },
    );
  } catch (error) {
    // Log internal errors but never expose details to the client
    console.error('Verification API error:', error);

    return NextResponse.json(
      { accepted: false, message: GENERIC_FAILURE },
      { status: 200 },
    );
  }
}

/**
 * GET /api/lipyd/verify
 *
 * Health check endpoint. Does not expose any verification details.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
