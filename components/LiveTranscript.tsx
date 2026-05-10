'use client';

import clsx from 'clsx';
import type { Language } from '@/lib/schemes';

interface LiveTranscriptProps {
  text: string;
  isInterim: boolean;
  language?: Language;
}

export function LiveTranscript({
  text,
  isInterim,
  language = 'hi',
}: LiveTranscriptProps) {
  if (!text.trim()) return null;
  return (
    <div className="w-full max-w-xl mx-auto px-4 animate-fade-in-up">
      <p
        className={clsx(
          'text-lg xs:text-xl sm:text-2xl md:text-3xl text-ink leading-snug text-center',
          'before:content-[open-quote] after:content-[close-quote]',
          language === 'hi' ? 'font-hindi' : 'font-serif',
          isInterim ? 'text-ink/55 italic' : 'text-ink',
        )}
      >
        {text}
      </p>
    </div>
  );
}
