const express = require('express');
const Preferences = require('../models/Preferences');
const authMiddleware = require('../middleware/auth');
const { getScheduleInfo, scheduleUserJob } = require('../services/schedulerService');
const { runJobSearchForUser } = require('../services/jobMatcher');

const router = express.Router();

/**
 * GET /api/scheduler/status
 * Returns current cron job status and last run timestamp for the user.
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const prefs = await Preferences.findOne({ userId: req.userId });
    const info = getScheduleInfo(req.userId);
    return res.json({
      hasPreferences: Boolean(prefs),
      scheduleTime: prefs ? prefs.scheduleTime : '09:00',
      schedulerEnabled: prefs ? prefs.schedulerEnabled : false,
      lastRunAt: prefs ? prefs.lastRunAt : null,
      ...info,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get scheduler status.' });
  }
});

/**
 * PUT /api/scheduler/time
 * Updates only the daily schedule time & enabled toggle, and restarts the cron task.
 */
router.put('/time', authMiddleware, async (req, res) => {
  try {
    const { scheduleTime, schedulerEnabled = true } = req.body;
    const prefs = await Preferences.findOne({ userId: req.userId });
    if (!prefs) {
      return res.status(400).json({ message: 'Please save your job preferences first.' });
    }

    if (scheduleTime) prefs.scheduleTime = scheduleTime;
    prefs.schedulerEnabled = Boolean(schedulerEnabled);
    await prefs.save();

    const info = scheduleUserJob(prefs);
    return res.json({
      scheduleTime: prefs.scheduleTime,
      schedulerEnabled: prefs.schedulerEnabled,
      ...info,
    });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update schedule time.' });
  }
});

/**
 * POST /api/scheduler/run-now
 * Runs the job matcher immediately for the user (useful for testing without waiting for the cron time).
 */
router.post('/run-now', authMiddleware, async (req, res) => {
  try {
    const prefs = await Preferences.findOne({ userId: req.userId });
    if (!prefs) {
      return res.status(400).json({ message: 'Save your job preferences before running job search.' });
    }

    const result = await runJobSearchForUser(req.userId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to run job search.', error: err.message });
  }
});

module.exports = router;

