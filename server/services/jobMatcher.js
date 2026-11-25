const Job = require('../models/Job');
const Preferences = require('../models/Preferences');
const Application = require('../models/Application');
const MOCK_JOBS = require('../data/mockJobs');

/**
 * Ensures the mock job catalog exists in MongoDB.
 */
async function syncMockJobs() {
  for (const jobData of MOCK_JOBS) {
    await Job.findOneAndUpdate(
      { externalId: jobData.externalId },
      { $set: jobData },
      { upsert: true, new: true }
    );
  }
}

/**
 * Evaluates whether a job matches a user's saved Preferences.
 * Returns { matched: boolean, reason: string }.
 */
function evaluateJobMatch(job, prefs) {
  const reasons = [];

  // 1. Company type check
  if (prefs.companyType && prefs.companyType !== 'any') {
    if (job.companyType.toLowerCase() !== prefs.companyType.toLowerCase()) {
      return { matched: false, reason: '' };
    }
    reasons.push(`Company type: ${job.companyType}`);
  }

  // 2. Role type check (tech / non-tech)
  if (prefs.roleType && job.roleType !== prefs.roleType) {
    return { matched: false, reason: '' };
  }
  reasons.push(`Role track: ${job.roleType}`);

  // 3. Role name keyword overlap (if user entered a specific role)
  if (prefs.roleName && prefs.roleName.trim()) {
    const tokens = prefs.roleName
      .toLowerCase()
      .split(/[\s,/]+/)
      .filter((t) => t.length > 2);
    const jobText = `${job.roleName} ${job.requirements.join(' ')}`.toLowerCase();
    const hasOverlap =
      tokens.length === 0 || tokens.some((token) => jobText.includes(token));
    if (!hasOverlap) {
      return { matched: false, reason: '' };
    }
    reasons.push(`Role match: ${job.roleName}`);
  }

  // 4. Experience check (allow up to +1 year stretch)
  if (typeof prefs.experienceYears === 'number') {
    if (job.experienceRequired > prefs.experienceYears + 1) {
      return { matched: false, reason: '' };
    }
    reasons.push(`Exp <= ${prefs.experienceYears + 1} yrs`);
  }

  // 5. Expected salary check (allow jobs within 20% below or above expected LPA)
  if (typeof prefs.expectedLpa === 'number' && prefs.expectedLpa > 0) {
    const minAcceptable = prefs.expectedLpa * 0.8;
    if (job.salaryLpa < minAcceptable) {
      return { matched: false, reason: '' };
    }
    reasons.push(`Salary: ${job.salaryLpa} LPA`);
  }

  // 6. Location check (Remote jobs always match; empty/any matches all)
  if (prefs.location && prefs.location.trim()) {
    const prefLoc = prefs.location.trim().toLowerCase();
    const jobLoc = job.location.toLowerCase();
    if (
      prefLoc !== 'any' &&
      jobLoc !== 'remote' &&
      !jobLoc.includes(prefLoc) &&
      !prefLoc.includes(jobLoc)
    ) {
      return { matched: false, reason: '' };
    }
    reasons.push(`Location: ${job.location}`);
  }

  return {
    matched: true,
    reason: reasons.join(' | '),
  };
}

/**
 * Searches for jobs matching the user's Preferences and creates
 * "pending" Application entries for newly matched jobs.
 */
async function runJobSearchForUser(userId) {
  const prefs = await Preferences.findOne({ userId });
  if (!prefs) {
    return { matchedCount: 0, createdCount: 0, message: 'No preferences saved yet.' };
  }

  await syncMockJobs();
  const allJobs = await Job.find({});

  let matchedCount = 0;
  let createdCount = 0;

  for (const job of allJobs) {
    const { matched, reason } = evaluateJobMatch(job, prefs);
    if (!matched) continue;

    matchedCount += 1;
    const existing = await Application.findOne({ userId, jobId: job._id });
    if (!existing) {
      await Application.create({
        userId,
        jobId: job._id,
        status: 'pending',
        matchReason: reason,
      });
      createdCount += 1;
    }
  }

  prefs.lastRunAt = new Date();
  await prefs.save();

  return {
    matchedCount,
    createdCount,
    lastRunAt: prefs.lastRunAt,
  };
}

module.exports = {
  syncMockJobs,
  runJobSearchForUser,
};

