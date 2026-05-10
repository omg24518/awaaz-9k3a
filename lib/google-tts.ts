import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Language } from './schemes';

const GOOGLE_TTS_BASE = 'https://texttospeech.googleapis.com/v1';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const TTS_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

// Defaults are Indian Neural2 voices — native Hindi (and Indian English)
// trained from the ground up on regional audio. No English-flip on numbers,
// proper prosody.
//
// Browse other Indian voices:
//   https://cloud.google.com/text-to-speech/docs/voices?language=hindi
const DEFAULT_HINDI_VOICE = 'hi-IN-Neural2-A';
const DEFAULT_ENGLISH_VOICE = 'en-IN-Neural2-A';

function pickVoiceName(language: Language): string {
  if (language === 'hi') {
    return process.env.GOOGLE_TTS_VOICE_HI || DEFAULT_HINDI_VOICE;
  }
  return process.env.GOOGLE_TTS_VOICE_EN || DEFAULT_ENGLISH_VOICE;
}

function pickLanguageCode(language: Language): string {
  return language === 'hi' ? 'hi-IN' : 'en-IN';
}

export function hasGoogleTtsCredentials(): boolean {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) return true;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) return true;
  if (process.env.GOOGLE_TTS_API_KEY?.trim()) return true;
  return fs.existsSync(path.join(process.cwd(), 'google-creds.json'));
}

export interface TtsResult {
  ok: boolean;
  status: number;
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
  error?: string;
}

// Two auth modes — pick whichever is configured:
//   1. Service account JSON (preferred; bypasses API-key project policies
//      that block server-side API-key auth on TTS). Set
//      GOOGLE_SERVICE_ACCOUNT_JSON to the full JSON downloaded from
//      Cloud Console → IAM & Admin → Service Accounts → Keys → JSON.
//   2. API key. Set GOOGLE_TTS_API_KEY. Simpler but blocked on some projects.
//
// If both are set, service account wins because its access tokens work even
// when API-key auth is blocked.
type AuthHeaders = Record<string, string>;
type AuthQuery = string; // key=... or empty
interface AuthResolution {
  headers: AuthHeaders;
  query: AuthQuery;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

// Locate service account credentials from any of three sources:
//   1. GOOGLE_SERVICE_ACCOUNT_JSON env var (full JSON pasted as one line)
//   2. GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON file)
//   3. ./google-creds.json sitting in the project root (zero-config dev path)
function readServiceAccountJson(): string | null {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline && inline.trim().length > 0) return inline;

  const explicit = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (explicit) {
    try {
      return fs.readFileSync(explicit, 'utf8');
    } catch (err) {
      console.warn(
        '[google-tts] GOOGLE_APPLICATION_CREDENTIALS path failed: %s',
        (err as Error).message,
      );
    }
  }

  const localPath = path.join(process.cwd(), 'google-creds.json');
  try {
    return fs.readFileSync(localPath, 'utf8');
  } catch {
    return null;
  }
}

async function getServiceAccountAccessToken(): Promise<string | null> {
  const json = readServiceAccountJson();
  if (!json) return null;

  // Reuse cached token if it has more than 60s of life left.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  let creds: { client_email: string; private_key: string; token_uri?: string };
  try {
    creds = JSON.parse(json);
  } catch {
    console.warn('[google-tts] service account JSON is not valid JSON');
    return null;
  }
  if (!creds.client_email || !creds.private_key) {
    console.warn(
      '[google-tts] service account JSON missing client_email or private_key',
    );
    return null;
  }

  // Build a JWT signed by the service account's RSA private key, then
  // exchange it for an access token at Google's token endpoint.
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: creds.client_email,
    scope: TTS_SCOPE,
    aud: creds.token_uri || GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const headerB64 = b64url(Buffer.from(JSON.stringify(header)));
  const claimB64 = b64url(Buffer.from(JSON.stringify(claim)));
  const signInput = `${headerB64}.${claimB64}`;

  let signatureB64: string;
  try {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signInput);
    signer.end();
    const signature = signer.sign(creds.private_key);
    signatureB64 = b64url(signature);
  } catch (err) {
    console.warn('[google-tts] JWT signing failed:', (err as Error).message);
    return null;
  }

  const jwt = `${signInput}.${signatureB64}`;
  const tokenRes = await fetch(creds.token_uri || GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });
  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => '');
    console.warn(
      '[google-tts] token exchange failed: %s %s',
      tokenRes.status,
      errText.slice(0, 200),
    );
    return null;
  }
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!tokenData.access_token) return null;

  cachedToken = {
    value: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function resolveAuth(): Promise<AuthResolution | null> {
  const accessToken = await getServiceAccountAccessToken();
  if (accessToken) {
    return { headers: { Authorization: `Bearer ${accessToken}` }, query: '' };
  }
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (apiKey) {
    return { headers: {}, query: `key=${encodeURIComponent(apiKey)}` };
  }
  return null;
}

export async function streamTtsGoogle(
  text: string,
  language: Language,
): Promise<TtsResult> {
  const auth = await resolveAuth();
  if (!auth) {
    return {
      ok: false,
      status: 503,
      body: null,
      contentType: 'application/json',
      error:
        'No Google credentials set (GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_TTS_API_KEY)',
    };
  }

  const voiceName = pickVoiceName(language);
  const languageCode = pickLanguageCode(language);

  // speakingRate 0.95 = a touch slower for clarity. 24kHz is Neural2's
  // native sample rate; setting it explicitly avoids an unnecessary
  // downsample on Google's side.
  const body = {
    input: { text },
    voice: { languageCode, name: voiceName },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95,
      pitch: 0,
      sampleRateHertz: 24000,
    },
  };

  const url = `${GOOGLE_TTS_BASE}/text:synthesize${auth.query ? `?${auth.query}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.headers },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return {
      ok: false,
      status: res.status,
      body: null,
      contentType: 'application/json',
      error: errText || `Google TTS returned ${res.status}`,
    };
  }

  let json: { audioContent?: string };
  try {
    json = (await res.json()) as { audioContent?: string };
  } catch {
    return {
      ok: false,
      status: 502,
      body: null,
      contentType: 'application/json',
      error: 'Google TTS returned non-JSON body',
    };
  }
  if (!json.audioContent) {
    return {
      ok: false,
      status: 502,
      body: null,
      contentType: 'application/json',
      error: 'Google TTS response missing audioContent',
    };
  }

  const bytes = base64ToBytes(json.audioContent);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

  return { ok: true, status: 200, body: stream, contentType: 'audio/mpeg' };
}

// base64url (no padding, +/ replaced with -_) for JWT segments.
function b64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
