import OpenAI from 'openai';
import type {
  ExtractedProfile,
  Language,
  Scheme,
  SchemeMatch,
  QuerySummary,
} from './schemes';

const MODEL = 'gpt-4o';

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment.');
  }
  return new OpenAI({ apiKey });
}

const PROFILE_SYSTEM_PROMPT = `You are a profile extractor for an Indian government welfare scheme finder used by rural women.

Given a woman's spoken description of her life situation (in Hindi, English, or mixed), extract a STRUCTURED JSON PROFILE matching this exact schema:

{
  "age": <integer | null>,
  "gender": <"female" | "male" | "any" | null>,
  "marital_status": <"married" | "unmarried" | "widowed" | "divorced" | null>,
  "pregnancy_status": <"pregnant" | "lactating" | "none" | null>,
  "num_children": <integer | null>,
  "children_ages": <array of integers | null>,
  "state": <string in English | null>,
  "district": <string | null>,
  "monthly_income": <integer in INR | null>,
  "annual_income": <integer in INR | null>,
  "occupation": <string | null>,
  "caste_category": <"SC" | "ST" | "OBC" | "General" | "EWS" | null>,
  "rural_or_urban": <"rural" | "urban" | null>,
  "disability_status": <boolean | null>,
  "specific_need": <one-line English description of what they're seeking | null>
}

Rules:
1. Use null for any field NOT directly stated or implied.
2. Never invent data.
3. Income: if monthly stated, also derive annual (× 12). "लाख" / "lakh" = 100,000.
4. Detect implicit gender: e.g. "मैं गर्भवती हूं" / "I am pregnant" -> female.
5. State names in English (e.g. "Uttar Pradesh", not "उत्तर प्रदेश").
6. "specific_need" should capture WHY they're asking - pregnancy support, daughter's education, cooking gas, healthcare, etc.

Respond with ONLY the JSON object - no markdown fences, no commentary.`;

export async function extractProfile(
  userText: string,
  language: Language,
): Promise<ExtractedProfile> {
  const client = getClient();
  const langHint =
    language === 'hi' ? '(User spoke in Hindi.)' : '(User spoke in English.)';

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: PROFILE_SYSTEM_PROMPT },
      { role: 'user', content: `${langHint}\n\n${userText}` },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned no content in profile extraction.');
  }
  return safeParseJson<ExtractedProfile>(content, fallbackProfile());
}

function fallbackProfile(): ExtractedProfile {
  return {
    age: null,
    gender: null,
    marital_status: null,
    pregnancy_status: null,
    num_children: null,
    children_ages: null,
    state: null,
    district: null,
    monthly_income: null,
    annual_income: null,
    occupation: null,
    caste_category: null,
    rural_or_urban: null,
    disability_status: null,
    specific_need: null,
  };
}

const MATCH_SYSTEM_PROMPT = `You are an Indian government welfare scheme advisor for rural women.

Given a USER PROFILE and a list of AVAILABLE SCHEMES, return the top 3 to 5 schemes she clearly qualifies for, ranked by direct relevance to her stated situation.

Respond with ONLY valid JSON matching this exact schema (no markdown, no commentary):

{
  "matches": [
    {
      "scheme_id": "<the scheme_id from the list>",
      "qualifies": true,
      "reason_hi": "<1 line in Devanagari Hindi explaining WHY she qualifies, referring to her specific situation>",
      "reason_en": "<same reason, in English>",
      "priority": <integer 1 to 5; 1 is most relevant>
    }
  ],
  "summary_hi": "<1-2 sentence Hindi summary suitable for being read aloud>",
  "summary_en": "<1-2 sentence English summary>"
}

Rules:
- Only include schemes she clearly qualifies for. If uncertain, exclude.
- At most 5 matches. Prefer 3-4 high-confidence matches over 5 weak ones.
- Reasons must reference her actual profile (age, state, status, income) - never generic.
- Hindi MUST use Devanagari script.
- If NO scheme matches, return matches: [] and summary explaining what info is needed.

HINDI WRITING STYLE — VERY IMPORTANT:
The audience is rural women who may not have completed school. Write spoken, everyday Hindi — class 5 reading level. Short sentences. The kind of Hindi a friend would speak in a village, NOT formal government Hindi or news Hindi.

DO NOT use these formal/Sanskrit words. Use the everyday word instead:
- "पात्रता" → "किसको मिलेगा" / "कौन ले सकती है"
- "आवेदन" → "अर्ज़ी" / "नाम लिखवाना"
- "आवेदन करें" → "अर्ज़ी दीजिए"
- "लाभार्थी" → "जिसको मिलता है" / "वो महिला"
- "पंजीकरण" → "नाम लिखवाना"
- "निराश्रित" → "बेसहारा"
- "वरिष्ठ नागरिक" → "बुज़ुर्ग"
- "चिकित्सा" → "इलाज"
- "पात्र" → "हक़दार"
- "सत्यापन" → "जांच"
- "अनिवार्य" → "ज़रूरी"
- "उपलब्ध" → "मिलता है"
- "दस्तावेज़" → "काग़ज़"
- "योग्य" → drop, just say "आपके लिए"
- "स्तनपान कराने वाली" → "बच्चे को दूध पिलाने वाली"
- "योजना के तहत" → "इस योजना से"

KEEP these (they're widely understood):
- आधार, बैंक, मोबाइल, OTP, हेल्पलाइन, सब्सिडी, फॉर्म, पोर्टल (use sparingly), CSC, आंगनवाड़ी, ब्लॉक, पंचायत, BPL.

SPEAK to her, not at her. Use "आप" and "आपको". Avoid "उक्त", "उपरोक्त", "इत्यादि".`;

interface CompactScheme {
  scheme_id: string;
  scheme_name: string;
  scheme_name_hi: string;
  benefit_summary_en: string;
  benefit_summary_hi: string;
  eligibility: Scheme['eligibility'];
}

function compactSchemes(schemes: Scheme[]): CompactScheme[] {
  return schemes.map((s) => ({
    scheme_id: s.scheme_id,
    scheme_name: s.scheme_name,
    scheme_name_hi: s.scheme_name_hi,
    benefit_summary_en: s.benefit_summary_en,
    benefit_summary_hi: s.benefit_summary_hi,
    eligibility: s.eligibility,
  }));
}

interface RawMatchResponse {
  matches: Array<{
    scheme_id: string;
    qualifies: boolean;
    reason_hi: string;
    reason_en: string;
    priority: number;
  }>;
  summary_hi: string;
  summary_en: string;
}

export async function matchSchemes(
  profile: ExtractedProfile,
  schemes: Scheme[],
  _language: Language,
): Promise<{ matches: SchemeMatch[]; summary: QuerySummary }> {
  const client = getClient();
  const userMessage = `USER PROFILE:
${JSON.stringify(profile, null, 2)}

AVAILABLE SCHEMES (${schemes.length}):
${JSON.stringify(compactSchemes(schemes), null, 2)}

Return JSON.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      { role: 'system', content: MATCH_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned no content in scheme matching.');
  }
  const parsed = safeParseJson<RawMatchResponse>(content, {
    matches: [],
    summary_hi: 'क्षमा करें, अभी कोई योजना नहीं मिली।',
    summary_en: 'Sorry, no matching scheme found right now.',
  });

  const matchesWithScheme: SchemeMatch[] = parsed.matches
    .map((m) => {
      const full = schemes.find((s) => s.scheme_id === m.scheme_id);
      if (!full) return null;
      return { ...m, scheme: full };
    })
    .filter((m): m is SchemeMatch => m !== null)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);

  return {
    matches: matchesWithScheme,
    summary: { hi: parsed.summary_hi, en: parsed.summary_en },
  };
}

function safeParseJson<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T;
  } catch {
    const lastBrace = input.lastIndexOf('}');
    if (lastBrace > 0) {
      try {
        return JSON.parse(input.slice(0, lastBrace + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}
