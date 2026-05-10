# आवाज़ • Awaaz

**Voice-first government scheme navigator for rural Indian women.**

A woman speaks her situation in Hindi (or English). The AI extracts her profile,
matches her against 50 curated Indian government welfare schemes, and reads back —
in her language — which schemes she qualifies for, what documents she needs, and
where to apply.

Built for the innovate@ai school AI competition (Apeejay Saket).

---

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS, deployed on Vercel
- **AI / reasoning:** OpenAI GPT-4o (JSON mode) via the OpenAI SDK
- **Voice input:** Web Speech API (browser-native, supports `hi-IN`)
- **Voice output:** Google Cloud Text-to-Speech Neural2 (`hi-IN` / `en-IN`), with ElevenLabs and browser SpeechSynthesis fallback
- **Data:** Static JSON of 50 curated schemes (no vector DB; the full compact scheme set is passed in-context)

---

## Local setup

```bash
npm install
cp .env.local.example .env.local
# fill in OPENAI_API_KEY and Google TTS credentials
npm run check:data
npm run dev
```

Visit http://localhost:3000

The app **will boot without env vars** — it still shows cached sample-scenario
responses and can fall back to browser TTS. Live AI matching needs
`OPENAI_API_KEY` to be set.

`npm run check:data` validates the 50-scheme dataset, cached scenario links,
application-step coverage for the voice guide, and stale online-portal URL
patterns before a demo or handover.

---

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `OPENAI_API_KEY` | yes | Get from https://platform.openai.com/api-keys |
| `GOOGLE_TTS_API_KEY` | optional | Google Cloud TTS API key. Use this or service-account auth for the best Hindi voice. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | optional | Full Google service-account JSON as one line. Preferred when API-key auth is blocked. |
| `GOOGLE_APPLICATION_CREDENTIALS` | optional | Path to a local Google service-account JSON file. Never commit that file. |
| `GOOGLE_TTS_VOICE_HI` | optional | Defaults to `hi-IN-Neural2-A`. |
| `GOOGLE_TTS_VOICE_EN` | optional | Defaults to `en-IN-Neural2-A`. |
| `ELEVENLABS_API_KEY` | optional | Fallback TTS provider if Google is unavailable. |
| `ELEVENLABS_VOICE_ID_HINDI` | optional | ElevenLabs fallback voice override. |
| `ELEVENLABS_VOICE_ID_ENGLISH` | optional | ElevenLabs fallback voice override. |
| `NEXT_PUBLIC_APP_NAME` | optional | Shown in the wordmark. Defaults to "Awaaz". |

---

## Deploy to Vercel

```bash
# Option A — Vercel CLI
npm i -g vercel
vercel        # link the project
vercel --prod # deploy

# Option B — GitHub + Vercel dashboard
git init
git add .
git commit -m "Initial AWAAZ MVP"
gh repo create awaaz --public --source=. --push
# then go to vercel.com, import the repo, add env vars in Project Settings → Environment Variables
```

Set the same env vars in Vercel (Project → Settings → Environment Variables).
Both `/api/query` and `/api/tts` use the Node runtime by default.

---

## Demo flow

1. User taps the saffron mic button.
2. Speaks in Hindi: "मैं 26 साल की हूं, गर्भवती हूं, उत्तर प्रदेश में रहती हूं, पति की कमाई 8000 रुपये महीना है"
3. Live transcript appears under the mic.
4. After 3.5 sec of silence the recording auto-stops and the system processes:
   - **Call 1:** OpenAI extracts a structured profile (age, state, pregnancy, income, etc.)
   - **Call 2:** OpenAI matches the profile against all 50 schemes in `data/schemes.json`
   - Returns top 3–5 ranked schemes with eligibility reasoning in Hindi + English
5. Result cards render. AI speaks the Hindi summary aloud via Google Cloud TTS.
6. Each card shows the apply method: online form, office/CSC, or helpline.
7. Tap "और बताइए" to hear the first apply step aloud, or use the apply button:
   online schemes open the official form, while office/CSC/helpline schemes open the internal step-by-step guide.

### Demo-proofing on stage

- Three preset scenario buttons sit below the mic. Tap any one to run the full flow without using voice.
- Each scenario has a hand-curated cached response. If the live API is down, the cached response renders and a small **cached** badge appears bottom-right.
- A typed-text fallback is always visible below the mic. Voice unsupported in the current browser? The app detects it and shows a hint pointing to the textbox.

---

## Project structure

```
app/
  api/query/route.ts      # POST: text → profile + matched schemes (OpenAI × 2 calls)
  api/tts/route.ts        # POST: text → Google/ElevenLabs/browser-TTS fallback path
  layout.tsx              # Devanagari + Inter fonts, metadata
  page.tsx                # Main UI
components/               # All React components (mic, cards, fallbacks, etc.)
lib/
  openai.ts               # OpenAI SDK wrapper and prompt logic
  schemes.ts              # Loaders, types, hydrateCached helper
  google-tts.ts           # Google Cloud TTS wrapper
  elevenlabs.ts           # Optional ElevenLabs fallback wrapper
  speech-recognition.ts   # Web Speech API (STT)
  speech-synthesis.ts     # Browser TTS fallback
data/
  schemes.json            # 50 curated central + state government welfare schemes
  sample-scenarios.json   # 3 demo presets + cached fallback responses
```

---

## Credits

Project: AWAAZ • innovate@ai 2026 entry
