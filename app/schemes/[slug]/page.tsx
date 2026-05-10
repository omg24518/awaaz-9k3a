import Link from 'next/link';
import { notFound } from 'next/navigation';
import clsx from 'clsx';
import { Wordmark } from '@/components/Wordmark';
import { SchemeAudioGuide } from '@/components/SchemeAudioGuide';
import { loadSchemes, type Language, type Scheme } from '@/lib/schemes';
import { getApplicationMethodCopy } from '@/lib/application-method';

export function generateStaticParams() {
  return loadSchemes().map((s) => ({ slug: s.scheme_id }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const scheme = loadSchemes().find((s) => s.scheme_id === params.slug);
  if (!scheme) return { title: 'Scheme not found · Awaaz' };
  return {
    title: `${scheme.scheme_name_hi} • ${scheme.scheme_name} · Awaaz`,
    description: scheme.benefit_summary_en,
  };
}

export default function SchemeDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { lang?: string };
}) {
  const scheme = loadSchemes().find((s) => s.scheme_id === params.slug);
  if (!scheme) notFound();

  const language: Language = searchParams?.lang === 'en' ? 'en' : 'hi';
  const isHi = language === 'hi';
  const isOnline = scheme.has_online_application !== false;
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

  let sourceDomain = '';
  try {
    sourceDomain = new URL(scheme.official_link).hostname.replace(/^www\./, '');
  } catch {
    sourceDomain = scheme.official_link;
  }

  const homeHref = isHi ? '/' : '/?lang=en';
  const benefitSummary = isHi
    ? scheme.benefit_summary_hi
    : scheme.benefit_summary_en;
  const eligibilityLines = isHi
    ? scheme.eligibility_lines_hi
    : scheme.eligibility_lines_en;
  const benefitDetails = isHi
    ? scheme.benefit_details_hi
    : scheme.benefit_details_en;
  const applicationSteps = isHi
    ? scheme.application_steps_hi
    : scheme.application_steps_en;
  const documents = isHi
    ? scheme.documents_required_hi
    : scheme.documents_required;
  const timeline = isHi ? scheme.timeline_hi : scheme.timeline_en;

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-cream/80 border-b border-cream-300/70">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Wordmark size="sm" />
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-ink/65 hover:text-ink transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            {isHi ? (
              <>
                <span className="font-hindi">सभी योजनाएं</span>
                <span className="text-ink/30 hidden sm:inline">·</span>
                <span className="hidden sm:inline">All schemes</span>
              </>
            ) : (
              <span className="font-serif italic">All schemes</span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 sm:px-6 pt-10 pb-20">
        <nav
          aria-label="Breadcrumb"
          className="text-[11px] uppercase tracking-[0.18em] text-ink/40 mb-6 flex items-center gap-2"
        >
          <Link href={homeHref} className="hover:text-ink/70 transition-colors">
            Home
          </Link>
          <span aria-hidden>/</span>
          <span
            className={clsx(
              isHi && 'font-hindi normal-case tracking-normal',
            )}
          >
            {isHi ? 'योजना' : 'Scheme'}
          </span>
          <span aria-hidden>/</span>
          <span className="text-ink/60 truncate max-w-[180px] sm:max-w-none">
            {isHi ? scheme.scheme_name : scheme.scheme_name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
          <article className="lg:col-span-2 space-y-12">
            <header className="space-y-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold">
                <span>{scheme.ministry}</span>
                {scheme.category[0] && (
                  <>
                    <span className="mx-2 text-ink/30" aria-hidden>
                      ·
                    </span>
                    <span>{scheme.category[0].replace(/_/g, ' ')}</span>
                  </>
                )}
              </div>

              {isHi ? (
                <>
                  <h1 className="font-hindi-serif text-[28px] xs:text-[32px] sm:text-[40px] md:text-[48px] leading-[1.15] tracking-tight text-ink">
                    {scheme.scheme_name_hi}
                  </h1>
                  <p className="text-base sm:text-lg text-ink/60 leading-snug">
                    {scheme.scheme_name}
                  </p>
                </>
              ) : (
                <h1 className="font-serif text-[28px] xs:text-[32px] sm:text-[40px] md:text-[44px] leading-[1.15] tracking-tight text-ink font-medium">
                  {scheme.scheme_name}
                </h1>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {scheme.verified && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-ashoka border border-ashoka/30 bg-ashoka/[0.04] px-2.5 py-1 rounded-md">
                    <CheckIcon className="w-3 h-3" />
                    {isHi ? <>Verified · सही</> : <>Verified</>}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold border px-2.5 py-1 rounded-md ${applicationToneClass}`}
                >
                  <ApplicationMethodIcon className="w-3 h-3" />
                  <span
                    className={clsx(
                      isHi && 'font-hindi normal-case tracking-normal',
                    )}
                  >
                    {applicationMethod.label}
                  </span>
                </span>
              </div>

              <div className="pt-4 border-t border-cream-300/80 space-y-3">
                <p
                  className={clsx(
                    'text-base sm:text-lg text-ink-soft leading-relaxed',
                    isHi && 'font-hindi',
                  )}
                >
                  {benefitSummary}
                </p>
                {isHi && (
                  <p className="text-sm text-ink/65 leading-relaxed">
                    {scheme.benefit_summary_en}
                  </p>
                )}
              </div>
            </header>

            <Section
              titleHi="किसको मिलेगा"
              titleEn="Eligibility"
              language={language}
            >
              {eligibilityLines && eligibilityLines.length > 0 ? (
                <ul className="space-y-2.5">
                  {eligibilityLines.map((line, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 py-2 border-b border-cream-300/60 last:border-b-0"
                    >
                      <CheckIcon className="w-4 h-4 mt-1 text-forest-700 shrink-0" />
                      <p
                        className={clsx(
                          'text-base text-ink-soft leading-relaxed',
                          isHi && 'font-hindi',
                        )}
                      >
                        {line}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EligibilityFromMachine scheme={scheme} language={language} />
              )}
            </Section>

            {benefitDetails && benefitDetails.length > 0 && (
              <Section
                titleHi="क्या मिलेगा"
                titleEn="Benefits"
                language={language}
              >
                <ol className="space-y-4">
                  {benefitDetails.map((line, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-4 py-3 border-b border-cream-300/60 last:border-b-0"
                    >
                      <span className="font-serif text-saffron-700 font-semibold tabular-nums text-sm tracking-wide shrink-0 pt-0.5 min-w-[28px]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p
                        className={clsx(
                          'text-base text-ink-soft leading-relaxed',
                          isHi && 'font-hindi',
                        )}
                      >
                        {line}
                      </p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {applicationSteps && applicationSteps.length > 0 && (
              <Section
                titleHi="कैसे अर्ज़ी दें"
                titleEn="How to apply"
                language={language}
              >
                <ol className="space-y-5">
                  {applicationSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="font-serif text-saffron-700 font-semibold tabular-nums text-sm tracking-wide shrink-0 pt-0.5 min-w-[28px]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p
                          className={clsx(
                            'text-base text-ink-soft leading-relaxed',
                            isHi && 'font-hindi',
                          )}
                        >
                          {step}
                        </p>
                        {isHi && scheme.application_steps_en?.[i] && (
                          <p className="text-xs text-ink/55 leading-relaxed">
                            {scheme.application_steps_en[i]}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {documents && documents.length > 0 && (
              <Section
                titleHi="क्या-क्या काग़ज़ चाहिए"
                titleEn="Documents required"
                language={language}
              >
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documents.map((d, i) => (
                    <li
                      key={i}
                      className={clsx(
                        'text-sm bg-cream-200/70 text-ink-soft px-3 py-2 rounded-md border border-cream-300/60',
                        isHi && 'font-hindi',
                      )}
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <div className="pt-6 border-t border-cream-300/80 text-xs text-ink/55">
              <span>
                {isHi ? 'Source · आधिकारिक स्रोत: ' : 'Source: '}
              </span>
              <a
                href={scheme.official_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-saffron-700 hover:underline break-words"
              >
                {sourceDomain}
              </a>
            </div>
          </article>

          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              <SchemeAudioGuide scheme={scheme} language={language} />

              {isOnline ? (
                <div className="rounded-2xl bg-white border border-saffron-200 p-5 shadow-card">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-ink/55 font-semibold mb-2">
                    {isHi ? 'Apply online' : 'Apply online'}
                  </p>
                  <p
                    className={clsx(
                      'text-sm text-ink-soft mb-4',
                      isHi && 'font-hindi',
                    )}
                  >
                    {applicationMethod.description}
                  </p>
                  <a
                    href={scheme.official_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-500 text-white px-5 h-12 text-sm font-semibold hover:bg-saffron-600 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-700/40"
                  >
                    <span className={isHi ? 'font-hindi' : ''}>
                      {applicationMethod.cta}
                    </span>
                    <span className="text-saffron-100/80" aria-hidden>
                      ·
                    </span>
                    <span>Open Portal</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-[11px] text-ink/50 mt-3 leading-relaxed">
                    {isHi
                      ? 'Opens the official government portal in a new tab.'
                      : 'Opens the official government portal in a new tab.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white border-l-2 border-saffron-300 border-y border-r border-cream-300 p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-saffron-700 font-semibold mb-2">
                    {applicationMethod.shortLabel}
                  </p>
                  <p
                    className={clsx(
                      'text-sm text-ink-soft leading-relaxed mb-1.5',
                      isHi && 'font-hindi',
                    )}
                  >
                    {applicationMethod.description}
                  </p>
                  <p className="text-xs text-ink/65 leading-relaxed">
                    {isHi
                      ? 'Follow the steps on the left to apply at the right office.'
                      : 'Follow the steps on the left to apply at the right office.'}
                  </p>
                </div>
              )}

              {scheme.helpline && (
                <SidebarCard
                  label="Helpline"
                  labelHi="हेल्पलाइन"
                  language={language}
                >
                  <a
                    href={`tel:${(scheme.helpline.match(/[\d-]+/) || [''])[0].replace(/-/g, '')}`}
                    className="inline-flex items-center gap-2 text-base font-semibold text-ink hover:text-saffron-700 transition-colors"
                  >
                    <PhoneIcon className="w-4 h-4 text-saffron-700" />
                    <span>{scheme.helpline}</span>
                  </a>
                </SidebarCard>
              )}

              {timeline && (
                <SidebarCard
                  label="Timeline"
                  labelHi="कितना समय लगेगा"
                  language={language}
                >
                  <p
                    className={clsx(
                      'text-sm text-ink-soft leading-relaxed',
                      isHi && 'font-hindi',
                    )}
                  >
                    {timeline}
                  </p>
                  {isHi && scheme.timeline_en && (
                    <p className="text-xs text-ink/55 mt-1.5 leading-relaxed">
                      {scheme.timeline_en}
                    </p>
                  )}
                </SidebarCard>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Section({
  titleHi,
  titleEn,
  language,
  children,
}: {
  titleHi: string;
  titleEn: string;
  language: Language;
  children: React.ReactNode;
}) {
  const isHi = language === 'hi';
  return (
    <section>
      <header className="mb-4 pb-2 border-b border-cream-300/80">
        <div className="flex items-baseline gap-3">
          {isHi ? (
            <>
              <h2 className="font-hindi-serif text-[20px] sm:text-[22px] text-ink leading-tight font-normal">
                {titleHi}
              </h2>
              <span className="text-[11px] uppercase tracking-[0.22em] text-ink/45 font-semibold">
                {titleEn}
              </span>
            </>
          ) : (
            <h2 className="font-serif text-[22px] sm:text-[26px] text-ink leading-tight font-medium tracking-tight">
              {titleEn}
            </h2>
          )}
        </div>
      </header>
      <div>{children}</div>
    </section>
  );
}

function SidebarCard({
  label,
  labelHi,
  language,
  children,
}: {
  label: string;
  labelHi: string;
  language: Language;
  children: React.ReactNode;
}) {
  const isHi = language === 'hi';
  return (
    <div className="rounded-2xl bg-white border border-cream-300 p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink/55 font-semibold mb-2">
        {label}
        {isHi && (
          <>
            {' · '}
            <span className="font-hindi normal-case tracking-normal">
              {labelHi}
            </span>
          </>
        )}
      </p>
      <div>{children}</div>
    </div>
  );
}

function EligibilityFromMachine({
  scheme,
  language,
}: {
  scheme: Scheme;
  language: Language;
}) {
  const e = scheme.eligibility;
  const isHi = language === 'hi';
  const lines: string[] = [];
  if (isHi) {
    if (e.gender === 'female') lines.push('केवल महिलाओं के लिए');
    if (e.min_age != null) lines.push(`न्यूनतम उम्र: ${e.min_age} साल`);
    if (e.max_age != null) lines.push(`अधिकतम उम्र: ${e.max_age} साल`);
    if (e.pregnancy_status === 'pregnant')
      lines.push('गर्भवती महिलाओं के लिए');
    if (e.rural_only) lines.push('केवल ग्रामीण क्षेत्र');
    if (e.income_max_monthly != null)
      lines.push(
        `आय की सीमा: ₹${e.income_max_monthly.toLocaleString('en-IN')}/महीना`,
      );
  } else {
    if (e.gender === 'female') lines.push('Women only');
    if (e.min_age != null) lines.push(`Minimum age: ${e.min_age} years`);
    if (e.max_age != null) lines.push(`Maximum age: ${e.max_age} years`);
    if (e.pregnancy_status === 'pregnant') lines.push('For pregnant women');
    if (e.rural_only) lines.push('Rural areas only');
    if (e.income_max_monthly != null)
      lines.push(
        `Income limit: ₹${e.income_max_monthly.toLocaleString('en-IN')}/month`,
      );
  }
  return (
    <ul className="space-y-2.5">
      {lines.length > 0 ? (
        lines.map((l, i) => (
          <li
            key={i}
            className="flex items-start gap-3 py-2 border-b border-cream-300/60 last:border-b-0"
          >
            <CheckIcon className="w-4 h-4 mt-1 text-forest-700 shrink-0" />
            <p
              className={clsx(
                'text-base text-ink-soft leading-relaxed',
                isHi && 'font-hindi',
              )}
            >
              {l}
            </p>
          </li>
        ))
      ) : (
        <li className="text-sm text-ink/50">
          See full eligibility on the official portal.
        </li>
      )}
    </ul>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
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
