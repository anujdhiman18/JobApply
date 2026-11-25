/**
 * Calculates an ATS (Applicant Tracking System) score out of 100
 * across four weighted dimensions (25 points each):
 *   1. Keywords & action verbs
 *   2. Standard resume sections present
 *   3. Formatting & contact details
 *   4. Length & quantifiable impact
 */

const COMMON_KEYWORDS = [
  'javascript', 'typescript', 'react', 'node', 'express', 'mongodb', 'sql',
  'python', 'java', 'html', 'css', 'git', 'docker', 'aws', 'api', 'rest',
  'testing', 'agile', 'analytics', 'management', 'communication', 'leadership',
  'excel', 'product', 'design', 'cloud', 'ci/cd', 'database',
];

const ACTION_VERBS = [
  'built', 'developed', 'designed', 'implemented', 'led', 'managed',
  'improved', 'optimized', 'created', 'delivered', 'launched', 'automated',
  'analyzed', 'collaborated', 'reduced', 'increased',
];

const STANDARD_SECTIONS = [
  { name: 'Summary / Profile', patterns: ['summary', 'objective', 'profile', 'about me'] },
  { name: 'Experience', patterns: ['experience', 'employment', 'work history', 'internship'] },
  { name: 'Education', patterns: ['education', 'academic', 'university', 'degree', 'b.tech', 'bachelor'] },
  { name: 'Skills', patterns: ['skills', 'technologies', 'tech stack', 'competencies'] },
  { name: 'Projects / Certifications', patterns: ['projects', 'certifications', 'achievements', 'awards'] },
];

function calculateAtsScore(rawText, targetRole = '') {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();
  const suggestions = [];

  // 1. Keywords & Action Verbs (0 - 25 points)
  const roleTokens = targetRole
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const keywordPool = Array.from(new Set([...COMMON_KEYWORDS, ...roleTokens]));

  const matchedKeywords = keywordPool.filter((kw) => lower.includes(kw));
  const matchedVerbs = ACTION_VERBS.filter((verb) =>
    new RegExp(`\\b${verb}\\b`, 'i').test(lower)
  );

  const keywordPts = Math.min(15, matchedKeywords.length * 2);
  const verbPts = Math.min(10, matchedVerbs.length * 2);
  const keywordsScore = Math.min(25, keywordPts + verbPts);

  if (matchedKeywords.length < 5) {
    suggestions.push(
      'Include more role-relevant technical or domain keywords (e.g., tools, frameworks, methodologies).'
    );
  }
  if (matchedVerbs.length < 3) {
    suggestions.push(
      'Start bullet points with strong action verbs like "Built", "Optimized", "Led", or "Automated".'
    );
  }

  // 2. Standard Sections Present (0 - 25 points, 5 points per section)
  let foundSections = 0;
  const missingSections = [];
  for (const section of STANDARD_SECTIONS) {
    const found = section.patterns.some((p) => lower.includes(p));
    if (found) {
      foundSections += 1;
    } else {
      missingSections.push(section.name);
    }
  }
  const sectionsScore = foundSections * 5;
  if (missingSections.length > 0) {
    suggestions.push(`Add clear section headings for: ${missingSections.join(', ')}.`);
  }

  // 3. Formatting & Contact Readability (0 - 25 points)
  let formattingScore = 0;
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s\-()]{8,}\d)/.test(text);
  const hasProfileLink = /(linkedin\.com|github\.com|portfolio)/i.test(lower);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const hasBulletsOrStructure =
    /[•\-*]/.test(text) || lines.length >= 15;

  if (hasEmail) formattingScore += 7;
  else suggestions.push('Include a professional email address at the top of your resume.');

  if (hasPhone) formattingScore += 6;
  else suggestions.push('Add a reachable phone number in your contact header.');

  if (hasProfileLink) formattingScore += 6;
  else suggestions.push('Add a LinkedIn or GitHub profile link for recruiter verification.');

  if (hasBulletsOrStructure) formattingScore += 6;
  else suggestions.push('Use concise bullet points and clear line breaks for ATS readability.');

  // 4. Length & Quantifiable Impact (0 - 25 points)
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  let lengthScore = 0;

  if (wordCount >= 250 && wordCount <= 900) {
    lengthScore += 15;
  } else if (wordCount >= 120 && wordCount < 250) {
    lengthScore += 9;
    suggestions.push('Your resume is a bit brief; expand on project outcomes and responsibilities (aim for 300–700 words).');
  } else if (wordCount > 900 && wordCount <= 1300) {
    lengthScore += 10;
    suggestions.push('Consider trimming older details to keep your resume concise (1–2 pages).');
  } else if (wordCount < 120) {
    lengthScore += 3;
    suggestions.push('Extracted text is very short. Ensure your PDF is text-based (not a scanned image) and add experience details.');
  } else {
    lengthScore += 6;
    suggestions.push('Resume is quite long (>1300 words). Trim redundant bullets for better ATS ranking.');
  }

  const metricMatches = text.match(/\b\d+(\.\d+)?(%|x|\+|k|m|lpa|users|ms|hrs|years)\b/gi) || [];
  if (metricMatches.length >= 3) {
    lengthScore += 10;
  } else if (metricMatches.length >= 1) {
    lengthScore += 5;
    suggestions.push('Add more measurable metrics (e.g., "Reduced API latency by 35%", "Served 10k+ users").');
  } else {
    suggestions.push('Quantify achievements with numbers or percentages to stand out to ATS filters.');
  }

  const totalScore = Math.min(
    100,
    keywordsScore + sectionsScore + formattingScore + lengthScore
  );

  if (suggestions.length === 0) {
    suggestions.push('Great job! Your resume has strong ATS compatibility. Tailor keywords per job description.');
  }

  return {
    atsScore: totalScore,
    breakdown: {
      keywords: keywordsScore,
      sections: sectionsScore,
      formatting: formattingScore,
      length: lengthScore,
    },
    suggestions,
  };
}

module.exports = { calculateAtsScore };

