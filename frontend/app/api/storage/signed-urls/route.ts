import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const BATCH_SIZE = 100;
const DEFAULT_EXPIRY = 3600;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, paths, expiresIn } = body as {
      bucket?: string;
      paths?: string[];
      expiresIn?: number;
    };

    if (!bucket || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'bucket and paths[] are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const expiry = expiresIn ?? DEFAULT_EXPIRY;
    const allUrls: any[] = [];

    for (let i = 0; i < paths.length; i += BATCH_SIZE) {
      const batch = paths.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(batch, expiry);

      if (error) {
        console.error('Signed URL generation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (data) allUrls.push(...data);
    }

    return NextResponse.json({ urls: allUrls });
  } catch (err) {
    console.error('Signed URLs API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
