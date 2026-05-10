import rawSchemes from '@/data/schemes.json';

export type Gender = 'female' | 'male' | 'any';

export type Language = 'hi' | 'en';

export interface SchemeEligibility {
  gender: Gender | null;
  min_age: number | null;
  max_age: number | null;
  marital_status: 'married' | 'unmarried' | 'widowed' | 'any' | null;
  pregnancy_status: 'pregnant' | 'lactating' | 'any' | null;
  num_children_min: number | null;
  num_children_max: number | null;
  income_max_annual: number | null;
  income_max_monthly: number | null;
  rural_only: boolean;
  states: 'all' | string[];
  conditions: string[];
  occupation_excluded: string[];
  occupation_included: string[];
  caste_categories: string[];
}

export interface Scheme {
  scheme_id: string;
  scheme_name: string;
  scheme_name_hi: string;
  ministry: string;
  category: string[];
  benefit_summary_en: string;
  benefit_summary_hi: string;

  // Optional detail fields used by scheme cards, guide pages, and audio narration.
  benefit_details_en?: string[];
  benefit_details_hi?: string[];
  eligibility_lines_en?: string[];
  eligibility_lines_hi?: string[];
  application_steps_en?: string[];
  application_steps_hi?: string[];
  helpline?: string;
  timeline_en?: string;
  timeline_hi?: string;

  // true opens official_link; false routes to the internal step-by-step guide.
  has_online_application?: boolean;

  eligibility: SchemeEligibility;
  documents_required: string[];
  documents_required_hi: string[];
  how_to_apply: string;
  how_to_apply_hi: string;
  official_link: string;
  verified: boolean;
}

export function loadSchemes(): Scheme[] {
  return rawSchemes as Scheme[];
}

export function getSchemeById(id: string): Scheme | undefined {
  return loadSchemes().find((s) => s.scheme_id === id);
}

export interface ExtractedProfile {
  age: number | null;
  gender: Gender | null;
  marital_status: 'married' | 'unmarried' | 'widowed' | 'divorced' | null;
  pregnancy_status: 'pregnant' | 'lactating' | 'none' | null;
  num_children: number | null;
  children_ages: number[] | null;
  state: string | null;
  district: string | null;
  monthly_income: number | null;
  annual_income: number | null;
  occupation: string | null;
  caste_category: 'SC' | 'ST' | 'OBC' | 'General' | 'EWS' | null;
  rural_or_urban: 'rural' | 'urban' | null;
  disability_status: boolean | null;
  specific_need: string | null;
}

export interface SchemeMatch {
  scheme_id: string;
  qualifies: boolean;
  reason_hi: string;
  reason_en: string;
  priority: number;
  scheme: Scheme;
}

export interface QuerySummary {
  hi: string;
  en: string;
}

export interface QueryResponse {
  profile: ExtractedProfile;
  matches: SchemeMatch[];
  summary: QuerySummary;
  cached: boolean;
}

export interface CachedMatch {
  scheme_id: string;
  reason_hi: string;
  reason_en: string;
  priority: number;
}

export interface CachedResponse {
  profile: ExtractedProfile;
  matches: CachedMatch[];
  summary: QuerySummary;
  cached: boolean;
}

export function hydrateCached(
  cached: CachedResponse,
  schemes: Scheme[],
): QueryResponse {
  const matches: SchemeMatch[] = cached.matches
    .map((m) => {
      const scheme = schemes.find((s) => s.scheme_id === m.scheme_id);
      if (!scheme) return null;
      return {
        scheme_id: m.scheme_id,
        qualifies: true,
        reason_hi: m.reason_hi,
        reason_en: m.reason_en,
        priority: m.priority,
        scheme,
      };
    })
    .filter((x): x is SchemeMatch => x !== null)
    .sort((a, b) => a.priority - b.priority);

  return {
    profile: cached.profile,
    matches,
    summary: cached.summary,
    cached: true,
  };
}
