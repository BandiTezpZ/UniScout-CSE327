const fs = require('fs');
let code = fs.readFileSync('backend/services/aiUniversityFinder.js', 'utf8');

// Fix the prompt
const promptTarget = `Select up to 100 relevant graduate-study options ONLY from the supplied UniScout catalogue. Find the best possible matches for the student based on their profile, even if they do not meet every single requirement. Do not limit your output to a small number if there are many good matches. Use the applicant's factual profile and preferences to compare programme field, research area, stated minimums, location, and budget. Do not use outside knowledge or claim that you searched the web.`;

const promptReplacement = `Select relevant graduate-study options ONLY from the supplied UniScout catalogue. 
CRITICAL RULES:
1. NEVER hallucinate the applicant's scores. If the applicant has a 2.5 CGPA, you must evaluate them as having a 2.5 CGPA.
2. If the applicant's CGPA or test scores are significantly below a university's stated minimums (e.g. they have 2.5 but the minimum is 3.5), DO NOT suggest that university.
3. If no universities are a realistic match, return an empty array for recommendations. Do not forcefully match them with high-tier universities (like MIT or Stanford) if their profile is weak.
4. Use the applicant's factual profile and preferences to compare programme field, research area, stated minimums, location, and budget.`;
code = code.replace(promptTarget, promptReplacement);


// Fix the empty recommendations error
const errorTarget = `  if (!recommendations.length) {
    const error = new Error('Gemini returned no usable catalogue recommendations.');
    error.statusCode = 503;
    throw error;
  }`;

const errorReplacement = `  // It is perfectly valid for recommendations to be empty if the applicant doesn't meet minimums
  // so we do not throw an error here.`;
code = code.replace(errorTarget, errorReplacement);


fs.writeFileSync('backend/services/aiUniversityFinder.js', code);
console.log("Patched AI logic and error handling");
