import { NextResponse } from 'next/server';
import { extractProfile, matchSchemes } from '@/lib/openai';
import { loadSchemes } from '@/lib/schemes';
import type { Language, QueryResponse } from '@/lib/schemes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface QueryBody {
  text?: string;
  language?: Language;
}

export async function POST(req: Request) {
  let body: QueryBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const text = (body.text || '').trim();
  const language: Language = body.language === 'en' ? 'en' : 'hi';

  if (!text) {
    return NextResponse.json(
      { error: 'Missing text' },
      { status: 400 },
    );
  }
  if (text.length > 4000) {
    return NextResponse.json(
      { error: 'Text too long (max 4000 chars)' },
      { status: 400 },
    );
  }

  try {
    const schemes = loadSchemes();
    const profile = await extractProfile(text, language);
    const { matches, summary } = await matchSchemes(profile, schemes, language);

    const response: QueryResponse = {
      profile,
      matches,
      summary,
      cached: false,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error('[/api/query] error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'query_failed',
        message,
        hint:
          'Falling back to cached scenarios is recommended. Check OPENAI_API_KEY in .env.local.',
      },
      { status: 500 },
    );
  }
}
