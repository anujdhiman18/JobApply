const express = require('express');
const Preferences = require('../models/Preferences');
const authMiddleware = require('../middleware/auth');
const { scheduleUserJob, getScheduleInfo } = require('../services/schedulerService');

const router = express.Router();

/**
 * GET /api/preferences
 * Returns saved job preferences + daily schedule settings for the logged-in user.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const preferences = await Preferences.findOne({ userId: req.userId });
    const scheduleInfo = getScheduleInfo(req.userId);
    return res.json({ preferences, scheduleInfo });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch preferences.' });
  }
});

/**
 * PUT /api/preferences
 * Saves/updates job preferences and refreshes the user's daily node-cron job.
 */
router.put('/', authMiddleware, async (req, res) => {
  try {
    const {
      companyType = 'any',
      roleType = 'tech',
      roleName,
      experienceYears = 0,
      expectedLpa = 0,
      location = '',
      extraNotes = '',
      scheduleTime = '09:00',
      schedulerEnabled = true,
    } = req.body;

    if (!roleName || !roleName.trim()) {
      return res.status(400).json({ message: 'Role name is required.' });
    }

    const preferences = await Preferences.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          userId: req.userId,
          companyType,
          roleType,
          roleName: roleName.trim(),
          experienceYears: Number(experienceYears) || 0,
          expectedLpa: Number(expectedLpa) || 0,
          location: location.trim(),
          extraNotes: extraNotes.trim(),
          scheduleTime,
          schedulerEnabled: Boolean(schedulerEnabled),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    const scheduleInfo = scheduleUserJob(preferences);
    return res.json({ preferences, scheduleInfo });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Failed to save preferences.' });
  }
});

module.exports = router;

