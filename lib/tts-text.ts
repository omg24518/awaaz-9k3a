import type { Language, Scheme } from './schemes';

// Matches a bare-domain URL token like "pmuy.gov.in" or "beneficiary.nha.gov.in"
// embedded in JSON content. Used by the audio-script builder to filter out
// application steps and eligibility lines whose meaning depends on the URL —
// after stripping, they read as orphaned "या पर" / "Open or" fragments.
const URL_TOKEN_RE = /\S+\.(?:gov\.in|nic\.in|in|com|org)\b/i;

// Sanitize text before sending to TTS. This keeps currency, phone numbers,
// URLs, and acronyms from being read aloud in a jarring way.
export function cleanForTTS(input: string, language: Language): string {
  if (!input) return '';
  let t = input;
  // Strip URLs and email-like fragments.
  t = t.replace(/https?:\/\/\S+/g, '');
  t = t.replace(/\S+\.(?:gov\.in|nic\.in|in|com|org)\b\S*/gi, '');
  // Strip phone numbers (digit groups joined by - or spaces, 8+ digits total).
  t = t.replace(/(?:\d[\s-]?){8,}\d/g, '');
  // Currency: ₹5,000 -> "पाँच हज़ार रुपये" (Hindi) / "5000 rupees" (English).
  // Spelling Hindi numbers out in Devanagari keeps fallback voices from
  // flipping to English mid-sentence.
  t = t.replace(/₹\s?([\d,]+)/g, (_m, raw) => {
    const n = parseInt(String(raw).replace(/,/g, ''), 10);
    if (language === 'hi' && Number.isFinite(n)) {
      return `${numberToDevanagariWords(n)} रुपये`;
    }
    return `${String(raw).replace(/,/g, '')} ${language === 'hi' ? 'रुपये' : 'rupees'}`;
  });
  // Bare-number-followed-by-Hindi-unit: "5000 रुपये" / "18 साल" / "30 दिन" /
  // "6 महीने" — also spell out so the voice stays in Hindi.
  if (language === 'hi') {
    t = t.replace(
      /(\d[\d,]*)\s*(रुपये|साल|महीने|महीना|दिन|बार|घंटे|घंटा|हफ्ते|हफ्ता)/g,
      (_m, raw, unit) => {
        const n = parseInt(String(raw).replace(/,/g, ''), 10);
        if (!Number.isFinite(n)) return `${raw} ${unit}`;
        return `${numberToDevanagariWords(n)} ${unit}`;
      },
    );
  }
  // Common acronyms → phonetic / expanded form (Hindi-friendly).
  if (language === 'hi') {
    const ac: [RegExp, string][] = [
      [/\bPM[-\s]?JAY\b/g, 'पीएम जय'],
      [/\bPMMVY\b/g, 'पीएम एम वी वाई'],
      [/\bPMAY[-\s]?[GU]\b/g, 'पीएम आवास योजना'],
      [/\bPMAY\b/g, 'पीएम आवास योजना'],
      [/\bMGNREGA\b/g, 'मनरेगा'],
      [/\bBPL\b/g, 'बीपीएल'],
      [/\bDBT\b/g, 'डीबीटी'],
      [/\bSECC\b/g, 'एसईसीसी'],
      [/\bAPL\b/g, 'एपीएल'],
      [/\bCSC\b/g, 'सीएससी'],
      [/\bASHA\b/g, 'आशा'],
      [/\bSC\b/g, 'एससी'],
      [/\bST\b/g, 'एसटी'],
      [/\bOBC\b/g, 'ओबीसी'],
      [/\bNSAP\b/g, 'एनएसएपी'],
      [/\bPDS\b/g, 'पीडीएस'],
      [/\bUDID\b/g, 'यूडीआईडी'],
      [/\bCMO\b/g, 'सीएमओ'],
      [/\bDLSA\b/g, 'डीएलएसए'],
      [/\bOSC\b/g, 'ओएससी'],
      [/\bMCP\b/g, 'एमसीपी'],
      [/\bRRB\b/g, 'आरआरबी'],
      [/\bNGO\b/g, 'एनजीओ'],
    ];
    for (const [re, sub] of ac) t = t.replace(re, sub);
  }
  // Collapse double-spaces and stray punctuation left by the strips.
  t = t.replace(/\s{2,}/g, ' ').replace(/[.,।]\s*[.,।]/g, '।').trim();
  // Cap length so a tell-me-more isn't a 30-second monologue.
  if (t.length > 280) t = t.slice(0, 277).replace(/\s+\S*$/, '') + '…';
  return t;
}

// Compose a SHORT, conversational explainer — like a friend leaning in to
// explain a scheme in plain spoken Hindi/English, not a webpage being read
// out loud. The detail page already shows benefits, eligibility, and steps
// as visible bullets; the audio guide's job is to summarize the gist with
// natural pacing.
//
// Format (~5-8 short sentences):
//   1. Warm opener with scheme name
//   2. Benefit summary (the one-paragraph summary from JSON — already
//      conversational; we do NOT also recite benefit_details bullets on top)
//   3. Eligibility as one "this is for you if..." sentence, paraphrased
//      from structured eligibility (not the verbatim page bullets)
//   4. At most 2 application steps, joined by natural connectors
//   5. Helpline as a reassurance line
//   6. Timeline if present
//   7. Encouraging closer
export function buildSchemeGuideScript(
  scheme: Scheme,
  language: Language,
): string {
  const isHi = language === 'hi';
  const isOnline = scheme.has_online_application !== false;

  const segments: string[] = isHi
    ? buildHindiScript(scheme, isOnline)
    : buildEnglishScript(scheme, isOnline);

  let script = segments
    .filter((s) => s && s.trim().length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Sanitize for TTS playback — same rules as cleanForTTS but with a
  // higher length cap and KEEP helpline phone numbers (the user wants to
  // hear them, e.g. "एक आठ शून्य शून्य …").
  script = script.replace(/https?:\/\/\S+/g, '');
  script = script.replace(/\S+\.(?:gov\.in|nic\.in|in|com|org)\b\S*/gi, '');
  // Currency with Indian-numbering multiplier MUST run before the bare ₹X
  // rule. Without this, "₹5 लाख" would match the bare rule first and become
  // "पाँच रुपये लाख" — wrong word order. We want "पाँच लाख रुपये".
  // Devanagari multiplier (Hindi text):
  script = script.replace(
    /₹\s?([\d,]+)\s*(लाख|करोड़|हज़ार)/g,
    (_m, raw, mult) => {
      const n = parseInt(String(raw).replace(/,/g, ''), 10);
      if (!Number.isFinite(n)) return _m;
      if (isHi) return `${numberToDevanagariWords(n)} ${mult} रुपये`;
      return `${n} ${mult} rupees`;
    },
  );
  // Latin multiplier (English text uses "lakh" / "crore" as Hinglish loanwords):
  script = script.replace(
    /₹\s?([\d,]+)\s*(lakh|crore|thousand)/gi,
    (_m, raw, mult) => {
      const n = parseInt(String(raw).replace(/,/g, ''), 10);
      if (!Number.isFinite(n)) return _m;
      return `${n} ${mult} rupees`;
    },
  );
  // Currency: bare ₹X (no multiplier) → Devanagari words for clean pronunciation.
  script = script.replace(/₹\s?([\d,]+)/g, (_m, raw) => {
    const n = parseInt(String(raw).replace(/,/g, ''), 10);
    if (isHi && Number.isFinite(n)) {
      return `${numberToDevanagariWords(n)} रुपये`;
    }
    return `${String(raw).replace(/,/g, '')} ${isHi ? 'रुपये' : 'rupees'}`;
  });
  // Number RANGE + unit ("30 से 45 दिन" → "तीस से पैंतालीस दिन") —
  // run before the single-number rule so we catch both ends of a range
  // instead of leaving the first number in digits.
  if (isHi) {
    script = script.replace(
      /(\d[\d,]*)\s*से\s*(\d[\d,]*)\s*(रुपये|साल|महीने|महीना|दिन|बार|घंटे|घंटा|हफ्ते|हफ्ता)/g,
      (_m, a, b, unit) => {
        const na = parseInt(String(a).replace(/,/g, ''), 10);
        const nb = parseInt(String(b).replace(/,/g, ''), 10);
        if (!Number.isFinite(na) || !Number.isFinite(nb)) return _m;
        return `${numberToDevanagariWords(na)} से ${numberToDevanagariWords(nb)} ${unit}`;
      },
    );
  }
  // Single number + Hindi unit → spelled out: "30 दिन" → "तीस दिन",
  // "5000 रुपये" → "पाँच हज़ार रुपये".
  if (isHi) {
    script = script.replace(
      /(\d[\d,]*)\s*(रुपये|साल|महीने|महीना|दिन|बार|घंटे|घंटा|हफ्ते|हफ्ता)/g,
      (_m, raw, unit) => {
        const n = parseInt(String(raw).replace(/,/g, ''), 10);
        if (!Number.isFinite(n)) return `${raw} ${unit}`;
        return `${numberToDevanagariWords(n)} ${unit}`;
      },
    );
  }
  if (isHi) {
    const ac: [RegExp, string][] = [
      [/\bPM[-\s]?JAY\b/g, 'पीएम जय'],
      [/\bPMMVY\b/g, 'पीएम एम वी वाई'],
      [/\bPMAY[-\s]?[GU]\b/g, 'पीएम आवास योजना'],
      [/\bPMAY\b/g, 'पीएम आवास योजना'],
      [/\bMGNREGA\b/g, 'मनरेगा'],
      [/\bBPL\b/g, 'बीपीएल'],
      [/\bDBT\b/g, 'डीबीटी'],
      [/\bSECC\b/g, 'एसईसीसी'],
      [/\bAPL\b/g, 'एपीएल'],
      [/\bCSC\b/g, 'सीएससी'],
      [/\bASHA\b/g, 'आशा'],
      [/\bNSAP\b/g, 'एनएसएपी'],
      [/\bPDS\b/g, 'पीडीएस'],
      [/\bUDID\b/g, 'यूडीआईडी'],
      [/\bCMO\b/g, 'सीएमओ'],
      [/\bDLSA\b/g, 'डीएलएसए'],
      [/\bOSC\b/g, 'ओएससी'],
      [/\bMCP\b/g, 'एमसीपी'],
    ];
    for (const [re, sub] of ac) script = script.replace(re, sub);
  }
  script = script.replace(/\s{2,}/g, ' ').replace(/[.,।]\s*[.,।]/g, '।').trim();
  if (script.length > 1450) script = script.slice(0, 1447) + '…';
  return script;
}

function buildHindiScript(scheme: Scheme, isOnline: boolean): string[] {
  const out: string[] = [];

  // Warm opener — the way an aunty or community worker would lean in.
  out.push(`नमस्ते। आइए, ${scheme.scheme_name_hi} के बारे में बताती हूँ।`);

  // Heart of the message — the JSON's own one-paragraph summary, which is
  // already conversational and front-loads the rupee figure. We do NOT
  // pile benefit_details_hi on top of this; the user already sees those
  // bullets on the page and listening to the same info twice in slightly
  // different wording is exhausting.
  if (scheme.benefit_summary_hi) {
    out.push(scheme.benefit_summary_hi);
  }

  // Eligibility — ONE short, natural sentence built from structured fields
  // ("ये योजना आपके लिए है, अगर आप गर्भवती हैं, आपकी उम्र उन्नीस साल या
  //  उससे ज़्यादा है") — not a recital of eligibility_lines_hi.
  const eligLine = describeEligibilityShortHi(scheme);
  if (eligLine) out.push(eligLine);

  // How to apply — at most 2 paraphrased steps. Filter out URL-bearing
  // steps because URL-stripping leaves orphan tokens like "या पर" or "खोलें"
  // that read as garbage. The detail page still shows the full step list
  // (with the URL hyperlinked), so the audio just covers the offline path.
  const steps = (scheme.application_steps_hi || [])
    .filter((s) => !URL_TOKEN_RE.test(s))
    .slice(0, 2);
  if (steps.length > 0) {
    out.push(
      isOnline
        ? 'अब, करना क्या है सुनिए।'
        : 'इसके लिए ऑनलाइन फॉर्म नहीं है। आपको ख़ुद जाना होगा।',
    );
    steps.forEach((s, i) => {
      // Skip the "फिर, " connector when the step itself starts with "या"
      // (an alternative-path step) — "फिर, या ..." reads awkwardly.
      const startsWithAlternative = /^\s*या\s/.test(s);
      out.push(i === 0 || startsWithAlternative ? s : `फिर, ${s}`);
    });
  } else if (scheme.how_to_apply_hi) {
    out.push(scheme.how_to_apply_hi);
  }

  if (scheme.helpline) {
    out.push(
      `अगर कुछ अटक जाए, तो ${formatHelplineForSpeechHi(scheme.helpline)} पर फ़ोन कर लीजिए।`,
    );
  }

  if (scheme.timeline_hi) {
    out.push(scheme.timeline_hi);
  }

  // Encouraging closer — like an aunty wrapping up.
  out.push('बस इतनी सी बात है। आप ज़रूर कर लेंगी।');

  return out;
}

function buildEnglishScript(scheme: Scheme, isOnline: boolean): string[] {
  const out: string[] = [];

  out.push(`Hello. Let me tell you about ${scheme.scheme_name}.`);

  if (scheme.benefit_summary_en) {
    out.push(scheme.benefit_summary_en);
  }

  const eligLine = describeEligibilityShortEn(scheme);
  if (eligLine) out.push(eligLine);

  const steps = (scheme.application_steps_en || [])
    .filter((s) => !URL_TOKEN_RE.test(s))
    .slice(0, 2);
  if (steps.length > 0) {
    out.push(
      isOnline
        ? 'Now, here is what to do.'
        : "There is no online form — you'll need to go in person.",
    );
    steps.forEach((s, i) => {
      const startsWithAlternative = /^\s*[Oo]r\s/.test(s);
      out.push(i === 0 || startsWithAlternative ? s : `Then, ${s}`);
    });
  } else if (scheme.how_to_apply) {
    out.push(scheme.how_to_apply);
  }

  if (scheme.helpline) {
    out.push(
      `If you get stuck, call ${formatHelplineForSpeechEn(scheme.helpline)}.`,
    );
  }

  if (scheme.timeline_en) {
    out.push(scheme.timeline_en);
  }

  out.push("That's all. You can do this.");

  return out;
}

// Build a single short Hindi "this is for you if..." sentence from the
// structured eligibility object. Reads more naturally than concatenating
// the verbatim eligibility_lines_hi entries (which were written for the
// page, not the ear). Returns null only when both the structured fields
// AND eligibility_lines_hi are empty.
function describeEligibilityShortHi(scheme: Scheme): string | null {
  const e = scheme.eligibility;
  const conds: string[] = [];

  if (e.pregnancy_status === 'pregnant') {
    conds.push('आप गर्भवती हैं');
  } else if (e.pregnancy_status === 'lactating') {
    conds.push('आप बच्चे को दूध पिला रही हैं');
  } else if (e.gender === 'female') {
    conds.push('आप महिला हैं');
  }

  if (e.min_age != null && e.max_age != null) {
    conds.push(`आपकी उम्र ${e.min_age} से ${e.max_age} साल के बीच है`);
  } else if (e.min_age != null) {
    conds.push(`आपकी उम्र ${e.min_age} साल या उससे ज़्यादा है`);
  } else if (e.max_age != null) {
    conds.push(`आपकी उम्र ${e.max_age} साल तक है`);
  }

  if (e.income_max_monthly != null) {
    conds.push(`महीने की कमाई ${e.income_max_monthly} रुपये से कम है`);
  } else if (e.income_max_annual != null) {
    conds.push(`साल की कमाई ${e.income_max_annual} रुपये से कम है`);
  }

  if (e.rural_only) {
    conds.push('आप गाँव में रहती हैं');
  }

  if (conds.length === 0) {
    // Structured fields empty — fall back to verbatim eligibility lines,
    // but skip ones with URLs (would read as garbled mid-Hindi after strip)
    // and stitch lines ending in dangling "या" to the next so we don't
    // leave a hanging connector in the audio.
    return fallbackEligibilityHi(scheme.eligibility_lines_hi);
  }

  // Cap at 3 conditions. Use "और" as the final connector ("X, Y, और Z")
  // so the sentence sounds natural when read aloud, not like a checklist.
  const top = conds.slice(0, 3);
  if (top.length === 1) {
    return `ये योजना आपके लिए है, अगर ${top[0]}।`;
  }
  if (top.length === 2) {
    return `ये योजना आपके लिए है, अगर ${top[0]}, और ${top[1]}।`;
  }
  return `ये योजना आपके लिए है, अगर ${top.slice(0, -1).join(', ')}, और ${top[top.length - 1]}।`;
}

function fallbackEligibilityHi(lines: string[] | undefined): string | null {
  if (!lines || lines.length === 0) return null;
  const clean = lines.filter((l) => l && !URL_TOKEN_RE.test(l));
  if (clean.length === 0) return null;
  let head = clean[0];
  // Line ending in dangling "या" is half a sentence — glue to next clean line.
  if (/,?\s*या\s*$/.test(head)) {
    if (clean.length >= 2) {
      head = `${head.replace(/,?\s*या\s*$/, '')}, या ${clean[1]}`;
    } else {
      head = head.replace(/,?\s*या\s*$/, '');
    }
  }
  return `शर्त बस इतनी — ${head}`;
}

// Strip parenthetical English notes ("(Health)", "(Women)") and replace
// slash separators with " या " so a string like "104 (Health) / 181 (Women)"
// reads as "104 या 181" — one natural phrase. Bare digits are left for
// Google Neural2 to pronounce in Hindi (e.g. "104" → "एक सौ चार").
function formatHelplineForSpeechHi(raw: string): string {
  let s = raw.replace(/\([^)]+\)/g, ' ');
  s = s.replace(/\s*\/\s*/g, ' या ');
  return s.replace(/\s{2,}/g, ' ').trim();
}

// Convert a non-negative integer (up to 9,99,99,999) to Devanagari Hindi
// number words. Used to keep fallback voices from reading amounts like ₹5000
// in English mid-Hindi sentence.
//
// Uses Indian numbering (lakh/crore), not Western (million/billion).
const HI_UNITS: string[] = [
  'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ',
  'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
  'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस',
  'तीस', 'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस',
  'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चौवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास',
  'पचास', 'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ',
  'साठ', 'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर',
  'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी',
  'अस्सी', 'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी',
  'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
];

export function numberToDevanagariWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  n = Math.floor(n);
  if (n === 0) return 'शून्य';
  const parts: string[] = [];
  // Crore (1,00,00,000)
  if (n >= 10000000) {
    const c = Math.floor(n / 10000000);
    parts.push(`${numberToDevanagariWords(c)} करोड़`);
    n = n % 10000000;
  }
  // Lakh (1,00,000)
  if (n >= 100000) {
    const l = Math.floor(n / 100000);
    parts.push(`${numberToDevanagariWords(l)} लाख`);
    n = n % 100000;
  }
  // Thousand
  if (n >= 1000) {
    const t = Math.floor(n / 1000);
    parts.push(`${numberToDevanagariWords(t)} हज़ार`);
    n = n % 1000;
  }
  // Hundred
  if (n >= 100) {
    const h = Math.floor(n / 100);
    parts.push(`${numberToDevanagariWords(h)} सौ`);
    n = n % 100;
  }
  if (n > 0) {
    parts.push(HI_UNITS[n]);
  }
  return parts.join(' ');
}

function describeEligibilityShortEn(scheme: Scheme): string | null {
  const e = scheme.eligibility;
  const conds: string[] = [];

  if (e.pregnancy_status === 'pregnant') {
    conds.push("you're pregnant");
  } else if (e.pregnancy_status === 'lactating') {
    conds.push("you're breastfeeding");
  } else if (e.gender === 'female') {
    conds.push("you're a woman");
  }

  if (e.min_age != null && e.max_age != null) {
    conds.push(`you're between ${e.min_age} and ${e.max_age}`);
  } else if (e.min_age != null) {
    conds.push(`you're ${e.min_age} or older`);
  } else if (e.max_age != null) {
    conds.push(`you're ${e.max_age} or younger`);
  }

  if (e.income_max_monthly != null) {
    conds.push(`your monthly income is under ${e.income_max_monthly} rupees`);
  } else if (e.income_max_annual != null) {
    conds.push(`your yearly income is under ${e.income_max_annual} rupees`);
  }

  if (e.rural_only) {
    conds.push('you live in a village');
  }

  if (conds.length === 0) {
    return fallbackEligibilityEn(scheme.eligibility_lines_en);
  }

  const top = conds.slice(0, 3);
  if (top.length === 1) {
    return `This is for you if ${top[0]}.`;
  }
  if (top.length === 2) {
    return `This is for you if ${top[0]}, and ${top[1]}.`;
  }
  return `This is for you if ${top.slice(0, -1).join(', ')}, and ${top[top.length - 1]}.`;
}

function fallbackEligibilityEn(lines: string[] | undefined): string | null {
  if (!lines || lines.length === 0) return null;
  const clean = lines.filter((l) => l && !URL_TOKEN_RE.test(l));
  if (clean.length === 0) return null;
  let head = clean[0];
  if (/,?\s+or\s*$/i.test(head)) {
    if (clean.length >= 2) {
      head = `${head.replace(/,?\s+or\s*$/i, '')}, or ${clean[1]}`;
    } else {
      head = head.replace(/,?\s+or\s*$/i, '');
    }
  }
  return `The condition: ${head}`;
}

function formatHelplineForSpeechEn(raw: string): string {
  let s = raw.replace(/\([^)]+\)/g, ' ');
  s = s.replace(/\s*\/\s*/g, ' or ');
  return s.replace(/\s{2,}/g, ' ').trim();
}
