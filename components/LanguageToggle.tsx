'use client';

import clsx from 'clsx';
import type { Language } from '@/lib/schemes';

interface LanguageToggleProps {
  value: Language;
  onChange: (next: Language) => void;
}

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="भाषा चुनें • Choose language"
      className="inline-flex items-center bg-white border border-cream-300 rounded-full p-1 shadow-sm"
    >
      <ToggleOption
        active={value === 'hi'}
        onClick={() => onChange('hi')}
        aria-label="हिंदी"
      >
        <span className="font-hindi text-sm font-semibold">हिंदी</span>
      </ToggleOption>
      <ToggleOption
        active={value === 'en'}
        onClick={() => onChange('en')}
        aria-label="English"
      >
        <span className="text-sm font-semibold tracking-wide">English</span>
      </ToggleOption>
    </div>
  );
}

interface ToggleOptionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToggleOption({
  active,
  onClick,
  children,
  ...rest
}: ToggleOptionProps) {
  return (
    <button
      role="radio"
      aria-checked={active}
      type="button"
      onClick={onClick}
      className={clsx(
        'px-4 py-1.5 rounded-full transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/40',
        active
          ? 'bg-saffron-500 text-white shadow-md'
          : 'text-ink/60 hover:text-ink',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
