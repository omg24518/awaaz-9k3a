'use client';

import clsx from 'clsx';
import type { CachedResponse } from '@/lib/schemes';

export interface SampleScenario {
  id: string;
  icon: string;
  label_hi: string;
  label_en: string;
  description_hi: string;
  description_en: string;
  text_hi: string;
  text_en: string;
  cached_response: CachedResponse | null;
}

interface SampleScenariosProps {
  scenarios: SampleScenario[];
  onSelect: (scenario: SampleScenario) => void;
  disabled?: boolean;
}

export function SampleScenarios({
  scenarios,
  onSelect,
  disabled,
}: SampleScenariosProps) {
  return (
    <div className="w-full">
      <div className="ornament-rule mb-6">
        <span className="text-xs uppercase tracking-[0.28em] text-ink/55 font-serif italic font-medium">
          एक उदाहरण चुनिए · try a sample
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(s)}
            className={clsx(
              'group relative flex flex-col items-start text-left',
              'bg-white/85 backdrop-blur',
              'border border-saffron-100 rounded-2xl px-5 py-5 transition-all',
              'hover:border-saffron-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-card',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/40',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'active:scale-[0.99]',
            )}
          >
            <span
              aria-hidden
              className="absolute top-3 right-4 font-serif italic text-[11px] tracking-[0.18em] text-saffron-600/55"
            >
              №{String(i + 1).padStart(2, '0')}
            </span>
            <span className="inline-flex items-center justify-center w-8 h-8 text-[26px] mb-2.5" aria-hidden>
              {s.icon}
            </span>
            <span className="font-hindi-serif font-normal text-ink text-base leading-snug">
              {s.label_hi}
            </span>
            <span className="mt-1.5 text-xs text-ink/60 leading-snug font-serif italic">
              {s.description_en}
            </span>
            <span
              aria-hidden
              className="mt-3 w-8 h-px bg-saffron-500/40 origin-left scale-x-100 group-hover:scale-x-150 transition-transform duration-300"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
