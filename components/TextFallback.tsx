'use client';

import clsx from 'clsx';
import type { Language } from '@/lib/schemes';

interface TextFallbackProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  language?: Language;
}

export function TextFallback({
  value,
  onChange,
  onSubmit,
  disabled,
  language = 'hi',
}: TextFallbackProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit();
    }
  };

  const isHi = language === 'hi';
  const labelText = isHi ? 'अपनी बात लिखें' : 'Type your situation';
  const placeholder = isHi
    ? 'अपनी बात यहाँ लिखें या नीचे एक उदाहरण चुनें'
    : 'Type your situation here, or pick a sample below';
  const submitAria = isHi ? 'भेजें' : 'Submit';

  return (
    <div className="w-full max-w-xl mx-auto">
      <label className="sr-only" htmlFor="fallback-input">
        {labelText}
      </label>
      <div
        className={clsx(
          'relative flex items-end gap-2 bg-white border border-saffron-100 rounded-2xl p-2 shadow-sm transition-all',
          'focus-within:border-saffron-500 focus-within:shadow-[0_0_0_3px_rgba(231,111,0,0.12)]',
        )}
      >
        <textarea
          id="fallback-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
          placeholder={placeholder}
          className={clsx(
            'flex-1 resize-none bg-transparent px-3 py-2 text-base xs:text-lg leading-relaxed',
            isHi ? 'font-hindi' : 'font-sans',
            'placeholder:text-ink/40 focus:outline-none disabled:opacity-50',
          )}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label={submitAria}
          className={clsx(
            'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all',
            'bg-saffron-500 text-white hover:bg-saffron-600 active:scale-95',
            'disabled:bg-saffron-500/40 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/40',
          )}
        >
          <ArrowIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
