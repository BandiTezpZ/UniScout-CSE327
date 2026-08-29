const assert = require('assert');
const fs = require('fs');
const path = require('path');

process.env.GEMINI_API_KEYS = 'test-key-1,test-key-2,test-key-3';
delete process.env.GEMINI_API_KEY;
process.env.GEMINI_MODEL = 'gemini-3.5-flash';

const {
  RECOMMENDATION_ENGINE_VERSION,
  buildApplicantProfile,
  buildCatalogueSnapshot,
  buildRecommendationCacheKey,
  scoreCatalogueCandidates,
  selectDeterministicRecommendations,
  normalizeCatalogueRecommendations,
  getGeminiApiKeys,
  resetGeminiKeyPoolForTests,
  callGeminiWithCatalogue
} = require('../services/aiUniversityFinder');

function university(id, name, tier, rank, overrides = {}) {
  const defaults = {
    country: 'USA',
    state: 'New York',
    program: 'Computer Science',
    rank_tier: tier,
    catalogue_rank: rank,
    tuition_usd: 30000 + tier * 3000,
    cost_of_attendance_usd: 45000 + tier * 2000,
    min_cgpa: ({ 1: 3.8, 2: 3.6, 3: 3.3, 4: 3.0 })[tier],
    min_ielts: ({ 1: 7.5, 2: 7.0, 3: 6.5, 4: 6.5 })[tier],
    min_gre: ({ 1: 323, 2: 318, 3: 312, 4: 305 })[tier],
    accepts_without_gre: 'Varies',
    research_level: tier <= 2 ? 5 : tier === 3 ? 4 : 3,
    research_category: 'Computing and Information Sciences',
    intake: 'Fall',
    deadline: 'January 15',
    data_note: 'Planning estimate; verify with the university.'
  };
  return { id: String(id), university_name: name, ...defaults, ...overrides };
}

function successfulGeminiResponse(explanations = []) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        candidates: [{
          content: { parts: [{ text: JSON.stringify({ explanations }) }] }
        }]
      };
    }
  };
}

function rateLimitedResponse() {
  return {
    ok: false,
    status: 429,
    headers: { get: name => name.toLowerCase() === 'retry-after' ? '60' : null }
  };
}

const catalogue = [
  university(1, 'Elite Institute', 1, 1),
  university(2, 'Competitive Tech', 1, 10),
  university(3, 'Strong Research University', 2, 30),
  university(4, 'Balanced University', 2, 55),
  university(5, 'Regional Research University', 3, 80),
  university(6, 'Applied Technology University', 3, 105),
  university(7, 'Metropolitan University', 3, 130),
  university(8, 'Low Selectivity University', 4, 170),
  university(9, 'Unrelated Biology University', 2, 45, { program: 'Biology', research_category: 'Life Sciences' })
];

const strongProfile = buildApplicantProfile(
  { fullName: 'Strong Applicant', email: 'strong@example.com' },
  {
    degreeLevel: 'Undergraduate',
    intendedMajor: 'Computer Science',
    cgpa: 3.8,
    ieltsToefl: 7.5,
    gresatgmat: 323,
    budget: 70000,
    researchPapers: 1,
    projects: 3,
    internships: 1,
    researchInterests: ['Machine Learning'],
    skills: ['Python', 'Machine Learning'],
    preferredCountries: '["[\"United States\"]"]',
    desiredDegree: 'MS'
  }
);

(async () => {
  assert.equal(RECOMMENDATION_ENGINE_VERSION, 'uniscout-v2.2.0', 'engine is explicitly versioned');
  assert.equal(getGeminiApiKeys().length, 3, 'three Gemini keys are loaded without exposing them');
  assert.deepEqual(strongProfile.preferences.countries, ['usa'], 'legacy nested country JSON is normalized');
  assert.equal(strongProfile.tests.englishType, 'IELTS', 'English test type is inferred');
  assert.equal(strongProfile.tests.admissionsType, 'GRE', 'admissions test type is inferred');

  const snapshot = buildCatalogueSnapshot(catalogue);
  assert.equal(snapshot.length, catalogue.length, 'catalogue snapshot keeps every valid record');
  assert.equal(snapshot[0].name, 'Elite Institute', 'catalogue name is preserved');
  assert.equal(snapshot[0].catalogueRank, 1, 'catalogue rank is preserved');

  const firstKey = buildRecommendationCacheKey(strongProfile, catalogue);
  const secondKey = buildRecommendationCacheKey(strongProfile, catalogue);
  const changedKey = buildRecommendationCacheKey({ ...strongProfile, skills: ['Robotics'] }, catalogue);
  assert.equal(firstKey, secondKey, 'cache key is stable');
  assert.notEqual(firstKey, changedKey, 'profile changes invalidate cache');

  const scored = scoreCatalogueCandidates(strongProfile, catalogue);
  assert.equal(scored.catalogueSize, catalogue.length, 'scoring evaluates the complete supplied catalogue');

  const selected = selectDeterministicRecommendations(strongProfile, catalogue);
  assert.equal(selected.recommendations.length, 3, 'three recommendations are returned when credible candidates exist');
  assert.deepEqual(selected.recommendations.map(item => item.matchCategory), ['Reach', 'Target', 'Safety'], 'one recommendation is returned for each category');
  assert.equal(new Set(selected.recommendations.map(item => item.catalogueId)).size, 3, 'recommendations use distinct records');
  assert.equal(new Set(selected.recommendations.map(item => item.universityName)).size, 3, 'recommendations use distinct universities');
  assert.equal(selected.recommendations.some(item => item.universityName === 'Low Selectivity University'), false, 'strong profile quality floor excludes tier 4');
  assert.equal(selected.recommendations.some(item => item.universityName === 'Unrelated Biology University'), false, 'unrelated programmes are rejected');
  assert.equal(selected.recommendations.some(item => Number(catalogue.find(row => String(row.id) === item.catalogueId)?.rank_tier) === 1), false, 'ordinary strong profiles do not automatically unlock Tier 1');
  assert.ok(selected.recommendations[0].scores.programmeCompetitiveness >= selected.recommendations[1].scores.programmeCompetitiveness, 'Reach is at least as competitive as Target');
  assert.ok(selected.recommendations[1].scores.programmeCompetitiveness >= selected.recommendations[2].scores.programmeCompetitiveness, 'Target is at least as competitive as Safety');

  const narrowBands = [
    university(20, 'Similar University One', 2, 40),
    university(21, 'Similar University Two', 2, 42),
    university(22, 'Similar University Three', 2, 44)
  ];
  const narrowSelection = selectDeterministicRecommendations(strongProfile, narrowBands);
  assert.equal(narrowSelection.recommendations.length, 3, 'relative fallback prevents the former two-result failure');
  assert.deepEqual(narrowSelection.recommendations.map(item => item.matchCategory), ['Reach', 'Target', 'Safety'], 'fallback still labels all three categories');

  const endLoadedCatalogue = [
    university(30, 'Wrong Field One', 2, 20, { program: 'Economics', research_category: 'Business and Management' }),
    university(31, 'Wrong Field Two', 3, 60, { program: 'Physics', research_category: 'Physical Sciences' }),
    university(32, 'Last Reach University', 2, 5),
    university(33, 'Last Target University', 2, 50),
    university(34, 'Last Safety University', 3, 110)
  ];
  const endLoadedSelection = selectDeterministicRecommendations(strongProfile, endLoadedCatalogue);
  assert.equal(endLoadedSelection.recommendations.length, 3, 'eligible records at the end of the array are considered');
  assert.deepEqual(
    new Set(endLoadedSelection.recommendations.map(item => item.universityName)),
    new Set(['Last Reach University', 'Last Target University', 'Last Safety University']),
    'selection is made from the whole array instead of an early subset'
  );

  const liveCatalogue = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/universities.json'), 'utf8'));
  const liveSelection = selectDeterministicRecommendations(strongProfile, liveCatalogue);
  const liveById = new Map(liveCatalogue.map(item => [String(item.id), item]));
  assert.equal(liveSelection.catalogueSize, liveCatalogue.length, 'the entire live database array is scored');
  assert.equal(liveSelection.recommendations.length, 3, 'current UniScout catalogue supports a complete three-category set');
  assert.deepEqual(liveSelection.recommendations.map(item => item.matchCategory), ['Reach', 'Target', 'Safety'], 'live catalogue keeps the requested category order');
  assert.equal(liveSelection.recommendations.some(item => Number(liveById.get(item.catalogueId)?.rank_tier) === 4), false, 'strong live profile is not under-matched to tier 4');
  assert.equal(liveSelection.recommendations.some(item => /East Carolina|Lamar/i.test(item.universityName)), false, 'strong live profile avoids the reported low-value matches');
  assert.equal(liveSelection.recommendations.some(item => /Massachusetts Institute of Technology/i.test(item.universityName)), false, 'MIT is not a default reach for an ordinary strong profile');

  const bioinformaticsProfile = buildApplicantProfile(
    { fullName: 'Bioinformatics Applicant', email: 'bio@example.com' },
    {
      degreeLevel: 'Undergraduate',
      intendedMajor: 'Bioinformatics',
      cgpa: 3.75,
      ieltsToefl: 8,
      gresatgmat: 320,
      researchPapers: 2,
      projects: 1,
      researchInterests: ['Bioinformatics', 'Computational Biology', 'Machine Learning'],
      skills: ['Python', 'Bioinformatics', 'Machine Learning'],
      preferredCountries: ['USA'],
      desiredDegree: 'MS'
    }
  );
  const bioSelection = selectDeterministicRecommendations(bioinformaticsProfile, liveCatalogue);
  assert.equal(bioSelection.recommendations.length, 3, 'representative bioinformatics profile gets a complete credible set');
  assert.equal(bioSelection.recommendations.some(item => /Massachusetts Institute of Technology/i.test(item.universityName)), false, 'MIT is not forced into the bioinformatics profile');

  const evidenceLightProfile = buildApplicantProfile(
    { fullName: 'Evidence-light Applicant', email: 'light@example.com' },
    { intendedMajor: 'Computer Science', cgpa: 3.9, ieltsToefl: 8, gresatgmat: 328, projects: 0, researchPapers: 0, desiredDegree: 'MS' }
  );
  const evidenceLightSelection = selectDeterministicRecommendations(evidenceLightProfile, liveCatalogue);
  assert.equal(evidenceLightSelection.recommendations.some(item => Number(liveById.get(item.catalogueId)?.rank_tier) === 1), false, 'scores alone do not unlock Tier 1 without research evidence');

  const weakProfile = buildApplicantProfile(
    { fullName: 'Weak Applicant', email: 'weak@example.com' },
    { intendedMajor: 'Computer Science', cgpa: 2.8, ieltsToefl: 6, gresatgmat: 295, preferredCountries: ['USA'] }
  );
  assert.equal(selectDeterministicRecommendations(weakProfile, catalogue).recommendations.length, 0, 'engine does not force matches below hard minimums');

  const normalized = normalizeCatalogueRecommendations([
    { catalogueId: '3', whySuggested: 'Good fit', matchCategory: 'Target' },
    { catalogueId: '999', universityName: 'Invented University' },
    { catalogueId: '3', whySuggested: 'Duplicate' }
  ], catalogue);
  assert.equal(normalized.length, 1, 'unknown and duplicate catalogue IDs are discarded');
  assert.equal(normalized[0].universityName, 'Strong Research University', 'display name comes from catalogue');

  const originalFetch = global.fetch;
  const lockedIds = selected.recommendations.map(item => item.catalogueId);
  try {
    const usedKeys = [];
    resetGeminiKeyPoolForTests();
    global.fetch = async (url, options) => {
      const parsedUrl = new URL(url);
      usedKeys.push(parsedUrl.searchParams.get('key'));
      const request = JSON.parse(options.body);
      assert.equal(request.tools, undefined, 'Google Search grounding is not requested');
      assert.ok(request.contents[0].parts[0].text.includes('MUST NOT add, remove, replace, reorder, or reclassify'), 'Gemini is restricted to explanations');
      return successfulGeminiResponse([{ catalogueId: lockedIds[0], whySuggested: 'Enhanced locked explanation.' }]);
    };

    const firstResult = await callGeminiWithCatalogue(strongProfile, catalogue);
    const secondResult = await callGeminiWithCatalogue(strongProfile, catalogue);
    assert.deepEqual(usedKeys, ['test-key-1', 'test-key-2'], 'successful requests rotate through the configured keys');
    assert.deepEqual(firstResult.recommendations.map(item => item.catalogueId), lockedIds, 'Gemini cannot replace deterministic selections');
    assert.deepEqual(secondResult.recommendations.map(item => item.matchCategory), ['Reach', 'Target', 'Safety'], 'Gemini cannot change recommendation categories');

    const failoverKeys = [];
    resetGeminiKeyPoolForTests();
    global.fetch = async url => {
      const key = new URL(url).searchParams.get('key');
      failoverKeys.push(key);
      return failoverKeys.length === 1
        ? rateLimitedResponse()
        : successfulGeminiResponse([{ catalogueId: lockedIds[0], whySuggested: 'Failover explanation.' }]);
    };
    const failover = await callGeminiWithCatalogue(strongProfile, catalogue);
    assert.deepEqual(failoverKeys, ['test-key-1', 'test-key-2'], 'a rate-limited key fails over to the next key');
    assert.equal(failover.modelEnhanced, true, 'successful failover still enhances explanations');

    await callGeminiWithCatalogue(strongProfile, catalogue);
    assert.equal(failoverKeys[2], 'test-key-3', 'rotation continues after the key that completed the failover request');

    const exhaustedKeys = [];
    resetGeminiKeyPoolForTests();
    global.fetch = async url => {
      exhaustedKeys.push(new URL(url).searchParams.get('key'));
      return rateLimitedResponse();
    };
    const fallback = await callGeminiWithCatalogue(strongProfile, catalogue);
    assert.deepEqual(exhaustedKeys, ['test-key-1', 'test-key-2', 'test-key-3'], 'all three keys are attempted before local fallback');
    assert.equal(fallback.recommendations.length, 3, 'deterministic recommendations survive total Gemini quota failure');
    assert.equal(fallback.modelEnhanced, false, 'quota fallback is reported honestly');
  } finally {
    global.fetch = originalFetch;
    resetGeminiKeyPoolForTests();
  }

  console.log('Recommendation Engine V2.2 and Gemini key-pool tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
