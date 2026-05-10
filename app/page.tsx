'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { MicButton } from '@/components/MicButton';
import { LanguageToggle } from '@/components/LanguageToggle';
import { LiveTranscript } from '@/components/LiveTranscript';
import { TextFallback } from '@/components/TextFallback';
import {
  SampleScenarios,
  type SampleScenario,
} from '@/components/SampleScenarios';
import { ThinkingIndicator } from '@/components/ThinkingIndicator';
import { ResultsList } from '@/components/ResultsList';
import { StatusBadge } from '@/components/StatusBadge';
import {
  hydrateCached,
  loadSchemes,
  type Language,
  type QueryResponse,
  type SchemeMatch,
} from '@/lib/schemes';
import sampleData from '@/data/sample-scenarios.json';
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognizerHandle,
} from '@/lib/speech-recognition';
import {
  cancelBrowserSpeech,
  speakWithBrowser,
} from '@/lib/speech-synthesis';
import { cleanForTTS } from '@/lib/tts-text';
import { getApplicationMethodCopy } from '@/lib/application-method';

const scenarios = sampleData.scenarios as SampleScenario[];

type MicState = 'idle' | 'listening' | 'processing';

export default function Home() {
  const [language, setLanguage] = useState<Language>('hi');
  const [micState, setMicState] = useState<MicState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [statusMode, setStatusMode] = useState<'live' | 'cached'>('live');
  const [error, setError] = useState<string | null>(null);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognizerRef = useRef<RecognizerHandle | null>(null);
  const recognitionRunRef = useRef(0);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const transcriptSourceRef = useRef<'voice' | 'typed' | 'sample' | 'none'>('none');

  useEffect(() => {
    setVoiceUnsupported(!isSpeechRecognitionSupported());
    // Pick up ?lang=en in the URL so coming back from a detail page in English
    // mode keeps the homepage in English too.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('lang') === 'en') setLanguage('en');
    }
    return () => {
      recognitionRunRef.current += 1;
      recognizerRef.current?.stop();
      recognizerRef.current = null;
      ttsAbortRef.current?.abort();
      ttsAbortRef.current = null;
      cancelBrowserSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        try {
          URL.revokeObjectURL(audioRef.current.src);
        } catch {}
      }
    };
  }, []);

  // Prime an Audio element inside a user gesture so subsequent .play() calls
  // are not blocked by autoplay policy. Call this from EVERY user-initiated
  // interaction that may eventually trigger TTS playback.
  const primeAudio = useCallback(() => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;
    }
    // CRITICAL: stop any in-flight or queued audio first. Without this, calling
    // play() on an element whose src still holds the previous summary URL
    // restarts that summary — which is exactly the bug where clicking the mic
    // after a result replays the AI voice instead of starting a new recording.
    try {
      if (!audio.paused) audio.pause();
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
        audio.removeAttribute('src');
        audio.load();
      }
    } catch {}
    // Cancel any in-flight TTS fetch and any browser-TTS fallback so a slow
    // response or queued utterance doesn't surface mid-recording.
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    cancelBrowserSpeech();
    // Refresh user-gesture activation on the now-empty element. play() rejects
    // (no src) but the element stays "user-activated" for follow-up plays.
    audio.play().catch(() => {});
    return audio;
  }, []);

  const playSummaryAudio = useCallback(
    async (text: string) => {
      const cleaned = cleanForTTS(text, language);
      if (!cleaned) return;
      cancelBrowserSpeech();
      const currentAudio = audioRef.current;
      if (currentAudio) {
        try {
          currentAudio.pause();
          if (currentAudio.src) URL.revokeObjectURL(currentAudio.src);
          currentAudio.removeAttribute('src');
          currentAudio.load();
        } catch {}
      }
      // Cancel any in-flight TTS request so a fresh tell-me-more click wins.
      ttsAbortRef.current?.abort();
      const controller = new AbortController();
      ttsAbortRef.current = controller;
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleaned, language }),
          signal: controller.signal,
        });
        if (!res.ok) {
          // Surface provider errors in the console so demo debugging is easier
          // (for example: quota exhausted vs invalid API key).
          const errBody = await res.text().catch(() => '');
          console.warn('[tts]', res.status, errBody.slice(0, 200));
          throw new Error(`tts ${res.status}`);
        }
        const blob = await res.blob();
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        cancelBrowserSpeech();
        // Reuse the primed audio element so the play() inherits the user
        // gesture activation captured in handleSampleClick / handleMicClick / handleTextSubmit.
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        // Pause + clear current playback before swapping src — without this,
        // a second play() while a previous load is in flight throws AbortError
        // ("play() interrupted by new load request") and the click silently fails.
        try {
          audio.pause();
          if (audio.src) URL.revokeObjectURL(audio.src);
          audio.removeAttribute('src');
          audio.load();
        } catch {}
        audio.src = url;
        try {
          await audio.play();
        } catch {
          await speakWithBrowser(cleaned, language);
        }
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        await speakWithBrowser(cleaned, language);
      }
    },
    [language],
  );

  const submitQuery = useCallback(
    async (text: string, scenarioFallback?: SampleScenario) => {
      setError(null);
      setMicState('processing');
      setResult(null);
      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language }),
        });
        if (!res.ok) throw new Error(`query ${res.status}`);
        const data = (await res.json()) as QueryResponse;
        setResult(data);
        setStatusMode('live');
        const summaryText =
          language === 'hi' ? data.summary.hi : data.summary.en;
        if (summaryText) playSummaryAudio(summaryText);
      } catch (err) {
        console.error(err);
        if (scenarioFallback?.cached_response) {
          const hydrated = hydrateCached(
            scenarioFallback.cached_response,
            loadSchemes(),
          );
          setResult(hydrated);
          setStatusMode('cached');
          const summaryText =
            language === 'hi' ? hydrated.summary.hi : hydrated.summary.en;
          if (summaryText) playSummaryAudio(summaryText);
        } else {
          setError(
            language === 'hi'
              ? 'अभी कुछ गड़बड़ है। नीचे दिए उदाहरणों में से एक चुन लीजिए।'
              : 'Sorry, the AI is unreachable. Try a sample scenario.',
          );
        }
      } finally {
        setMicState('idle');
      }
    },
    [language, playSummaryAudio],
  );

  const handleTextSubmit = useCallback(() => {
    if (!transcript.trim()) return;
    primeAudio();
    transcriptSourceRef.current = 'typed';
    submitQuery(transcript.trim());
  }, [transcript, submitQuery, primeAudio]);

  const handleSampleClick = useCallback(
    (s: SampleScenario) => {
      primeAudio();
      const text = language === 'hi' ? s.text_hi : s.text_en;
      transcriptSourceRef.current = 'sample';
      setTranscript(text);
      submitQuery(text, s);
    },
    [language, submitQuery, primeAudio],
  );

  const handleMicClick = useCallback(() => {
    // Stop path — when actively listening (or a recognizer is alive even if
    // React state has drifted), tap means STOP. Critically, we must NOT
    // increment recognitionRunRef here. The recognizer's natural onEnd will
    // fire opts.onFinal with whatever speech was captured, and submitQuery
    // will run from there — exactly the same path as the silence-timeout
    // auto-stop. Bumping runId in this branch invalidated those callbacks
    // and silently dropped the user's transcript, so click-to-stop produced
    // no result while only auto-silence-stop worked. Also avoid setting
    // micState to 'idle' here so we don't flicker through idle on the way
    // to 'processing'.
    if (micState === 'listening' || recognizerRef.current) {
      recognizerRef.current?.stop();
      setInterimTranscript('');
      return;
    }
    primeAudio();
    if (!isSpeechRecognitionSupported()) {
      setError(
        language === 'hi'
          ? 'यह ब्राउज़र आवाज़ नहीं समझता। Chrome खोलिए, या नीचे लिखकर भेज दीजिए।'
          : 'Speech recognition is not supported in this browser. Use Chrome, or type below.',
      );
      return;
    }
    setError(null);
    // Only erase prior transcript if it came from voice (not typed by the user).
    if (transcriptSourceRef.current !== 'typed') {
      setTranscript('');
    }
    setInterimTranscript('');
    cancelBrowserSpeech();
    transcriptSourceRef.current = 'voice';
    setMicState('listening');

    const runId = recognitionRunRef.current + 1;
    recognitionRunRef.current = runId;
    const handle = startRecognition({
      language,
      onInterim: (text) => {
        if (recognitionRunRef.current !== runId) return;
        setInterimTranscript(text);
      },
      onFinal: (text) => {
        if (recognitionRunRef.current !== runId) return;
        setTranscript(text);
        setInterimTranscript('');
        recognizerRef.current = null;
        // submitQuery sets state to 'processing' on its first line — letting
        // it own the transition keeps a clean listening → processing → idle
        // arc without a brief idle flicker.
        submitQuery(text);
      },
      onError: (err) => {
        if (recognitionRunRef.current !== runId) return;
        recognizerRef.current = null;
        setMicState('idle');
        if (err === 'no-speech' || err === 'aborted') return;
        if (err === 'permission_denied') {
          setError(
            language === 'hi'
              ? 'माइक का इस्तेमाल बंद है। ब्राउज़र की सेटिंग में माइक चालू कर दीजिए।'
              : 'Microphone access denied. Please allow mic permission in browser settings.',
          );
          return;
        }
        if (err === 'network_error') {
          setError(
            language === 'hi'
              ? 'इंटरनेट सही से नहीं चल रहा। नीचे लिखकर भेज दीजिए।'
              : 'Network problem with voice service — try typing below instead.',
          );
          return;
        }
        setError(
          language === 'hi'
            ? 'आवाज़ ठीक से सुनाई नहीं दी। फिर से बोलिए या नीचे लिखकर भेज दीजिए।'
            : 'Could not capture your voice. Please try again or type below.',
        );
      },
      onEnd: () => {
        if (recognitionRunRef.current !== runId) return;
        recognizerRef.current = null;
        // If recognizer ended without firing onFinal (user clicked stop with no speech),
        // make sure mic state resets.
        setMicState((s) => (s === 'listening' ? 'idle' : s));
      },
    });
    if (handle) {
      recognizerRef.current = handle;
    } else {
      if (recognitionRunRef.current === runId) {
        setMicState('idle');
      }
    }
  }, [micState, language, submitQuery, primeAudio]);

  const handleTellMore = useCallback(
    (match: SchemeMatch) => {
      primeAudio();
      const s = match.scheme;
      const applicationMethod = getApplicationMethodCopy(s, language);
      const firstStep =
        language === 'hi'
          ? s.application_steps_hi?.[0] || s.how_to_apply_hi
          : s.application_steps_en?.[0] || s.how_to_apply;
      const text =
        language === 'hi'
          ? `${s.scheme_name_hi}। ${applicationMethod.label}: ${firstStep}। ${s.benefit_summary_hi}`
          : `${s.scheme_name}. ${applicationMethod.label}: ${firstStep}. ${s.benefit_summary_en}`;
      playSummaryAudio(text);
    },
    [language, playSummaryAudio, primeAudio],
  );

  const heroTitle =
    language === 'hi'
      ? 'अपनी बात बताइए, हम आपकी मदद करेंगे'
      : "Speak your situation, we'll find your schemes";
  const heroSubtitle =
    language === 'hi'
      ? 'सरकारी योजनाओं की मदद — आवाज़ से, हिंदी में'
      : 'A voice-first guide to Indian government welfare schemes';

  return (
    <main className="relative min-h-screen bg-cream overflow-x-hidden">
      <BackgroundDecor />

      <div className="sticky top-0 z-30 backdrop-blur-md bg-cream/75 border-b border-saffron-100/40">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Wordmark size="sm" />
          <LanguageToggle value={language} onChange={setLanguage} />
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto px-5 sm:px-6 pt-12 pb-24 flex flex-col items-center">
        <header
          className="flex flex-col items-center w-full animate-fade-in-up"
          style={{ animationDelay: '50ms' }}
        >
          <div
            className="text-center max-w-lg animate-fade-in-up"
            style={{ animationDelay: '180ms' }}
          >
            <h1
              className={
                language === 'hi'
                  ? 'font-hindi-serif text-[24px] xs:text-[28px] md:text-[36px] text-ink-soft leading-[1.25] font-normal tracking-[-0.01em]'
                  : 'font-serif text-[24px] xs:text-[28px] md:text-[36px] text-ink-soft leading-[1.2] font-medium tracking-tight'
              }
            >
              {heroTitle}
            </h1>
            <p
              className={clsxJoin(
                'mt-4 text-sm text-ink/60 tracking-wide',
                language === 'hi' ? 'font-hindi' : 'font-serif italic',
              )}
            >
              {heroSubtitle}
            </p>
          </div>
        </header>

        <div
          className="flex flex-col items-center gap-5 mt-14 animate-fade-in-up"
          style={{ animationDelay: '380ms' }}
        >
          <MicButton
            state={micState}
            onClick={handleMicClick}
            disabled={micState === 'processing'}
            language={language}
          />
          <div className="h-6" aria-hidden />
          {(micState === 'listening' || micState === 'processing') &&
            (interimTranscript || transcript) && (
              <LiveTranscript
                text={interimTranscript || transcript}
                isInterim={!!interimTranscript}
                language={language}
              />
            )}
          {voiceUnsupported && micState === 'idle' && !result && (
            <p
              className={clsxJoin(
                'text-xs text-ink/60 max-w-xs text-center',
                language === 'hi' ? 'font-hindi' : 'font-serif italic',
              )}
            >
              {language === 'hi'
                ? 'इस ब्राउज़र में बोलकर बात नहीं हो पाएगी — नीचे लिखकर भेज दीजिए या एक उदाहरण चुनिए।'
                : 'Voice unsupported in this browser — type below or try a sample.'}
            </p>
          )}
        </div>

        <div
          className="mt-12 w-full animate-fade-in-up"
          style={{ animationDelay: '460ms' }}
        >
          <TextFallback
            value={transcript}
            onChange={(v) => {
              transcriptSourceRef.current = 'typed';
              setTranscript(v);
              setInterimTranscript('');
            }}
            onSubmit={handleTextSubmit}
            disabled={micState === 'processing'}
            language={language}
          />
        </div>

        <div
          className="mt-12 w-full animate-fade-in-up"
          style={{ animationDelay: '540ms' }}
        >
          <SampleScenarios
            scenarios={scenarios}
            onSelect={handleSampleClick}
            disabled={micState === 'processing'}
            language={language}
          />
        </div>

        {micState === 'processing' && (
          <div className="mt-12 w-full flex justify-center">
            <ThinkingIndicator language={language} />
          </div>
        )}

        {error && !result && (
          <div className="mt-8 w-full max-w-xl text-center bg-saffron-100 border border-saffron-200 rounded-2xl p-4 text-saffron-900">
            <p className={language === 'hi' ? 'font-hindi' : ''}>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-16 w-full">
            <ResultsList
              matches={result.matches}
              summary={result.summary}
              language={language}
              onTellMore={handleTellMore}
            />
          </div>
        )}

        <footer className="mt-16 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-ink/40">
          <span className={language === 'hi' ? 'font-hindi' : 'font-serif italic normal-case tracking-[0.18em]'}>
            {language === 'hi' ? 'आवाज़' : 'Awaaz'}
          </span>
          <span aria-hidden className="w-1 h-1 rounded-full bg-saffron-500/50" />
          <span className="font-serif italic normal-case tracking-[0.1em]">
            innovate@ai 2026
          </span>
        </footer>
      </div>

      <StatusBadge mode={statusMode} />
    </main>
  );
}

function clsxJoin(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

function BackgroundDecor() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-saffron-100/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[35%] -left-40 w-[420px] h-[420px] rounded-full bg-forest-50/70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[15%] left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full bg-jali-pattern opacity-[0.05]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-paper-grain opacity-[0.035] mix-blend-multiply"
      />
    </>
  );
}
