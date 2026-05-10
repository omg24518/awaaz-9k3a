'use client';

export function ThinkingIndicator() {
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
      <p className="font-hindi text-base text-ink/65">
        आपके लिए योजनाएं ढूंढ रहे हैं…
      </p>
    </div>
  );
}
