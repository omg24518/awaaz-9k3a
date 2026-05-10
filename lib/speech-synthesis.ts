'use client';

import type { Language } from './schemes';

async function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const synth = window.speechSynthesis;
  const initial = synth.getVoices();
  if (initial.length > 0) return initial;
  return new Promise((resolve) => {
    let settled = false;
    const settle = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      synth.removeEventListener('voiceschanged', onChange);
      clearTimeout(timer);
      resolve(voices);
    };
    const onChange = () => settle(synth.getVoices());
    synth.addEventListener('voiceschanged', onChange);
    const timer = setTimeout(() => settle(synth.getVoices()), 1500);
  });
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  language: Language,
): SpeechSynthesisVoice | null {
  const target = language === 'hi' ? 'hi-IN' : 'en-IN';
  const prefix = language === 'hi' ? 'hi' : 'en';
  return (
    voices.find((v) => v.lang === target) ||
    voices.find((v) => v.lang.startsWith(prefix)) ||
    voices[0] ||
    null
  );
}

export async function speakWithBrowser(
  text: string,
  language: Language,
): Promise<boolean> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = await getVoicesAsync();
    const match = pickVoice(voices, language);
    if (match) utterance.voice = match;

    return new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      utterance.onend = () => done(true);
      utterance.onerror = () => done(false);
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch {
        done(false);
      }
    });
  } catch {
    return false;
  }
}

export function cancelBrowserSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
