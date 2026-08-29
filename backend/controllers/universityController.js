const { v4: uuidv4 } = require('uuid');
const {
  query,
  getAiShortlists,
  saveAiShortlist,
  removeAiShortlist,
  getLatestAiRecommendations,
  saveLatestAiRecommendations
} = require('../config/db');
const {
  buildApplicantProfile,
  isUsefulProfile,
  buildRecommendationCacheKey,
  callGeminiWithCatalogue
} = require('../services/aiUniversityFinder');

const configuredCacheHours = Number(process.env.AI_RECOMMENDATION_CACHE_HOURS || 24);
const recommendationCacheMs = (Number.isFinite(configuredCacheHours) && configuredCacheHours > 0 ? configuredCacheHours : 24) * 60 * 60 * 1000;

function isFreshRecommendationCache(cached, cacheKey) {
  const generatedAt = Date.parse(cached?.generatedAt || '');
  return Boolean(cached?.cacheKey === cacheKey && Number.isFinite(generatedAt) && Date.now() - generatedAt < recommendationCacheMs);
}

exports.list = async (req, res) => {
  try {
    const { q = '', program = '', sort = 'rank_asc' } = req.query;
    const term = String(q).trim().toLowerCase();
    
    let sql = 'SELECT * FROM universities';
    let params = [];
    
    let whereClauses = [];
    if (term) {
      whereClauses.push('(LOWER(university_name) LIKE ? OR LOWER(state) LIKE ? OR LOWER(program) LIKE ?)');
      const likeTerm = `%${term}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }
    if (program) {
      whereClauses.push('program = ?');
      params.push(program);
    }
    
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    let universities = await query(sql, params);
    
    universities.sort((a, b) => {
      if (sort === 'cost_asc') return a.cost_of_attendance_usd - b.cost_of_attendance_usd;
      if (sort === 'cost_desc') return b.cost_of_attendance_usd - a.cost_of_attendance_usd;
      if (sort === 'deadline_asc') return String(a.deadline).localeCompare(String(b.deadline));
      if (sort === 'deadline_desc') return String(b.deadline).localeCompare(String(a.deadline));
      if (sort === 'subject_asc') return String(a.program).localeCompare(String(b.program));
      if (sort === 'subject_desc') return String(b.program).localeCompare(String(a.program));
      if (sort === 'rank_asc') return a.rank_tier - b.rank_tier || a.university_name.localeCompare(b.university_name);
      if (sort === 'rank_desc') return b.rank_tier - a.rank_tier || a.university_name.localeCompare(b.university_name);
      return a.rank_tier - b.rank_tier || a.university_name.localeCompare(b.university_name);
    });

    const shortlists = await query('SELECT university_id FROM shortlists WHERE user_id = ?', [req.user.id]);
    const savedIds = new Set(shortlists.map(s => String(s.university_id)));
    
    const results = universities.map(u => ({ ...u, saved: savedIds.has(String(u.id)) }));
    
    res.json({ universities: results, total: universities.length, savedCount: savedIds.size });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.shortlist = async (req, res) => {
  try {
    const uni = await query('SELECT id FROM universities WHERE id = ?', [req.params.id]);
    if (!uni.length) return res.status(404).json({ message: 'University not found' });
    await query('INSERT IGNORE INTO shortlists (user_id, university_id) VALUES (?, ?)', [req.user.id, req.params.id]);
    res.json({ message: 'University saved to shortlist', universityId: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.shortlistAi = async (req, res) => {
  try {
    if (!req.body?.universityName || !req.body?.programName) {
      return res.status(400).json({ message: 'AI recommendation must include universityName and programName' });
    }
    const source = String(req.body.source || '').startsWith('ai_') ? req.body.source : 'ai_catalog';
    const id = saveAiShortlist(req.user.id, { ...req.body, source });
    res.json({
      message: 'AI suggested university saved',
      saved: true,
      universityId: id,
      shortlist: {
        id,
        university_id: id,
        source,
        aiUniversity: { ...req.body, id, source }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeAiShortlist = async (req, res) => {
  try {
    const removed = removeAiShortlist(req.user.id, req.params.id);
    res.json({ message: 'AI suggested university removed', saved: false, removed, universityId: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeShortlist = async (req, res) => {
  try {
    await query('DELETE FROM shortlists WHERE user_id = ? AND university_id = ?', [req.user.id, req.params.id]);
    res.json({ message: 'University removed from shortlist', universityId: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.saved = async (req, res) => {
  try {
    const sql = `
      SELECT u.* 
      FROM universities u
      JOIN shortlists s ON u.id = s.university_id
      WHERE s.user_id = ?
    `;
    const universities = await query(sql, [req.user.id]);
    const localResults = universities.map(u => ({ ...u, saved: true, source: 'local_database' }));
    const aiResults = getAiShortlists(req.user.id).map(item => ({
      ...(item.aiUniversity || {}),
      id: item.university_id,
      university_name: item.aiUniversity?.universityName || item.aiUniversity?.university_name || '',
      program: item.aiUniversity?.programName || item.aiUniversity?.program || '',
      state: item.aiUniversity?.stateOrRegion || item.aiUniversity?.state || '',
      source: item.source || item.aiUniversity?.source || 'ai_catalog',
      saved: true
    }));
    const results = [...localResults, ...aiResults];
    res.json({ universities: results, total: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function requireAdmin(req, res) {
  if (req.user.role !== 'Admin') {
    res.status(403).json({ message: 'Admin role required' });
    return false;
  }
  return true;
}

exports.adminList = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const universities = await query('SELECT * FROM universities');
    res.json({ universities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    if (!req.body.university_name) return res.status(400).json({ message: 'University name is required' });
    
    const u = {
      id: uuidv4(),
      university_name: req.body.university_name,
      country: req.body.country || 'USA',
      state: req.body.state || '',
      program: req.body.program || '',
      rank_tier: Number(req.body.rank_tier || 0),
      tuition_usd: Number(req.body.tuition_usd || 0),
      living_cost_usd: Number(req.body.living_cost_usd || 0),
      cost_of_attendance_usd: Number(req.body.cost_of_attendance_usd || 0),
      min_cgpa: Number(req.body.min_cgpa || 0),
      min_ielts: Number(req.body.min_ielts || 0),
      min_gre: Number(req.body.min_gre || 0),
      accepts_without_gre: req.body.accepts_without_gre || 'Varies',
      research_level: Number(req.body.research_level || 0),
      ms_cs: req.body.ms_cs || '',
      research_category: req.body.research_category || '',
      intake: req.body.intake || '',
      deadline: req.body.deadline || '',
      data_note: req.body.data_note || '',
      imageUrl: req.body.imageUrl || ''
    };
    
    const sql = `
      INSERT INTO universities (
        id, university_name, country, state, program, rank_tier, tuition_usd, living_cost_usd, cost_of_attendance_usd, min_cgpa, min_ielts, min_gre, accepts_without_gre, research_level, ms_cs, research_category, intake, deadline, data_note, imageUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      u.id, u.university_name, u.country, u.state, u.program, u.rank_tier, u.tuition_usd, u.living_cost_usd, u.cost_of_attendance_usd, u.min_cgpa, u.min_ielts, u.min_gre, u.accepts_without_gre, u.research_level, u.ms_cs, u.research_category, u.intake, u.deadline, u.data_note, u.imageUrl
    ];
    
    await query(sql, params);
    res.status(201).json({ university: u });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const existing = await query('SELECT * FROM universities WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'University not found' });
    
    const e = existing[0];
    const u = {
      university_name: req.body.university_name ?? e.university_name,
      country: req.body.country ?? e.country,
      state: req.body.state ?? e.state,
      program: req.body.program ?? e.program,
      rank_tier: Number(req.body.rank_tier ?? e.rank_tier),
      tuition_usd: Number(req.body.tuition_usd ?? e.tuition_usd),
      living_cost_usd: Number(req.body.living_cost_usd ?? e.living_cost_usd),
      cost_of_attendance_usd: Number(req.body.cost_of_attendance_usd ?? e.cost_of_attendance_usd),
      min_cgpa: Number(req.body.min_cgpa ?? e.min_cgpa),
      min_ielts: Number(req.body.min_ielts ?? e.min_ielts),
      min_gre: Number(req.body.min_gre ?? e.min_gre),
      accepts_without_gre: req.body.accepts_without_gre ?? e.accepts_without_gre,
      research_level: Number(req.body.research_level ?? e.research_level),
      ms_cs: req.body.ms_cs ?? e.ms_cs,
      research_category: req.body.research_category ?? e.research_category,
      intake: req.body.intake ?? e.intake,
      deadline: req.body.deadline ?? e.deadline,
      data_note: req.body.data_note ?? e.data_note,
      imageUrl: req.body.imageUrl ?? e.imageUrl
    };
    
    const sql = `
      UPDATE universities SET
        university_name = ?, country = ?, state = ?, program = ?, rank_tier = ?, tuition_usd = ?, living_cost_usd = ?, cost_of_attendance_usd = ?, min_cgpa = ?, min_ielts = ?, min_gre = ?, accepts_without_gre = ?, research_level = ?, ms_cs = ?, research_category = ?, intake = ?, deadline = ?, data_note = ?, imageUrl = ?
      WHERE id = ?
    `;
    const params = [
      u.university_name, u.country, u.state, u.program, u.rank_tier, u.tuition_usd, u.living_cost_usd, u.cost_of_attendance_usd, u.min_cgpa, u.min_ielts, u.min_gre, u.accepts_without_gre, u.research_level, u.ms_cs, u.research_category, u.intake, u.deadline, u.data_note, u.imageUrl, req.params.id
    ];
    
    await query(sql, params);
    res.json({ university: { ...u, id: req.params.id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.remove = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await query('DELETE FROM universities WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'University not found' });
    res.json({ message: 'University deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.suggested = async (req, res) => {
  try {
    const cached = getLatestAiRecommendations(req.user.id);
    const savedIds = new Set(getAiShortlists(req.user.id).map(item => String(item.university_id)));
    if (!cached) {
      return res.json({ status: 'ready', universities: [], total: 0, message: 'Ready for Gemini to analyze the UniScout catalogue.' });
    }
    const results = (cached.recommendations || []).map(item => ({ ...item, saved: savedIds.has(String(item.id)) }));
    res.json({
      status: 'success',
      universities: results,
      total: results.length,
      generatedAt: cached.generatedAt,
      savedCount: savedIds.size
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load AI recommendations.' });
  }
};

exports.generateSuggested = async (req, res) => {
  try {
    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Student role required' });
    const profiles = await query('SELECT * FROM student_profiles WHERE userId = ?', [req.user.id]);
    const applicantProfile = buildApplicantProfile(req.user, profiles[0] || {});
    if (!isUsefulProfile(applicantProfile)) {
      return res.status(400).json({
        status: 'no_profile',
        message: 'Upload or complete your profile before searching for universities.'
      });
    }

    const universities = await query('SELECT * FROM universities');
    if (!universities.length) {
      return res.status(503).json({ status: 'unavailable', message: 'The local university catalogue is empty.' });
    }

    const cacheKey = buildRecommendationCacheKey(applicantProfile, universities);
    const cached = getLatestAiRecommendations(req.user.id);
    if (isFreshRecommendationCache(cached, cacheKey)) {
      const savedIds = new Set(getAiShortlists(req.user.id).map(item => String(item.university_id)));
      const results = (cached.recommendations || []).map(item => ({ ...item, saved: savedIds.has(String(item.id)) }));
      return res.json({
        status: 'success',
        cached: true,
        message: 'Using cached recommendations for your current profile and catalogue.',
        universities: results,
        total: results.length,
        generatedAt: cached.generatedAt
      });
    }

    const result = await callGeminiWithCatalogue(applicantProfile, universities);
    const saved = saveLatestAiRecommendations(req.user.id, {
      applicantProfile,
      cacheKey,
      model: result.model,
      source: result.source,
      recommendations: result.recommendations,
      catalogueSize: universities.length
    });
    res.json({
      status: 'success',
      cached: false,
      message: 'Gemini analyzed the local UniScout catalogue.',
      universities: saved.recommendations,
      total: saved.recommendations.length,
      generatedAt: saved.generatedAt
    });
  } catch (error) {
    console.warn('AI catalogue analysis unavailable:', error.message);
    res.status(error.statusCode || 503).json({
      status: 'unavailable',
      message: 'AI catalogue recommendations are temporarily unavailable. You can still browse and shortlist universities manually.'
    });
  }
};
