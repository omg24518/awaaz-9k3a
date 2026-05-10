'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { Language, Scheme } from '@/lib/schemes';
import { buildSchemeGuideScript } from '@/lib/tts-text';
import { cancelBrowserSpeech, speakWithBrowser } from '@/lib/speech-synthesis';

type GuideState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface SchemeAudioGuideProps {
  scheme: Scheme;
  language?: Language;
}

// "Listen / सुनिए" guide button on the scheme detail page. Composes a
// friendly Hindi (or English) narration covering: what the scheme is, what
// you get, who qualifies, how to apply, helpline, and timeline. Streams it
// from /api/tts and falls back to browser TTS.
export function SchemeAudioGuide({
  scheme,
  language = 'hi',
}: SchemeAudioGuideProps) {
  const [state, setState] = useState<GuideState>('idle');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount: stop playback and cancel any in-flight fetch.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      cancelBrowserSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        try {
          URL.revokeObjectURL(audioRef.current.src);
        } catch {}
      }
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    cancelBrowserSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState('idle');
  }, []);

  const togglePauseResume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state === 'playing') {
      audio.pause();
      setState('paused');
    } else if (state === 'paused') {
      audio.play().catch(() => setState('idle'));
      setState('playing');
    }
  }, [state]);

  const start = useCallback(async () => {
    setError(null);
    // Prime the audio element inside this user-gesture click — guarantees
    // the later .play() isn't blocked by Chrome's autoplay policy.
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;
    }
    audio.play().catch(() => {});

    const script = buildSchemeGuideScript(scheme, language);
    if (!script) return;

    setState('loading');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script, language }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.warn('[scheme-guide tts]', res.status, errBody.slice(0, 200));
        throw new Error(`tts ${res.status}`);
      }
      const blob = await res.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      cancelBrowserSpeech();

      // Reuse + reset the primed audio element.
      try {
        audio.pause();
        if (audio.src) URL.revokeObjectURL(audio.src);
        audio.removeAttribute('src');
        audio.load();
      } catch {}
      audio.src = url;
      audio.onplay = () => setState('playing');
      audio.onpause = () => {
        // Only flip to "paused" if we didn't already finish/stop manually.
        if (audio.ended || audio.currentTime === 0) return;
        setState((s) => (s === 'playing' ? 'paused' : s));
      };
      audio.onended = () => setState('idle');
      audio.onerror = () => {
        setState('error');
        setError(language === 'hi' ? 'आवाज़ चलाने में दिक्कत हुई।' : 'Audio playback failed.');
      };

      try {
        await audio.play();
      } catch {
        // Browser TTS fallback — slower, less natural, but keeps the demo alive.
        await speakWithBrowser(script, language);
        setState('idle');
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      // Final fallback: browser TTS.
      const script2 = buildSchemeGuideScript(scheme, language);
      const ok = await speakWithBrowser(script2, language);
      if (ok) {
        setState('idle');
      } else {
        setState('error');
        setError(
          language === 'hi'
            ? 'अभी आवाज़ की सेवा काम नहीं कर रही। थोड़ी देर बाद फिर से कोशिश करिए।'
            : 'Voice service is unavailable right now. Please try again in a moment.',
        );
      }
    }
  }, [scheme, language]);

  const isHi = language === 'hi';
  const titleText = isHi ? 'पूरी जानकारी सुनिए' : 'Listen to the full guide';
  const subtitleText = isHi
    ? 'मैं आपको बताऊंगी — किसको मिलेगा, क्या मिलेगा, और कैसे अर्ज़ी देनी है।'
    : 'I will walk you through eligibility, benefits, and how to apply.';

  return (
    <div className="rounded-2xl bg-gradient-to-br from-saffron-50 to-cream border border-saffron-200 p-5 shadow-card">
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-saffron-500 flex items-center justify-center text-white shadow-sm">
          <SoundIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-saffron-700 font-semibold">
            {isHi ? 'AI मार्गदर्शक' : 'AI guide'}
          </p>
          <p className={clsx('mt-0.5 font-semibold text-ink leading-snug', isHi && 'font-hindi')}>
            {titleText}
          </p>
        </div>
      </div>

      <p
        className={clsx(
          'text-sm text-ink/70 leading-relaxed mb-4',
          isHi && 'font-hindi',
        )}
      >
        {subtitleText}
      </p>

      {state === 'idle' && (
        <button
          type="button"
          onClick={start}
          className={clsx(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-500 text-white px-5 h-12 text-sm font-semibold transition-all',
            'hover:bg-saffron-600 active:scale-[0.99]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/40',
          )}
        >
          <PlayIcon className="w-4 h-4" />
          <span className={isHi ? 'font-hindi' : ''}>
            {isHi ? 'सुनना शुरू करें' : 'Start listening'}
          </span>
        </button>
      )}

      {state === 'loading' && (
        <button
          type="button"
          disabled
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-500/85 text-white px-5 h-12 text-sm font-semibold opacity-90"
        >
          <Spinner className="w-4 h-4" />
          <span className={isHi ? 'font-hindi' : ''}>
            {isHi ? 'तैयार कर रहे हैं…' : 'Preparing…'}
          </span>
        </button>
      )}

      {(state === 'playing' || state === 'paused') && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePauseResume}
            className={clsx(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-saffron-500 text-white px-4 h-12 text-sm font-semibold transition-all',
              'hover:bg-saffron-600 active:scale-[0.99]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/40',
            )}
          >
            {state === 'playing' ? (
              <>
                <PauseIcon className="w-4 h-4" />
                <span className={isHi ? 'font-hindi' : ''}>
                  {isHi ? 'रोकिए' : 'Pause'}
                </span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span className={isHi ? 'font-hindi' : ''}>
                  {isHi ? 'फिर से चलाइए' : 'Resume'}
                </span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label={isHi ? 'बंद करिए' : 'Stop'}
            className={clsx(
              'shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 border-saffron-300 text-saffron-700 transition-all',
              'hover:bg-saffron-50 active:scale-[0.99]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/40',
            )}
          >
            <StopIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {state === 'error' && (
        <div>
          <button
            type="button"
            onClick={start}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-500 text-white px-5 h-12 text-sm font-semibold hover:bg-saffron-600"
          >
            <PlayIcon className="w-4 h-4" />
            <span className={isHi ? 'font-hindi' : ''}>
              {isHi ? 'फिर से कोशिश करिए' : 'Try again'}
            </span>
          </button>
          {error && (
            <p
              className={clsx(
                'mt-2 text-xs text-saffron-800',
                isHi && 'font-hindi',
              )}
            >
              {error}
            </p>
          )}
        </div>
      )}

      {state === 'playing' && (
        <p
          className={clsx(
            'mt-3 text-[11px] text-ink/55 flex items-center gap-1.5',
            isHi && 'font-hindi',
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-pulse" />
          {isHi ? 'अभी सुना रही हूं…' : 'Reading aloud…'}
        </p>
      )}
    </div>
  );
}

function SoundIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={clsx('animate-spin', className)}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
