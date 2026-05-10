import clsx from 'clsx';

interface WordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Wordmark({ className, size = 'md' }: WordmarkProps) {
  if (size === 'sm') {
    // Compact header lockup: glyph + tiny English caption side-by-side
    return (
      <div
        className={clsx('flex items-center gap-2.5 select-none', className)}
        aria-label="Awaaz"
      >
        <span
          className="font-hindi-serif text-[28px] leading-none text-saffron-600 tracking-[-0.02em]"
          style={{ textShadow: '0 1px 0 rgba(231,111,0,0.06)' }}
        >
          आवाज़
        </span>
        <span
          className="font-serif italic tracking-[0.18em] text-ink/55 text-[10px] uppercase"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
          aria-hidden
        >
          awaaz
        </span>
      </div>
    );
  }

  const hindiSize =
    size === 'lg'
      ? 'text-[72px] xs:text-[88px] md:text-[112px]'
      : 'text-[56px] xs:text-[72px] md:text-[92px]';
  const englishSize = size === 'lg' ? 'text-xl md:text-2xl' : 'text-base';

  return (
    <div className={clsx('flex flex-col items-center select-none', className)}>
      <div className="relative">
        <Sun24 className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full w-12 h-12 text-saffron-500/70 animate-spin-slow" />
        <h1
          className={clsx(
            'font-hindi-serif font-normal tracking-[-0.02em] leading-[0.95]',
            'text-saffron-600',
            hindiSize,
          )}
          style={{
            textShadow: '0 1px 0 rgba(231,111,0,0.06)',
          }}
        >
          आवाज़
        </h1>
      </div>

      <div className="ornament-rule mt-4 w-44">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
          className="shrink-0"
        >
          <path
            d="M7 1l1.6 4.4L13 7l-4.4 1.6L7 13l-1.6-4.4L1 7l4.4-1.6L7 1z"
            fill="currentColor"
          />
        </svg>
      </div>

      <span
        className={clsx(
          'mt-3 font-serif italic tracking-[0.16em] text-ink/60 lowercase',
          englishSize,
        )}
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
      >
        a w a a z
      </span>
    </div>
  );
}

function Sun24({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <circle cx="50" cy="50" r="14" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const r1 = 22;
          const r2 = 34;
          const x1 = 50 + Math.cos(angle) * r1;
          const y1 = 50 + Math.sin(angle) * r1;
          const x2 = 50 + Math.cos(angle) * r2;
          const y2 = 50 + Math.sin(angle) * r2;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
    </svg>
  );
}
