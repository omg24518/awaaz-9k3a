'use client';

import clsx from 'clsx';

interface StatusBadgeProps {
  mode: 'live' | 'cached';
}

export function StatusBadge({ mode }: StatusBadgeProps) {
  return (
    <div
      role="status"
      aria-label={mode === 'live' ? 'API live' : 'Running on cached fallback'}
      className={clsx(
        'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em]',
        'backdrop-blur bg-white/85 border shadow-sm',
        mode === 'live'
          ? 'border-forest-500/25 text-forest-700'
          : 'border-saffron-300 text-saffron-700',
      )}
    >
      <span
        aria-hidden
        className={clsx(
          'w-2 h-2 rounded-full',
          mode === 'live' ? 'bg-forest-500 animate-pulse' : 'bg-saffron-500',
        )}
      />
      {mode === 'live' ? 'live' : 'cached'}
    </div>
  );
}
