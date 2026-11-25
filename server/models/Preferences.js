const mongoose = require('mongoose');

/**
 * Stores a user's target job preferences and daily scheduler time.
 */
const preferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyType: {
      type: String,
      enum: ['startup', 'product', 'service', 'MNC', 'any'],
      default: 'any',
    },
    roleType: {
      type: String,
      enum: ['tech', 'non-tech'],
      default: 'tech',
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    expectedLpa: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    extraNotes: {
      type: String,
      default: '',
      trim: true,
    },
    // Daily run time in 24-hour "HH:MM" format (e.g. "09:00")
    scheduleTime: {
      type: String,
      default: '09:00',
    },
    schedulerEnabled: {
      type: Boolean,
      default: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Preferences', preferencesSchema);

