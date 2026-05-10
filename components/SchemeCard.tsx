'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import type { Language, SchemeMatch } from '@/lib/schemes';
import { getApplicationMethodCopy } from '@/lib/application-method';

interface SchemeCardProps {
  match: SchemeMatch;
  language: Language;
  onTellMore: (match: SchemeMatch) => void;
  index?: number;
}

export function SchemeCard({
  match,
  language,
  onTellMore,
  index,
}: SchemeCardProps) {
  const [section, setSection] = useState<'docs' | 'steps' | 'details' | null>(
    null,
  );
  const { scheme } = match;

  const benefit =
    language === 'hi' ? scheme.benefit_summary_hi : scheme.benefit_summary_en;
  const reason = language === 'hi' ? match.reason_hi : match.reason_en;
  const docs =
    language === 'hi' ? scheme.documents_required_hi : scheme.documents_required;
  const benefitDetails =
    language === 'hi' ? scheme.benefit_details_hi : scheme.benefit_details_en;
  const eligibilityLines =
    language === 'hi'
      ? scheme.eligibility_lines_hi
      : scheme.eligibility_lines_en;
  const applicationSteps =
    language === 'hi'
      ? scheme.application_steps_hi
      : scheme.application_steps_en;
  const timeline = language === 'hi' ? scheme.timeline_hi : scheme.timeline_en;

  const isOnline = scheme.has_online_application !== false;

  const handleApplyClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!scheme.official_link) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    window.open(scheme.official_link, '_blank', 'noopener,noreferrer');
  };

  const numberStr =
    typeof index === 'number' ? String(index + 1).padStart(2, '0') : null;

  const toggleSection = (s: 'docs' | 'steps' | 'details') => {
    setSection((prev) => (prev === s ? null : s));
  };

  const hindiClass = language === 'hi' ? 'font-hindi' : '';
  const applicationMethod = getApplicationMethodCopy(scheme, language);
  const ApplicationMethodIcon =
    applicationMethod.mode === 'online'
      ? ExternalLinkIcon
      : applicationMethod.mode === 'helpline'
        ? PhoneIcon
        : PinIcon;
  const applicationToneClass = {
    online: 'text-forest-700 border-forest-300 bg-forest-50',
    office: 'text-saffron-700 border-saffron-300 bg-saffron-50',
    helpline: 'text-ashoka border-ashoka/30 bg-ashoka/[0.04]',
  }[applicationMethod.mode];

  return (
    <article className="relative flex flex-col bg-white rounded-3xl border border-saffron-100 shadow-card hover:shadow-card-hover transition-shadow p-5 xs:p-7 md:p-9 overflow-hidden">
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-saffron-500 via-saffron-400 to-forest-500"
      />

      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-jali-pattern opacity-[0.07] pointer-events-none"
      />

      <header className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          {numberStr && (
            <span className="font-serif text-[26px] leading-none italic text-saffron-600/70 font-medium">
              {numberStr}
              <span className="text-saffron-500/40 text-base">.</span>
            </span>
          )}
          <span className="inline-flex items-center text-[11px] uppercase tracking-[0.18em] text-ink/60 font-medium bg-cream-200/80 px-2.5 py-1 rounded-full">
            {scheme.ministry}
          </span>
        </div>
        {scheme.verified && (
          <span
            className="inline-flex items-center gap-1.5 self-start text-[11px] uppercase tracking-[0.18em] font-semibold text-ashoka border border-ashoka/30 bg-ashoka/[0.04] px-2.5 py-1 rounded-md"
            aria-label="Verified scheme"
          >
            <CheckIcon className="w-3 h-3" />
            Verified
          </span>
        )}
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 self-start text-[11px] uppercase tracking-[0.18em] font-semibold border px-2.5 py-1 rounded-md',
            applicationToneClass,
          )}
        >
          <ApplicationMethodIcon className="w-3 h-3" />
          <span className={hindiClass}>{applicationMethod.label}</span>
        </span>
      </header>

      <h3 className="font-hindi-serif text-[22px] xs:text-[26px] md:text-[34px] font-normal text-ink leading-[1.18] tracking-tight">
        {scheme.scheme_name_hi}
      </h3>
      <p className="mt-1.5 font-serif italic text-[14px] xs:text-[15px] text-ink/60 leading-snug">
        {scheme.scheme_name}
      </p>

      <p
        className={clsx(
          'mt-5 leading-relaxed text-ink-soft',
          language === 'hi' ? 'font-hindi text-base md:text-lg' : 'text-base',
        )}
      >
        {benefit}
      </p>

      {benefitDetails && benefitDetails.length > 0 && (
        <div className="mt-4 pl-1 space-y-2">
          {benefitDetails.map((line, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className="mt-2 w-1.5 h-1.5 rounded-full bg-saffron-500 shrink-0"
              />
              <p
                className={clsx(
                  'text-ink-soft/90 leading-relaxed text-[15px]',
                  hindiClass,
                )}
              >
                {line}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 relative pl-5">
        <span
          aria-hidden
          className="absolute left-0 top-1 bottom-1 w-1 bg-forest-500 rounded-full"
        />
        <p className="font-serif italic text-sm text-forest-700 mb-1.5">
          {language === 'hi' ? 'यह योजना आपके लिए है क्योंकि' : 'You qualify because'}
        </p>
        <p
          className={clsx(
            'text-ink-soft leading-relaxed',
            language === 'hi' ? 'font-hindi text-base' : 'text-[15px]',
          )}
        >
          {reason}
        </p>
      </div>

      {eligibilityLines && eligibilityLines.length > 0 && (
        <div className="mt-5">
          <p
            className={clsx(
              'text-[11px] uppercase tracking-[0.22em] text-ink/55 font-medium mb-2',
              hindiClass,
            )}
          >
            {language === 'hi' ? 'क्या-क्या ज़रूरी है' : 'Eligibility checks'}
          </p>
          <ul className="space-y-1.5">
            {eligibilityLines.map((line, i) => (
              <li
                key={i}
                className={clsx(
                  'flex items-start gap-2 text-ink-soft/90 text-[14px] leading-relaxed',
                  hindiClass,
                )}
              >
                <CheckIcon className="w-4 h-4 mt-0.5 text-forest-500 shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 divide-y divide-saffron-100/70 border-t border-saffron-100/70">
        {applicationSteps && applicationSteps.length > 0 && (
          <AccordionRow
            label={
              language === 'hi'
                ? 'कैसे अर्ज़ी दें'
                : 'How to apply — step by step'
            }
            badge={`${applicationSteps.length} ${language === 'hi' ? 'क़दम' : 'steps'}`}
            open={section === 'steps'}
            onToggle={() => toggleSection('steps')}
            language={language}
          >
            <ol className="mt-1 space-y-2.5 pl-0">
              {applicationSteps.map((step, i) => (
                <li
                  key={i}
                  className={clsx(
                    'flex items-start gap-3 text-ink/85 leading-relaxed',
                    language === 'hi' ? 'font-hindi text-sm' : 'text-sm',
                  )}
                >
                  <span className="font-serif italic text-saffron-700 shrink-0 w-6 leading-snug">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </AccordionRow>
        )}

        {docs && docs.length > 0 && (
          <AccordionRow
            label={
              language === 'hi'
                ? 'क्या-क्या काग़ज़ चाहिए'
                : 'Required documents'
            }
            badge={`${docs.length}`}
            open={section === 'docs'}
            onToggle={() => toggleSection('docs')}
            language={language}
          >
            <ul className="mt-1 space-y-1.5">
              {docs.map((d, i) => (
                <li
                  key={i}
                  className={clsx(
                    'flex items-start gap-2 text-ink/80',
                    language === 'hi' ? 'font-hindi text-sm' : 'text-sm',
                  )}
                >
                  <span
                    aria-hidden
                    className="mt-2 w-1 h-1 rounded-full bg-saffron-500 shrink-0"
                  />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </AccordionRow>
        )}
      </div>

      {(scheme.helpline || timeline) && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink/55">
          {scheme.helpline && (
            <span className="inline-flex items-center gap-1.5">
              <PhoneIcon className="w-3.5 h-3.5" />
              <span className="font-serif italic">
                {language === 'hi' ? 'हेल्पलाइन:' : 'Helpline:'}
              </span>
              <span className="text-ink/75 font-medium">{scheme.helpline}</span>
            </span>
          )}
          {timeline && (
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5" />
              <span className={clsx('text-ink/70', hindiClass)}>{timeline}</span>
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-6 space-y-2.5">
        <p
          className={clsx(
            'flex items-start gap-2 rounded-lg border border-cream-300 bg-cream-50 px-3 py-2 text-[12px] leading-relaxed text-ink/65',
            hindiClass,
          )}
        >
          <ApplicationMethodIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-current" />
          <span>{applicationMethod.description}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={() => onTellMore(match)}
          className={clsx(
            'flex-1 h-12 rounded-xl bg-saffron-500 text-white px-5 text-sm font-semibold transition-all',
            'hover:bg-saffron-600 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/40',
            'flex items-center justify-center gap-2',
          )}
        >
          <SpeakerIcon className="w-4 h-4" />
          <span className={hindiClass}>
            {language === 'hi' ? 'और बताइए' : 'Tell me more'}
          </span>
        </button>
        {isOnline ? (
          <a
            href={scheme.official_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleApplyClick}
            className={clsx(
              'flex-1 h-12 rounded-xl border-2 border-forest-500 text-forest-700 px-5 text-sm font-semibold transition-all',
              'hover:bg-forest-50 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/40',
              'flex items-center justify-center gap-2',
            )}
          >
            <ExternalLinkIcon className="w-4 h-4" />
            <span className={hindiClass}>
              {applicationMethod.cta}
            </span>
          </a>
        ) : (
          <Link
            href={`/schemes/${scheme.scheme_id}`}
            className={clsx(
              'flex-1 h-12 rounded-xl border-2 border-forest-500 text-forest-700 px-5 text-sm font-semibold transition-all',
              'hover:bg-forest-50 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/40',
              'flex items-center justify-center gap-2',
            )}
          >
            <PinIcon className="w-4 h-4" />
            <span className={hindiClass}>
              {applicationMethod.cta}
            </span>
          </Link>
        )}
        </div>
      </div>

      <div className="mt-3 text-center">
        <Link
          href={`/schemes/${scheme.scheme_id}`}
          className="text-xs text-ink/60 hover:text-saffron-700 font-serif italic inline-flex items-center gap-1 transition-colors"
        >
          {language === 'hi' ? 'और जानकारी पढ़िए' : 'View full details'}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

interface AccordionRowProps {
  label: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  language: Language;
}

function AccordionRow({
  label,
  badge,
  open,
  onToggle,
  children,
  language,
}: AccordionRowProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left py-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/30 rounded"
      >
        <span
          className={clsx(
            'font-semibold text-ink/80 text-[14px]',
            language === 'hi' ? 'font-hindi' : '',
          )}
        >
          {label}
          {badge && (
            <span className="ml-2 text-[11px] font-normal text-ink/45 font-serif italic">
              · {badge}
            </span>
          )}
        </span>
        <ChevronIcon
          className={clsx(
            'w-4 h-4 text-ink/55 transition-transform shrink-0',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className="pb-4 animate-fade-in-up">{children}</div>}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
