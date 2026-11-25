const mongoose = require('mongoose');

/**
 * Job listing model populated from mock/external job sources.
 */
const jobSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      unique: true,
      sparse: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyInfo: {
      type: String,
      required: true,
    },
    companyType: {
      type: String,
      enum: ['startup', 'product', 'service', 'MNC'],
      required: true,
    },
    roleType: {
      type: String,
      enum: ['tech', 'non-tech'],
      required: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    experienceRequired: {
      type: Number,
      default: 0,
    },
    salaryLpa: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    conditions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);

