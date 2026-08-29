require('dotenv').config();
const { buildApplicantProfile, buildCatalogueSnapshot } = require('./services/aiUniversityFinder');
const { query } = require('./config/db');

function buildPrompt(applicantProfile, universities) {
  const catalogue = buildCatalogueSnapshot(universities);
  return `You are the catalogue recommendation component of UniScout.

Select up to 100 relevant graduate-study options ONLY from the supplied UniScout catalogue. Find the best possible matches for the student based on their profile, even if they do not meet every single requirement. Do not limit your output to a small number if there are many good matches. Use the applicant's factual profile and preferences to compare programme field, research area, stated minimums, location, and budget. Do not use outside knowledge or claim that you searched the web.

Do not predict admission, assign match percentages, create competitiveness scores, or label options Safe, Target, or Reach. Do not invent universities, programmes, requirements, funding, rankings, costs, deadlines, or research facts. The catalogue contains planning estimates, so mention meaningful tradeoffs without presenting them as guaranteed current facts.

Return ONLY valid JSON with this exact shape:
{
  "recommendations": [
    {
      "catalogueId": "exact id from catalogue",
      "whySuggested": "brief profile-grounded explanation",
      "relevantResearchAreas": ["only areas supported by the profile or catalogue"],
      "importantNotes": ["up to two useful catalogue-grounded tradeoffs"]
    }
  ]
}

Applicant profile:
${JSON.stringify(applicantProfile)}

UniScout catalogue (${catalogue.length} records):
${JSON.stringify(catalogue)}`;
}

require('./config/db').initializeDb().then(async () => {
    try {
        const users = await query('SELECT * FROM student_profiles LIMIT 1');
        const profile = users[0];
        const formatted = buildApplicantProfile(profile);
        const universities = await query('SELECT * FROM universities');
        
        const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
        
        const prompt = buildPrompt(formatted, universities);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 }
            })
        });
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n') || '';
        console.log("TEXT length:", text.length);
        if (text.length > 0) {
            console.log("TEXT:", text);
        } else {
            console.log("Error? data:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('FAILED:', e.message);
    }
    process.exit(0);
});
