import type { Language } from './schemes';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

// Voice IDs used with the `eleven_multilingual_v2` model.
//
// IMPORTANT: ElevenLabs blocks "library voices" (community/marketplace
// voices like Kanika, Niraj, Monika) for free-tier accounts and returns
// HTTP 402 "paid_plan_required". The defaults below are from ElevenLabs'
// 9 always-free Default voices, which work for everyone — Hindi
// pronunciation is good (multilingual_v2), with a faint non-Indian accent.
//
// To unlock a native Indian voice, upgrade to Starter ($5/mo) and override
// ELEVENLABS_VOICE_ID_HINDI in .env.local. See .env.local.example for
// recommended library voice IDs.
//
// Hindi default:   Sarah  — soft, warm, female; clearest Hindi of the free voices.
// English default: Sarah  — same voice for brand consistency.
const DEFAULT_HINDI_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (free default)
const DEFAULT_ENGLISH_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (free default)

const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

function pickVoiceId(language: Language): string {
  if (language === 'hi') {
    return process.env.ELEVENLABS_VOICE_ID_HINDI || DEFAULT_HINDI_VOICE_ID;
  }
  return process.env.ELEVENLABS_VOICE_ID_ENGLISH || DEFAULT_ENGLISH_VOICE_ID;
}

export interface TtsResult {
  ok: boolean;
  status: number;
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
  error?: string;
}

export async function streamTts(
  text: string,
  language: Language,
): Promise<TtsResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      body: null,
      contentType: 'application/json',
      error: 'ELEVENLABS_API_KEY not set',
    };
  }

  const voiceId = pickVoiceId(language);
  // optimize_streaming_latency=3 → balanced quality/latency. Higher = faster
  // first byte but slightly worse pronunciation; 3 is the sweet spot for
  // narration. mp3_44100_128 = 128kbps MP3, plays everywhere.
  const url = `${ELEVENLABS_BASE}/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3&output_format=mp3_44100_128`;

  // Voice settings tuned for narration of welfare-scheme summaries:
  // - stability 0.55: a touch of expressiveness without wandering pitch
  // - similarity_boost 0.85: keeps Kanika's warm tone consistent
  // - style 0: no exaggeration; this is informational, not theatrical
  // - use_speaker_boost: tighter speaker fidelity (small latency cost)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.85,
        style: 0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return {
      ok: false,
      status: res.status,
      body: null,
      contentType: 'application/json',
      error: errText || `ElevenLabs returned ${res.status}`,
    };
  }

  return {
    ok: true,
    status: 200,
    body: res.body,
    contentType: res.headers.get('content-type') || 'audio/mpeg',
  };
}
