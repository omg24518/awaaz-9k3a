import { NextResponse } from 'next/server';
import { streamTts as streamTtsElevenLabs, type TtsResult } from '@/lib/elevenlabs';
import { hasGoogleTtsCredentials, streamTtsGoogle } from '@/lib/google-tts';
import type { Language } from '@/lib/schemes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TtsBody {
  text?: string;
  language?: Language;
}

// Provider selection:
//   1. If Google credentials are set, prefer Google Cloud TTS.
//   2. If Google fails at runtime, fall back to ElevenLabs.
//   3. If neither is available, return a 503 the frontend can degrade on.
async function runTts(text: string, language: Language): Promise<TtsResult> {
  const hasGoogle = hasGoogleTtsCredentials();
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;

  if (hasGoogle) {
    const google = await streamTtsGoogle(text, language);
    if (google.ok) return google;
    // Log the Google-side failure for demo-day debugging, then retry with
    // ElevenLabs if available so the user still hears something.
    console.warn(
      '[tts] google failed, status=%s err=%s — falling back to elevenlabs',
      google.status,
      (google.error || '').slice(0, 200),
    );
    if (hasElevenLabs) {
      const eleven = await streamTtsElevenLabs(text, language);
      if (eleven.ok) return eleven;
      console.warn(
        '[tts] elevenlabs fallback also failed, status=%s err=%s',
        eleven.status,
        (eleven.error || '').slice(0, 200),
      );
      return eleven;
    }
    return google;
  }

  if (hasElevenLabs) {
    return streamTtsElevenLabs(text, language);
  }

  return {
    ok: false,
    status: 503,
    body: null,
    contentType: 'application/json',
    error:
      'No TTS provider configured (set Google TTS credentials or ELEVENLABS_API_KEY)',
  };
}

export async function POST(req: Request) {
  let body: TtsBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = (body.text || '').trim();
  const language: Language = body.language === 'en' ? 'en' : 'hi';

  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }
  if (text.length > 1500) {
    return NextResponse.json(
      { error: 'Text too long (max 1500 chars for TTS)' },
      { status: 400 },
    );
  }

  const result = await runTts(text, language);

  if (!result.ok || !result.body) {
    return NextResponse.json(
      {
        error: 'tts_unavailable',
        message: result.error || 'TTS upstream error',
      },
      { status: result.status || 503 },
    );
  }

  return new Response(result.body, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'no-store',
    },
  });
}
