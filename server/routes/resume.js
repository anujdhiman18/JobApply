const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const Preferences = require('../models/Preferences');
const authMiddleware = require('../middleware/auth');
const { calculateAtsScore } = require('../services/atsScorer');

const router = express.Router();

// Store uploaded PDF in memory (max 5 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported.'));
    }
  },
});

/**
 * POST /api/resume/upload
 * Extracts text from uploaded PDF, computes ATS score & suggestions, and saves to MongoDB.
 */
router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF resume file.' });
    }

    // Convert to a standalone Uint8Array so pdf-parse's pdf.js reads exact byte boundaries
    const pdfBytes = Uint8Array.from(req.file.buffer);

    const parsed = await pdfParse(pdfBytes);
    const extractedText = (parsed.text || '').trim();
    if (!extractedText) {
      return res.status(400).json({
        message: 'Could not extract readable text from this PDF. Please upload a text-based PDF.',
      });
    }

    const prefs = await Preferences.findOne({ userId: req.userId });
    const targetRole = prefs ? prefs.roleName : '';

    const { atsScore, breakdown, suggestions } = calculateAtsScore(extractedText, targetRole);

    const resume = await Resume.create({
      userId: req.userId,
      fileName: req.file.originalname,
      extractedText,
      atsScore,
      breakdown,
      suggestions,
    });

    return res.status(201).json({
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
        atsScore: resume.atsScore,
        breakdown: resume.breakdown,
        suggestions: resume.suggestions,
        textPreview: resume.extractedText.slice(0, 600),
        createdAt: resume.createdAt,
      },
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Failed to process resume.' });
  }
});

/**
 * GET /api/resume/latest
 * Fetches the user's most recently uploaded resume and ATS report.
 */
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!resume) {
      return res.json({ resume: null });
    }

    return res.json({
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
        atsScore: resume.atsScore,
        breakdown: resume.breakdown,
        suggestions: resume.suggestions,
        textPreview: resume.extractedText.slice(0, 600),
        createdAt: resume.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load resume.' });
  }
});

module.exports = router;

