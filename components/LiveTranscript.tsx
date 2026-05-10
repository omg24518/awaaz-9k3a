'use client';

import clsx from 'clsx';

interface LiveTranscriptProps {
  text: string;
  isInterim: boolean;
}

export function LiveTranscript({ text, isInterim }: LiveTranscriptProps) {
  if (!text.trim()) return null;
  return (
    <div className="w-full max-w-xl mx-auto px-4 animate-fade-in-up">
      <p
        className={clsx(
          'font-hindi text-lg xs:text-xl sm:text-2xl md:text-3xl text-ink leading-snug text-center',
          'before:content-[open-quote] after:content-[close-quote]',
          isInterim ? 'text-ink/55 italic' : 'text-ink',
        )}
      >
        {text}
      </p>
    </div>
  );
}
