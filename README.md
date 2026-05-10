# आवाज़ • Awaaz

Voice-first navigator for Indian government welfare schemes.

A user — typically a rural woman with low literacy — speaks her situation in Hindi or English. The app extracts a structured profile from the speech, matches her against 50 curated central and state schemes, and reads the qualifying ones back to her in her language: what she gets, who she should talk to, what papers she needs, and how long it takes.

Built for the innovate@ai school AI competition (Apeejay Saket).

---

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind, deployed on Vercel
- OpenAI GPT-4o for profile extraction and scheme matching (two calls, both in JSON mode)
- Google Cloud TTS Neural2 (`hi-IN-Neural2-A`) for the Hindi voice; ElevenLabs and the browser's `speechSynthesis` are fallbacks
- Web Speech API for `hi-IN` recognition
- 50 schemes as static JSON — small enough that the whole compact set fits in the matching prompt; no vector DB

---

## Run it

```bash
npm install
cp .env.local.example .env.local   # fill in OPENAI_API_KEY and Google TTS creds
npm run check:data
npm run dev
```

`check:data` validates the 50-scheme dataset, the cached scenario responses, application-step coverage for the audio guide, and known-stale portal URLs. Run it before any demo.

---

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `OPENAI_API_KEY` | yes | platform.openai.com/api-keys |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | one-of | Full service-account JSON as a single line. Preferred. |
| `GOOGLE_TTS_API_KEY` | one-of | API-key auth. Simpler but blocked on some Google projects. |
| `GOOGLE_APPLICATION_CREDENTIALS` | one-of | Path to a local service-account JSON file. |
| `ELEVENLABS_API_KEY` | optional | Fallback TTS if Google fails or hits quota. |
| `GOOGLE_TTS_VOICE_HI` / `_EN` | optional | Override default voices. |
| `ELEVENLABS_VOICE_ID_HINDI` / `_ENGLISH` | optional | Override default ElevenLabs voices. |
| `NEXT_PUBLIC_APP_NAME` | optional | Wordmark text. Defaults to `Awaaz`. |

Without any TTS provider configured the app degrades to the browser's built-in `speechSynthesis` — usable but not native-sounding.

---

## Deploy

```bash
npm i -g vercel
vercel link
vercel deploy --prod
```

Then add the env vars in the Vercel project settings (Production scope) and redeploy.

---

## Demo flow

1. Tap the mic. Speak: *"मैं 26 साल की हूं, गर्भवती हूं, उत्तर प्रदेश में रहती हूं, पति की कमाई 8000 रुपये महीना है"*
2. Live transcript renders under the mic. After 3.5s of silence the recording auto-stops.
3. The app makes two OpenAI calls — one to extract a profile (age, state, pregnancy, income, etc.) and one to rank the matching schemes — and returns the top 3–5 with eligibility reasoning in Hindi and English.
4. Result cards render. The Hindi summary plays aloud through Google Cloud TTS.
5. Each card shows how to apply (online portal, office/CSC, or helpline). The apply button on offline schemes routes to a step-by-step Hindi guide page.

If the network drops or the OpenAI key is missing, the three preset scenarios below the mic still work — each has a curated cached response and the bottom-right badge flips to **cached**. A typed-text fallback is always visible for browsers that don't support the Web Speech API.

---

## Project layout

```
app/
  api/query/route.ts
  api/tts/route.ts
  page.tsx
  schemes/[slug]/page.tsx
components/
lib/
  openai.ts            two-call profile extract + match
  schemes.ts           types and JSON loader
  google-tts.ts        primary Hindi voice
  elevenlabs.ts        fallback voice
  speech-recognition.ts
  speech-synthesis.ts
  tts-text.ts          conversational script for the audio guide
data/
  schemes.json         50 central + state schemes
  sample-scenarios.json
```
