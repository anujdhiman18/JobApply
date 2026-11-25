const mongoose = require('mongoose');

/**
 * Stores uploaded PDF resume text, ATS score breakdown, and improvement tips.
 */
const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    breakdown: {
      keywords: { type: Number, default: 0 },
      sections: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 },
      length: { type: Number, default: 0 },
    },
    suggestions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);

