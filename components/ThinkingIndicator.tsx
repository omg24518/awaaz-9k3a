'use client';

import clsx from 'clsx';
import type { Language } from '@/lib/schemes';

interface ThinkingIndicatorProps {
  language?: Language;
}

export function ThinkingIndicator({ language = 'hi' }: ThinkingIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-3 animate-fade-in-up">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-saffron-500 animate-pulse"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <p
        className={clsx(
          'text-base text-ink/65',
          language === 'hi' ? 'font-hindi' : 'font-serif italic',
        )}
      >
        {language === 'hi'
          ? 'आपके लिए योजनाएं ढूंढ रहे हैं…'
          : 'Finding schemes for you…'}
      </p>
    </div>
  );
}
