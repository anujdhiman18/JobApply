const cron = require('node-cron');
const Preferences = require('../models/Preferences');
const { runJobSearchForUser } = require('./jobMatcher');

// Active cron jobs keyed by userId string
const activeTasks = new Map();

/**
 * Converts "HH:MM" into a daily node-cron expression "MM HH * * *".
 */
function buildDailyCronExpression(scheduleTime) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((scheduleTime || '09:00').trim());
  if (!match) {
    return '0 9 * * *';
  }
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  return `${minute} ${hour} * * *`;
}

/**
 * Registers or updates the daily cron job for a single user.
 */
function scheduleUserJob(preferences) {
  const userKey = String(preferences.userId);

  if (activeTasks.has(userKey)) {
    activeTasks.get(userKey).task.stop();
    activeTasks.delete(userKey);
  }

  if (!preferences.schedulerEnabled) {
    return { isScheduled: false, cronExpression: null };
  }

  const cronExpression = buildDailyCronExpression(preferences.scheduleTime);
  const task = cron.schedule(cronExpression, async () => {
    try {
      const result = await runJobSearchForUser(preferences.userId);
      console.log(
        `[Scheduler] Ran daily search for user ${userKey}: matched=${result.matchedCount}, created=${result.createdCount}`
      );
    } catch (err) {
      console.error(`[Scheduler] Error running job for user ${userKey}:`, err.message);
    }
  });

  activeTasks.set(userKey, { task, cronExpression });
  return { isScheduled: true, cronExpression };
}

/**
 * Loads all enabled user schedules from MongoDB on server startup.
 */
async function initAllSchedules() {
  const enabledPrefs = await Preferences.find({ schedulerEnabled: true });
  for (const prefs of enabledPrefs) {
    scheduleUserJob(prefs);
  }
  console.log(`[Scheduler] Initialized ${enabledPrefs.length} active daily job schedule(s).`);
}

/**
 * Returns live scheduler status for a user.
 */
function getScheduleInfo(userId) {
  const entry = activeTasks.get(String(userId));
  return entry
    ? { isScheduled: true, cronExpression: entry.cronExpression }
    : { isScheduled: false, cronExpression: null };
}

module.exports = {
  scheduleUserJob,
  initAllSchedules,
  getScheduleInfo,
  buildDailyCronExpression,
};

