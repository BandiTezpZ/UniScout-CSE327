const crypto = require('crypto');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const RECOMMENDATION_ENGINE_VERSION = 'uniscout-v2.2.0';
const MATCH_CATEGORIES = ['Reach', 'Target', 'Safety'];
const TIER_COMPETITIVENESS = { 1: 90, 2: 78, 3: 66, 4: 54 };
const KEY_COOLDOWN_MS = {
  rateLimit: 60_000,
  authentication: 15 * 60_000,
  server: 30_000,
  network: 15_000
};

const FIELD_FAMILIES = [
  ['computer science', 'data science', 'software engineering', 'information technology', 'computer engineering', 'computing'],
  ['engineering', 'electrical engineering', 'electrical and electronic engineering', 'mechanical engineering', 'civil engineering', 'computer engineering'],
  ['biology', 'biotechnology', 'bioinformatics', 'computational biology', 'biomedical informatics', 'health informatics', 'life sciences'],
  ['economics', 'finance', 'business administration', 'business and management'],
  ['physics', 'chemistry', 'mathematics', 'physical sciences'],
  ['arts', 'humanities', 'arts and humanities']
];

let keyCursor = 0;
const keyHealth = new Map();

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value) {
  return Math.round(Number(value) || 0);
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function expandJsonValue(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.flatMap(expandJsonValue);
  if (typeof value === 'object') return [value];

  const text = String(value).trim();
  if (!text) return [];
  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      return expandJsonValue(JSON.parse(text));
    } catch (error) {
      // Malformed legacy values are handled by delimiter parsing below.
    }
  }
  return text.split(/\n|,/).map(item => item.trim()).filter(Boolean);
}

function parseJsonField(value, fallback = []) {
  const values = expandJsonValue(value);
  return values.length ? values : fallback;
}

function normalizePublication(item) {
  if (typeof item === 'string') {
    const parts = item.split('|').map(part => part.trim());
    return {
      title: parts[0] || item,
      venue: parts[1] || '',
      year: parts[2] || '',
      authorship: parts[3] || '',
      topic: parts[4] || ''
    };
  }
  return {
    title: item?.title || '',
    venue: item?.venue || '',
    year: item?.year || '',
    authorship: item?.authorship || '',
    topic: item?.topic || ''
  };
}

function normalizeCountry(value) {
  const normalized = String(value || '').toLowerCase().replace(/[^a-z]/g, '');
  if (['usa', 'us', 'unitedstates', 'unitedstatesofamerica'].includes(normalized)) return 'usa';
  if (['uk', 'unitedkingdom', 'greatbritain'].includes(normalized)) return 'uk';
  return normalized;
}

function normalizeField(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldCompatibility(desiredField, programmeField) {
  const desired = normalizeField(desiredField);
  const programme = normalizeField(programmeField);
  if (!desired) return 0.75;
  if (!programme) return 0;
  if (desired === programme) return 1;
  if (desired.includes(programme) || programme.includes(desired)) return 0.92;

  const desiredFamily = FIELD_FAMILIES.find(family => family.some(item => desired.includes(item)));
  const programmeFamily = FIELD_FAMILIES.find(family => family.some(item => programme.includes(item)));
  if (desiredFamily && desiredFamily === programmeFamily) return 0.82;

  const desiredTokens = new Set(desired.split(' ').filter(token => token.length > 3));
  const programmeTokens = programme.split(' ').filter(token => token.length > 3);
  return programmeTokens.some(token => desiredTokens.has(token)) ? 0.72 : 0;
}

function inferEnglishTest(score) {
  const value = asNumber(score);
  if (value == null) return { type: null, score: null };
  if (value >= 0 && value <= 9) return { type: 'IELTS', score: value };
  if (value >= 40 && value <= 120) return { type: 'TOEFL', score: value };
  return { type: 'Unknown', score: value };
}

function inferAdmissionsTest(score) {
  const value = asNumber(score);
  if (value == null) return { type: null, score: null };
  if (value >= 250 && value <= 340) return { type: 'GRE', score: value };
  if (value > 800 && value <= 1600) return { type: 'SAT', score: value };
  return { type: 'Unknown', score: value };
}

function buildApplicantProfile(user, profile = {}) {
  const publications = parseJsonField(profile.publications, [])
    .map(normalizePublication)
    .filter(item => item.title || item.venue);
  const researchInterests = parseJsonField(profile.researchInterests, []).map(String);
  const preferredCountries = [...new Set(
    parseJsonField(profile.preferredCountries, []).map(normalizeCountry).filter(Boolean)
  )];
  const englishTest = inferEnglishTest(profile.ieltsToefl);
  const admissionsTest = inferAdmissionsTest(profile.gresatgmat);

  return {
    applicant: { name: user.fullName, email: user.email },
    degree: {
      level: profile.degreeLevel || '',
      field: profile.intendedMajor || '',
      institution: profile.institution || '',
      cgpa: asNumber(profile.cgpa),
      graduationYear: profile.graduationYear || ''
    },
    tests: {
      ieltsOrToefl: englishTest.score,
      englishType: englishTest.type,
      greSatOrGmat: admissionsTest.score,
      admissionsType: admissionsTest.type
    },
    research: {
      interests: researchInterests,
      publications,
      papers: asNumber(profile.researchPapers) || publications.length
    },
    experience: {
      projects: asNumber(profile.projects) || 0,
      internships: asNumber(profile.internships) || 0,
      extracurriculars: profile.extracurriculars || ''
    },
    skills: parseJsonField(profile.skills, []).map(String),
    preferences: {
      desiredDegree: profile.desiredDegree || '',
      desiredField: profile.intendedMajor || '',
      countries: preferredCountries,
      budgetUsdPerYear: asNumber(profile.budget),
      fundingPreference: profile.fundingPreference || profile.fundingNeed || ''
    }
  };
}

function isUsefulProfile(profile) {
  return Boolean(
    profile?.degree?.field || profile?.degree?.cgpa || profile?.skills?.length ||
    profile?.research?.publications?.length || profile?.preferences?.desiredDegree
  );
}

function buildCatalogueSnapshot(universities = []) {
  return universities
    .filter(item => item && item.id != null && item.university_name && item.program)
    .map((item, index) => ({
      id: String(item.id),
      name: String(item.university_name),
      country: String(item.country || ''),
      state: String(item.state || ''),
      program: String(item.program || ''),
      tier: asNumber(item.rank_tier),
      catalogueRank: asNumber(item.catalogue_rank || item.rank) || index + 1,
      annualCostUsd: asNumber(item.cost_of_attendance_usd),
      tuitionUsd: asNumber(item.tuition_usd),
      minimumCgpa: asNumber(item.min_cgpa),
      minimumIelts: asNumber(item.min_ielts),
      minimumGre: asNumber(item.min_gre),
      acceptsWithoutGre: String(item.accepts_without_gre || 'Varies'),
      researchLevel: asNumber(item.research_level),
      researchCategory: String(item.research_category || ''),
      intake: String(item.intake || ''),
      deadline: String(item.deadline || ''),
      dataNote: String(item.data_note || ''),
      imageUrl: String(item.imageUrl || item.image_url || ''),
      programUrl: String(item.program_url || item.programUrl || ''),
      lastVerifiedAt: String(item.last_verified_at || item.lastVerifiedAt || ''),
      sourceUrls: parseJsonField(item.source_urls || item.sources, []).map(String)
    }));
}

function buildRecommendationCacheKey(applicantProfile, universities = []) {
  const payload = {
    engine: RECOMMENDATION_ENGINE_VERSION,
    model: GEMINI_MODEL,
    applicantProfile,
    catalogue: buildCatalogueSnapshot(universities)
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function calculateApplicantStrength(profile) {
  const gpa = asNumber(profile?.degree?.cgpa);
  const academic = gpa == null ? 0 : clamp((gpa / 4) * 60, 0, 60);

  let english = 0;
  if (profile?.tests?.englishType === 'IELTS') {
    english = clamp(((profile.tests.ieltsOrToefl - 5) / 3.5) * 5, 0, 5);
  } else if (profile?.tests?.englishType === 'TOEFL') {
    english = clamp(((profile.tests.ieltsOrToefl - 70) / 40) * 5, 0, 5);
  }

  let standardized = 0;
  if (profile?.tests?.admissionsType === 'GRE') {
    standardized = clamp(((profile.tests.greSatOrGmat - 260) / 80) * 10, 0, 10);
  }

  const publicationEvidence = Math.max(
    profile?.research?.publications?.length || 0,
    asNumber(profile?.research?.papers) || 0
  );
  const research = clamp(
    publicationEvidence * 4 +
    Math.min(profile?.research?.interests?.length || 0, 3) * 0.75 +
    Math.min(asNumber(profile?.experience?.projects) || 0, 4) * 0.75,
    0,
    15
  );
  const experience = clamp(
    Math.min(asNumber(profile?.experience?.internships) || 0, 3) * 1.5 +
    Math.min(asNumber(profile?.experience?.projects) || 0, 4) * 0.6 +
    (profile?.experience?.extracurriculars ? 0.5 : 0),
    0,
    7
  );
  const skills = clamp(
    Math.min(profile?.skills?.length || 0, 6) * 0.5 +
    (profile?.degree?.field ? 1.5 : 0),
    0,
    3
  );

  const breakdown = {
    academic: round(academic),
    tests: round(english + standardized),
    research: round(research),
    experience: round(experience),
    skills: round(skills)
  };
  const score = clamp(Object.values(breakdown).reduce((sum, value) => sum + value, 0), 0, 100);
  const knownSignals = [
    gpa != null,
    Boolean(profile?.degree?.field),
    Boolean(profile?.tests?.englishType),
    Boolean(profile?.tests?.admissionsType),
    publicationEvidence > 0 || (profile?.research?.interests?.length || 0) > 0,
    Boolean(profile?.degree?.level),
    Boolean(profile?.preferences?.desiredDegree)
  ].filter(Boolean).length;

  return {
    score,
    breakdown,
    confidence: knownSignals >= 5 ? 'High' : knownSignals >= 3 ? 'Medium' : 'Low'
  };
}

function programmeCompetitiveness(item, maximumCatalogueRank) {
  const tier = clamp(asNumber(item.tier) || 4, 1, 4);
  const base = TIER_COMPETITIVENESS[tier];
  const denominator = Math.max((asNumber(maximumCatalogueRank) || 200) - 1, 1);
  const normalizedRank = clamp(((item.catalogueRank || maximumCatalogueRank) - 1) / denominator, 0, 1);
  const rankAdjustment = (1 - normalizedRank) * 4 - 2;
  const researchAdjustment = ((asNumber(item.researchLevel) || 3) - 4) * 1.5;
  const requirementAdjustment = ((asNumber(item.minimumCgpa) || 3.4) - 3.4) * 4;
  return clamp(round(base + rankAdjustment + researchAdjustment + requirementAdjustment), 0, 100);
}

function maximumAllowedTier(profile, applicantStrength) {
  const gpa = asNumber(profile?.degree?.cgpa);
  if ((gpa != null && gpa >= 3.7) || applicantStrength >= 76) return 3;
  return 4;
}

function termOverlap(profile, item) {
  const applicantText = [
    profile?.degree?.field,
    ...(profile?.research?.interests || []),
    ...(profile?.skills || [])
  ].map(normalizeField).join(' ');
  const programmeText = normalizeField(`${item.program} ${item.researchCategory}`);
  const tokens = [...new Set(applicantText.split(' ').filter(token => token.length > 4))];
  if (!tokens.length) return 0.5;
  const matches = tokens.filter(token => programmeText.includes(token)).length;
  return clamp(matches / Math.min(tokens.length, 5), 0, 1);
}

function researchEvidenceCount(profile) {
  return Math.max(
    profile?.research?.publications?.length || 0,
    asNumber(profile?.research?.papers) || 0
  );
}

function assessEligibility(profile, item, applicant) {
  const desiredField = profile?.preferences?.desiredField || profile?.degree?.field;
  const programmeDescription = `${item.program} ${item.researchCategory}`;
  const compatibility = Math.max(
    fieldCompatibility(desiredField, item.program),
    fieldCompatibility(desiredField, programmeDescription) * 0.95
  );
  const reasons = [];

  if (compatibility < 0.72) reasons.push('programme field does not match the requested field');
  const countries = profile?.preferences?.countries || [];
  if (countries.length && !countries.includes(normalizeCountry(item.country))) {
    reasons.push('country is outside the applicant preferences');
  }

  const gpa = asNumber(profile?.degree?.cgpa);
  const eliteProgramme = Number(item.tier) === 1;
  const gpaTolerance = eliteProgramme ? 0 : 0.15;
  const ieltsTolerance = eliteProgramme ? 0 : 0.25;
  const greTolerance = eliteProgramme ? 0 : 5;

  if (gpa != null && item.minimumCgpa != null && gpa < item.minimumCgpa - gpaTolerance) {
    reasons.push('CGPA is materially below the catalogue minimum');
  }
  if (profile?.tests?.englishType === 'IELTS' && item.minimumIelts != null && profile.tests.ieltsOrToefl < item.minimumIelts - ieltsTolerance) {
    reasons.push('IELTS is materially below the catalogue minimum');
  }
  if (profile?.tests?.admissionsType === 'GRE' && item.minimumGre != null && profile.tests.greSatOrGmat < item.minimumGre - greTolerance) {
    reasons.push('GRE is materially below the catalogue minimum');
  }

  if (eliteProgramme) {
    if (applicant?.confidence !== 'High') reasons.push('profile evidence is incomplete for a Tier 1 recommendation');
    if (gpa == null) reasons.push('CGPA is required for a Tier 1 recommendation');
    if (gpa != null && gpa < 3.85) reasons.push('CGPA is not exceptional enough for a Tier 1 recommendation');
    if ((applicant?.score || 0) < 88) reasons.push('overall profile strength is not exceptional enough for a Tier 1 recommendation');
    if (compatibility < 0.82) reasons.push('field alignment is not strong enough for a Tier 1 recommendation');
    const projects = asNumber(profile?.experience?.projects) || 0;
    const internships = asNumber(profile?.experience?.internships) || 0;
    if (researchEvidenceCount(profile) < 2 && !(projects >= 3 && internships >= 1)) {
      reasons.push('research evidence is not strong enough for a Tier 1 recommendation');
    }
  }

  return { eligible: reasons.length === 0, compatibility, reasons };
}

function calculateFitScore(profile, item, compatibility) {
  const gpa = asNumber(profile?.degree?.cgpa);
  const academicFit = gpa == null || item.minimumCgpa == null
    ? 8
    : clamp(((gpa - item.minimumCgpa + 0.3) / 0.9) * 15, 0, 15);
  const countryFit = !(profile?.preferences?.countries || []).length || profile.preferences.countries.includes(normalizeCountry(item.country)) ? 10 : 0;
  const researchFit = 5 + termOverlap(profile, item) * 10;
  const budget = asNumber(profile?.preferences?.budgetUsdPerYear);
  const cost = asNumber(item.annualCostUsd);
  const affordability = budget == null || cost == null || cost === 0
    ? 8
    : cost <= budget ? 15 : clamp((budget / cost) * 15, 0, 15);

  let testFit = 3;
  if (profile?.tests?.englishType === 'IELTS' && item.minimumIelts != null) {
    testFit += clamp((profile.tests.ieltsOrToefl - item.minimumIelts + 0.5) * 2, 0, 2);
  } else {
    testFit += 1;
  }
  if (profile?.tests?.admissionsType === 'GRE' && item.minimumGre != null) {
    testFit += clamp((profile.tests.greSatOrGmat - item.minimumGre + 10) / 10, 0, 2);
  } else {
    testFit += 1;
  }

  return clamp(round(compatibility * 40 + academicFit + countryFit + researchFit + affordability + testFit), 0, 100);
}

function catalogueDataConfidence(item) {
  if (item.programUrl && item.lastVerifiedAt && item.sourceUrls.length) return 'High';
  if (item.programUrl || item.sourceUrls.length) return 'Medium';
  return 'Low';
}

function scoreCatalogueCandidates(applicantProfile, universities = []) {
  const catalogue = buildCatalogueSnapshot(universities);
  const applicant = calculateApplicantStrength(applicantProfile);
  const tierLimit = maximumAllowedTier(applicantProfile, applicant.score);
  const maximumCatalogueRank = Math.max(...catalogue.map(item => item.catalogueRank || 0), 1);

  const scored = catalogue.map(item => {
    const eligibility = assessEligibility(applicantProfile, item, applicant);
    const competitiveness = programmeCompetitiveness(item, maximumCatalogueRank);
    const fitScore = calculateFitScore(applicantProfile, item, eligibility.compatibility);
    return {
      ...item,
      eligibility,
      competitiveness,
      fitScore,
      gap: competitiveness - applicant.score,
      dataConfidence: catalogueDataConfidence(item),
      allowedByQualityFloor: (item.tier || 4) <= tierLimit
    };
  });

  const candidates = scored.filter(item => item.eligibility.eligible && item.allowedByQualityFloor && item.fitScore >= 55);
  return {
    applicant,
    tierLimit,
    catalogueSize: catalogue.length,
    candidates,
    rejected: scored.filter(item => !candidates.includes(item))
  };
}

function candidateUniversityKey(item) {
  return normalizeField(item.name);
}

function pickBest(candidates, usedIds, usedUniversities, scorer) {
  return candidates
    .filter(item => !usedIds.has(item.id) && !usedUniversities.has(candidateUniversityKey(item)))
    .map(item => ({ item, score: scorer(item) }))
    .sort((a, b) => b.score - a.score || a.item.catalogueRank - b.item.catalogueRank)[0]?.item || null;
}

function requirementText(value, suffix = '') {
  return value == null || value === 0 ? 'Not listed in local catalogue' : `${value}${suffix}`;
}

function deterministicExplanation(category, candidate, applicantStrength) {
  const fieldText = candidate.program || 'programme';
  if (category === 'Reach') {
    return `${fieldText} is the most competitive of your three realistic matches: its programme competitiveness is ${candidate.competitiveness}, compared with your profile-strength index of ${applicantStrength}.`;
  }
  if (category === 'Target') {
    return `${fieldText} is the closest balanced match between your profile-strength index (${applicantStrength}), programme competitiveness (${candidate.competitiveness}), and overall fit (${candidate.fitScore}).`;
  }
  return `${fieldText} is the least competitive of your three qualified matches while remaining above UniScout's quality floor; its overall fit score is ${candidate.fitScore}.`;
}

function buildImportantNotes(profile, candidate) {
  const notes = [];
  const budget = asNumber(profile?.preferences?.budgetUsdPerYear);
  if (budget != null && candidate.annualCostUsd != null && candidate.annualCostUsd > budget) {
    notes.push(`Estimated annual cost exceeds your stated budget by about $${Math.round(candidate.annualCostUsd - budget).toLocaleString()}.`);
  }
  if (profile?.tests?.englishType !== 'IELTS' && candidate.minimumIelts) {
    notes.push('The catalogue lists an IELTS value, but your English-test type is missing or different; verify equivalency.');
  }
  if (profile?.tests?.admissionsType !== 'GRE' && candidate.minimumGre) {
    notes.push('The catalogue lists a GRE value, but your standardized-test type is missing or different; verify the current policy.');
  }
  if (candidate.dataNote) notes.push(candidate.dataNote);
  if (candidate.dataConfidence === 'Low') {
    notes.push('This record has no linked official programme source, so treat it as a planning estimate.');
  }
  return [...new Set(notes)].slice(0, 3);
}

function buildRecommendation(profile, applicant, candidate, category) {
  return {
    id: `ai-v2-${candidate.id}`,
    catalogueId: candidate.id,
    source: 'ai_hybrid_v2',
    engineVersion: RECOMMENDATION_ENGINE_VERSION,
    matchCategory: category,
    universityName: candidate.name,
    university_name: candidate.name,
    country: candidate.country,
    stateOrRegion: candidate.state,
    state: candidate.state,
    programName: candidate.program,
    program: candidate.program,
    programUrl: candidate.programUrl,
    imageUrl: candidate.imageUrl,
    whySuggested: deterministicExplanation(category, candidate, applicant.score),
    relevantResearchAreas: [candidate.researchCategory].filter(Boolean),
    requirements: {
      cgpa: requirementText(candidate.minimumCgpa),
      gre: requirementText(candidate.minimumGre),
      english: requirementText(candidate.minimumIelts, ' IELTS')
    },
    funding: {
      status: profile?.preferences?.fundingPreference || 'Not specified by applicant',
      details: 'Funding availability is not verified in the current catalogue; confirm assistantships and scholarships with the programme.'
    },
    estimatedCost: candidate.annualCostUsd,
    intake: candidate.intake,
    deadline: candidate.deadline,
    importantNotes: buildImportantNotes(profile, candidate),
    sources: candidate.sourceUrls.map((url, index) => ({ title: index ? 'Programme source' : 'Official programme source', url })),
    scores: {
      applicantStrength: applicant.score,
      programmeCompetitiveness: candidate.competitiveness,
      profileFit: candidate.fitScore,
      competitivenessGap: round(candidate.gap),
      applicantBreakdown: applicant.breakdown
    },
    profileConfidence: applicant.confidence,
    dataConfidence: candidate.dataConfidence,
    modelEnhanced: false,
    saved: false
  };
}

function selectDeterministicRecommendations(applicantProfile, universities = []) {
  const scored = scoreCatalogueCandidates(applicantProfile, universities);
  const candidates = scored.candidates;
  const uniqueUniversityCount = new Set(candidates.map(candidateUniversityKey)).size;
  if (uniqueUniversityCount < 3) {
    return {
      recommendations: [],
      applicant: scored.applicant,
      catalogueSize: scored.catalogueSize,
      eligibleCount: candidates.length,
      rejectedCount: scored.rejected.length,
      tierLimit: scored.tierLimit
    };
  }

  const usedIds = new Set();
  const usedUniversities = new Set();
  const selected = [];
  const remember = item => {
    if (!item) return;
    usedIds.add(item.id);
    usedUniversities.add(candidateUniversityKey(item));
    selected.push(item);
  };

  const reachBand = candidates.filter(item => item.gap >= -2 && item.gap <= 18);
  remember(pickBest(
    reachBand.length ? reachBand : candidates,
    usedIds,
    usedUniversities,
    item => item.fitScore * 0.5 + item.competitiveness * 0.35 - Math.abs(item.gap - 6) * 1.5
  ));

  const targetBand = candidates.filter(item => item.gap >= -8 && item.gap <= 6);
  remember(pickBest(
    targetBand.length ? targetBand : candidates,
    usedIds,
    usedUniversities,
    item => item.fitScore * 0.65 - Math.abs(item.gap) * 2 + item.competitiveness * 0.15
  ));

  const safetyBand = candidates.filter(item => item.gap <= -5 && item.gap >= -25);
  remember(pickBest(
    safetyBand.length ? safetyBand : candidates,
    usedIds,
    usedUniversities,
    item => item.fitScore * 0.65 - Math.abs(item.gap + 10) * 1.5 + item.competitiveness * 0.15
  ));

  while (selected.length < 3) {
    const fallback = pickBest(
      candidates,
      usedIds,
      usedUniversities,
      item => item.fitScore + item.competitiveness * 0.2 - Math.abs(item.gap) * 0.5
    );
    if (!fallback) break;
    remember(fallback);
  }

  const ordered = selected
    .sort((a, b) => b.competitiveness - a.competitiveness || a.catalogueRank - b.catalogueRank)
    .slice(0, 3);
  const recommendations = ordered.map((candidate, index) => (
    buildRecommendation(applicantProfile, scored.applicant, candidate, MATCH_CATEGORIES[index])
  ));

  return {
    recommendations,
    applicant: scored.applicant,
    catalogueSize: scored.catalogueSize,
    eligibleCount: candidates.length,
    rejectedCount: scored.rejected.length,
    tierLimit: scored.tierLimit
  };
}

function normalizeCatalogueRecommendation(item, catalogueById) {
  const catalogueItem = catalogueById.get(String(item?.catalogueId || item?.catalogId || item?.id || ''));
  if (!catalogueItem) return null;
  return {
    id: `ai-v2-${catalogueItem.id}`,
    catalogueId: String(catalogueItem.id),
    source: 'ai_hybrid_v2',
    universityName: catalogueItem.university_name,
    university_name: catalogueItem.university_name,
    country: catalogueItem.country || '',
    stateOrRegion: catalogueItem.state || '',
    state: catalogueItem.state || '',
    programName: catalogueItem.program,
    program: catalogueItem.program,
    programUrl: catalogueItem.program_url || catalogueItem.programUrl || '',
    imageUrl: catalogueItem.imageUrl || '',
    matchCategory: MATCH_CATEGORIES.includes(item.matchCategory) ? item.matchCategory : 'Target',
    whySuggested: String(item.whySuggested || 'Selected from the UniScout catalogue using the applicant profile.'),
    relevantResearchAreas: Array.isArray(item.relevantResearchAreas) ? item.relevantResearchAreas.filter(Boolean).slice(0, 5) : [],
    requirements: {
      cgpa: requirementText(asNumber(catalogueItem.min_cgpa)),
      gre: requirementText(asNumber(catalogueItem.min_gre)),
      english: requirementText(asNumber(catalogueItem.min_ielts), ' IELTS')
    },
    funding: { status: 'Not verified', details: 'Verify scholarships and assistantships with the programme.' },
    estimatedCost: asNumber(catalogueItem.cost_of_attendance_usd),
    intake: catalogueItem.intake || '',
    deadline: catalogueItem.deadline || '',
    importantNotes: Array.isArray(item.importantNotes) ? item.importantNotes.filter(Boolean).slice(0, 3) : [],
    sources: [],
    saved: false
  };
}

function normalizeCatalogueRecommendations(items, universities = []) {
  const catalogueById = new Map(universities.map(item => [String(item.id), item]));
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map(item => normalizeCatalogueRecommendation(item, catalogueById))
    .filter(item => item && !seen.has(item.catalogueId) && seen.add(item.catalogueId))
    .slice(0, 3);
}

function extractJson(text) {
  const raw = String(text || '').trim().replace(/^```json\s*|```$/g, '').trim();
  try {
    return JSON.parse(raw);
  } catch (error) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw error;
  }
}

function getGeminiApiKeys() {
  const pooled = String(process.env.GEMINI_API_KEYS || '')
    .split(/[,;\r\n]+/)
    .map(value => value.trim())
    .filter(Boolean);
  const legacy = String(process.env.GEMINI_API_KEY || '').trim();
  return [...new Set([...pooled, legacy].filter(Boolean))];
}

function keyFingerprint(key) {
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 12);
}

function resetGeminiKeyPoolForTests() {
  keyCursor = 0;
  keyHealth.clear();
}

function availableKeysInRoundRobinOrder(now = Date.now()) {
  const keys = getGeminiApiKeys();
  if (!keys.length) return [];
  const start = keyCursor % keys.length;
  return keys
    .map((_, index) => keys[(start + index) % keys.length])
    .filter(key => (keyHealth.get(keyFingerprint(key))?.cooldownUntil || 0) <= now);
}

function markKeyCooldown(key, durationMs, reason) {
  keyHealth.set(keyFingerprint(key), {
    cooldownUntil: Date.now() + durationMs,
    reason
  });
}

function retryAfterMilliseconds(response) {
  const value = response?.headers?.get?.('retry-after');
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(seconds * 1000, 1000);
  const retryAt = Date.parse(value);
  return Number.isFinite(retryAt) ? Math.max(retryAt - Date.now(), 1000) : null;
}

async function requestGemini(body) {
  const configuredKeys = getGeminiApiKeys();
  if (!configuredKeys.length) {
    const error = new Error('Gemini API keys are not configured.');
    error.statusCode = 503;
    throw error;
  }

  const keys = availableKeysInRoundRobinOrder();
  if (!keys.length) {
    const error = new Error('All Gemini API keys are temporarily cooling down.');
    error.statusCode = 503;
    throw error;
  }

  let lastError = null;
  for (const key of keys) {
    const configuredIndex = configuredKeys.indexOf(key);
    keyCursor = configuredIndex >= 0 ? (configuredIndex + 1) % configuredKeys.length : keyCursor;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify(body)
      });
    } catch (error) {
      markKeyCooldown(key, KEY_COOLDOWN_MS.network, 'network');
      lastError = new Error('Gemini request failed because of a temporary network error.');
      continue;
    }

    if (response.ok) {
      keyHealth.delete(keyFingerprint(key));
      return response.json();
    }

    const status = Number(response.status);
    if (status === 429) {
      markKeyCooldown(key, retryAfterMilliseconds(response) || KEY_COOLDOWN_MS.rateLimit, 'rate-limit');
      lastError = new Error('A Gemini API key reached its rate limit.');
      continue;
    }
    if (status === 401 || status === 403) {
      markKeyCooldown(key, KEY_COOLDOWN_MS.authentication, 'authentication');
      lastError = new Error('A Gemini API key was rejected.');
      continue;
    }
    if (status >= 500) {
      markKeyCooldown(key, KEY_COOLDOWN_MS.server, 'server');
      lastError = new Error(`Gemini temporarily failed (${status}).`);
      continue;
    }

    const error = new Error(`Gemini request failed (${status}).`);
    error.statusCode = 503;
    throw error;
  }

  const error = lastError || new Error('Gemini is temporarily unavailable.');
  error.statusCode = 503;
  throw error;
}

function buildExplanationPrompt(applicantProfile, recommendations) {
  const selected = recommendations.map(item => ({
    catalogueId: item.catalogueId,
    category: item.matchCategory,
    university: item.universityName,
    programme: item.programName,
    scores: item.scores,
    requirements: item.requirements,
    estimatedCost: item.estimatedCost,
    researchAreas: item.relevantResearchAreas
  }));

  return `You are the explanation layer for UniScout Recommendation Engine V2.

The deterministic engine has already evaluated the complete catalogue and locked these programmes. You MUST NOT add, remove, replace, reorder, or reclassify any programme. Do not predict admission or invent requirements, funding, rankings, deadlines, faculty, or research facts. Improve only the profile-grounded explanation and provide up to two cautions.

Return ONLY valid JSON:
{
  "explanations": [
    {
      "catalogueId": "exact supplied id",
      "whySuggested": "concise explanation grounded in supplied facts",
      "importantNotes": ["up to two cautions"]
    }
  ]
}

Applicant profile:
${JSON.stringify(applicantProfile)}

Locked recommendations:
${JSON.stringify(selected)}`;
}

async function enhanceRecommendationExplanations(applicantProfile, recommendations) {
  if (!getGeminiApiKeys().length || !recommendations.length) return recommendations;

  const data = await requestGemini({
    contents: [{ role: 'user', parts: [{ text: buildExplanationPrompt(applicantProfile, recommendations) }] }],
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 2048 }
  });
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n') || '';
  const explanations = extractJson(text).explanations || [];
  const byId = new Map(explanations.map(item => [String(item.catalogueId), item]));

  return recommendations.map(recommendation => {
    const explanation = byId.get(String(recommendation.catalogueId));
    if (!explanation) return recommendation;
    return {
      ...recommendation,
      whySuggested: String(explanation.whySuggested || recommendation.whySuggested),
      importantNotes: [...new Set([
        ...(recommendation.importantNotes || []),
        ...(Array.isArray(explanation.importantNotes) ? explanation.importantNotes : [])
      ])].slice(0, 3),
      modelEnhanced: true
    };
  });
}

async function callGeminiWithCatalogue(applicantProfile, universities = []) {
  const deterministic = selectDeterministicRecommendations(applicantProfile, universities);
  let recommendations = deterministic.recommendations;
  let modelEnhanced = false;

  try {
    const enhanced = await enhanceRecommendationExplanations(applicantProfile, recommendations);
    modelEnhanced = enhanced.some(item => item.modelEnhanced);
    recommendations = enhanced;
  } catch (error) {
    console.warn('Gemini explanation unavailable; using deterministic recommendations:', error.message);
  }

  return {
    recommendations,
    model: modelEnhanced ? GEMINI_MODEL : null,
    modelEnhanced,
    engineVersion: RECOMMENDATION_ENGINE_VERSION,
    source: 'hybrid_v2',
    applicantStrength: deterministic.applicant,
    catalogueSize: deterministic.catalogueSize,
    eligibleCount: deterministic.eligibleCount,
    rejectedCount: deterministic.rejectedCount,
    tierLimit: deterministic.tierLimit
  };
}

module.exports = {
  RECOMMENDATION_ENGINE_VERSION,
  MATCH_CATEGORIES,
  normalizeCountry,
  buildApplicantProfile,
  isUsefulProfile,
  buildCatalogueSnapshot,
  buildRecommendationCacheKey,
  calculateApplicantStrength,
  scoreCatalogueCandidates,
  selectDeterministicRecommendations,
  normalizeCatalogueRecommendations,
  getGeminiApiKeys,
  resetGeminiKeyPoolForTests,
  requestGemini,
  callGeminiWithCatalogue,
  callGeminiWithSearch: callGeminiWithCatalogue
};
