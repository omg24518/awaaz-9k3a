'use client';

import type { Language } from './schemes';

type RecognitionWindow = typeof window & {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
};

declare global {
  // Minimal typing for the Web Speech API since lib.dom may not include it everywhere.
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: {
        isFinal: boolean;
        [index: number]: { transcript: string };
      };
    };
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
  class SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onresult:
      | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown)
      | null;
    onerror:
      | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown)
      | null;
    onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }
}

export interface RecognizerCallbacks {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

export interface StartOptions extends RecognizerCallbacks {
  language: Language;
  silenceTimeoutMs?: number;
}

export interface RecognizerHandle {
  stop: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as RecognitionWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startRecognition(opts: StartOptions): RecognizerHandle | null {
  if (typeof window === 'undefined') return null;
  const w = window as RecognitionWindow;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    opts.onError?.('not_supported');
    return null;
  }

  const recog = new Ctor();
  recog.lang = opts.language === 'hi' ? 'hi-IN' : 'en-IN';
  recog.interimResults = true;
  recog.continuous = true;
  recog.maxAlternatives = 1;

  let finalText = '';
  let stopped = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  const silenceMs = opts.silenceTimeoutMs ?? 3500;

  const clearSilence = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearSilence();
    try {
      recog.stop();
    } catch {
      // ignore
    }
  };

  recog.onstart = () => {
    opts.onStart?.();
  };

  recog.onresult = (e: SpeechRecognitionEvent) => {
    let interim = '';
    let appendedFinal = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      const transcript = result[0]?.transcript || '';
      if (result.isFinal) {
        appendedFinal += transcript + ' ';
      } else {
        interim += transcript;
      }
    }
    if (appendedFinal) {
      finalText += appendedFinal;
    }
    const combined = (finalText + interim).trim();
    if (combined) opts.onInterim?.(combined);

    clearSilence();
    silenceTimer = setTimeout(() => {
      stop();
    }, silenceMs);
  };

  recog.onerror = (e: SpeechRecognitionErrorEvent) => {
    const raw = e.error || 'unknown';
    let mapped = raw;
    if (raw === 'not-allowed' || raw === 'service-not-allowed') {
      mapped = 'permission_denied';
    } else if (raw === 'network') {
      mapped = 'network_error';
    } else if (raw === 'no-speech') {
      mapped = 'no-speech';
    } else if (raw === 'aborted') {
      mapped = 'aborted';
    }
    opts.onError?.(mapped);
  };

  recog.onend = () => {
    clearSilence();
    const out = finalText.trim();
    if (out) opts.onFinal(out);
    opts.onEnd?.();
  };

  try {
    recog.start();
  } catch (err) {
    opts.onError?.(err instanceof Error ? err.message : 'start_failed');
    return null;
  }

  return { stop };
}
