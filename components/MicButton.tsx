'use client';

import clsx from 'clsx';

interface MicButtonProps {
  state: 'idle' | 'listening' | 'processing';
  onClick: () => void;
  disabled?: boolean;
}

export function MicButton({ state, onClick, disabled }: MicButtonProps) {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  const ariaLabel = isListening
    ? 'सुन रहे हैं — रुकने के लिए दबाइए • Listening — tap to stop'
    : isProcessing
      ? 'ढूंढ रहे हैं • Processing'
      : 'बोलने के लिए दबाइए • Tap to speak';

  const idleHint = isListening
    ? 'सुन रहे हैं'
    : isProcessing
      ? 'ढूंढ रहे हैं'
      : 'दबाइए और बोलिए';

  return (
    <div className="relative w-[180px] h-[180px] xs:w-[200px] xs:h-[200px] flex items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        className={clsx(
          'absolute inset-0 w-full h-full text-saffron-500/35',
          state === 'idle' && 'animate-spin-slow',
        )}
        aria-hidden
      >
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 6"
        />
      </svg>

      {isListening && (
        <>
          <span
            aria-hidden
            className="absolute inset-2 rounded-full bg-saffron-500/40 animate-pulse-ring"
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-full bg-saffron-500/30 animate-pulse-ring"
            style={{ animationDelay: '0.55s' }}
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-full bg-saffron-500/20 animate-pulse-ring"
            style={{ animationDelay: '1.1s' }}
          />
        </>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isProcessing}
        aria-label={ariaLabel}
        className={clsx(
          'relative z-10 w-[136px] h-[136px] xs:w-[150px] xs:h-[150px] rounded-full flex items-center justify-center transition-all duration-300',
          'shadow-mic',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-saffron-700/40 focus-visible:ring-offset-4 focus-visible:ring-offset-cream',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isListening
            ? 'bg-saffron-600 scale-105'
            : isProcessing
              ? 'bg-saffron-500/85'
              : 'bg-saffron-500 hover:bg-saffron-600 active:scale-95',
        )}
      >
        <span
          aria-hidden
          className="absolute inset-2 rounded-full border border-white/20"
        />
        {isProcessing ? (
          <Spinner />
        ) : (
          <MicIcon className="w-16 h-16 text-white drop-shadow-sm" />
        )}
      </button>

      <span
        aria-hidden
        className={clsx(
          'absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap',
          'text-xs tracking-[0.28em] uppercase font-medium font-hindi',
          'transition-colors duration-300',
          isListening
            ? 'text-saffron-700'
            : isProcessing
              ? 'text-ink/55'
              : 'text-ink/45',
        )}
      >
        {idleHint}
      </span>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="w-12 h-12 text-white animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
