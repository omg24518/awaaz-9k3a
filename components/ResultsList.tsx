'use client';

import clsx from 'clsx';
import type { Language, SchemeMatch, QuerySummary } from '@/lib/schemes';
import { SchemeCard } from './SchemeCard';

interface ResultsListProps {
  matches: SchemeMatch[];
  summary: QuerySummary;
  language: Language;
  onTellMore: (match: SchemeMatch) => void;
}

export function ResultsList({
  matches,
  summary,
  language,
  onTellMore,
}: ResultsListProps) {
  if (matches.length === 0) {
    return (
      <div className="w-full text-center py-12 animate-fade-in-up">
        <p
          className={clsx(
            'text-lg text-ink/70 max-w-md mx-auto leading-relaxed',
            language === 'hi' ? 'font-hindi' : 'font-serif italic',
          )}
        >
          {language === 'hi' ? summary.hi : summary.en}
        </p>
      </div>
    );
  }

  return (
    <section className="w-full space-y-6 animate-fade-in-up">
      <header className="text-center px-2">
        <p className="font-serif italic text-[13px] tracking-[0.18em] text-saffron-700 mb-3">
          {language === 'hi'
            ? `· आपके लिए ${matches.length} योजनाएं ·`
            : `· ${matches.length} schemes for you ·`}
        </p>
        <p
          className={clsx(
            'text-xl md:text-[22px] text-ink-soft leading-snug max-w-xl mx-auto',
            language === 'hi'
              ? 'font-hindi-serif'
              : 'font-serif italic font-normal',
          )}
        >
          {language === 'hi' ? summary.hi : summary.en}
        </p>
      </header>
      <div className="space-y-5">
        {matches.map((m, i) => (
          <div
            key={m.scheme_id}
            style={{ animationDelay: `${i * 90 + 100}ms` }}
            className="animate-fade-in-up"
          >
            <SchemeCard
              match={m}
              language={language}
              onTellMore={onTellMore}
              index={i}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
