import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

const schemes = readJson('data/schemes.json') ?? [];
const sampleFile = readJson('data/sample-scenarios.json') ?? {};
const scenarios = Array.isArray(sampleFile) ? sampleFile : sampleFile.scenarios ?? [];

if (!Array.isArray(schemes)) {
  errors.push('data/schemes.json must be a top-level array.');
}

const expectedSchemeCount = 50;
if (Array.isArray(schemes) && schemes.length !== expectedSchemeCount) {
  errors.push(`Expected ${expectedSchemeCount} schemes, found ${schemes.length}.`);
}

const requiredSchemeFields = [
  'scheme_id',
  'scheme_name',
  'scheme_name_hi',
  'ministry',
  'category',
  'benefit_summary_en',
  'benefit_summary_hi',
  'eligibility',
  'documents_required',
  'documents_required_hi',
  'how_to_apply',
  'how_to_apply_hi',
  'official_link',
  'verified',
];

const ids = new Set();
for (const [index, scheme] of schemes.entries()) {
  const id = scheme.scheme_id ?? `(missing at index ${index})`;

  if (ids.has(id)) errors.push(`Duplicate scheme_id: ${id}`);
  ids.add(id);

  for (const field of requiredSchemeFields) {
    if (!(field in scheme)) errors.push(`${id}: missing required field "${field}".`);
  }

  if (!Array.isArray(scheme.category) || scheme.category.length === 0) {
    errors.push(`${id}: category must be a non-empty array.`);
  }

  if (!scheme.application_steps_en?.length || !scheme.application_steps_hi?.length) {
    errors.push(`${id}: missing structured application steps for voice/apply flow.`);
  }

  if (!scheme.documents_required?.length || !scheme.documents_required_hi?.length) {
    errors.push(`${id}: missing required documents.`);
  }

  if (!isHttpUrl(scheme.official_link)) {
    errors.push(`${id}: official_link must be an http(s) URL.`);
  }

  if (scheme.has_online_application !== false) {
    const suspicious = [
      'ErrorPage',
      'PageNotFound',
      'citizen-assessment',
      'CitizenLogin',
      'citizen-Login',
      'auth/login',
      '2026/sgcx',
    ];
    for (const needle of suspicious) {
      if (scheme.official_link.includes(needle)) {
        errors.push(`${id}: online application link still contains stale path "${needle}".`);
      }
    }
  }

  for (const language of ['hi', 'en']) {
    const rawGuide = buildGuideText(scheme, language);
    const cappedGuide =
      rawGuide.length > 1450 ? `${rawGuide.slice(0, 1447)}...` : rawGuide;
    if (cappedGuide.length > 1500) {
      errors.push(`${id}: ${language} TTS guide is ${cappedGuide.length} chars.`);
    }
    if (rawGuide.length > 1450) {
      warnings.push(`${id}: ${language} guide is ${rawGuide.length} chars before cap.`);
    }
  }

  if (!scheme.verified) {
    warnings.push(`${id}: verified=false, so it will not show the verified badge.`);
  }
}

for (const scenario of scenarios) {
  for (const match of scenario.cached_response?.matches ?? []) {
    if (!ids.has(match.scheme_id)) {
      errors.push(`${scenario.id}: cached match references missing scheme "${match.scheme_id}".`);
    }
  }
}

const onlineCount = schemes.filter((s) => s.has_online_application !== false).length;
const offlineCount = schemes.length - onlineCount;

if (errors.length > 0) {
  console.error('\nData check failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  if (warnings.length > 0) printWarnings();
  process.exit(1);
}

console.log('Data check passed.');
console.log(`Schemes: ${schemes.length} (${onlineCount} online, ${offlineCount} guide/office/helpline)`);
console.log(`Sample scenarios: ${scenarios.length}`);
if (warnings.length > 0) printWarnings();

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildGuideText(scheme, language) {
  const isHi = language === 'hi';
  const name = isHi ? scheme.scheme_name_hi : scheme.scheme_name;
  const summary = isHi ? scheme.benefit_summary_hi : scheme.benefit_summary_en;
  const benefits = (isHi ? scheme.benefit_details_hi : scheme.benefit_details_en) ?? [];
  const eligibility = (isHi ? scheme.eligibility_lines_hi : scheme.eligibility_lines_en) ?? [];
  const steps = (isHi ? scheme.application_steps_hi : scheme.application_steps_en) ?? [];
  const timeline = isHi ? scheme.timeline_hi : scheme.timeline_en;
  const pieces = [
    name,
    summary,
    ...benefits.slice(0, 3),
    ...eligibility.slice(0, 3),
    ...steps.slice(0, 4),
    scheme.helpline,
    timeline,
  ];

  return pieces
    .filter(Boolean)
    .join(' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function printWarnings() {
  console.warn('\nWarnings:\n');
  for (const warning of warnings) console.warn(`- ${warning}`);
}
