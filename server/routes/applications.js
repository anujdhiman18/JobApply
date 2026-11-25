const express = require('express');
const Application = require('../models/Application');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/applications
 * Lists applications for the current user (optionally filtered by ?status=)
 * along with aggregate counts for Dashboard summary cards.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.userId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('jobId')
      .sort({ createdAt: -1 });

    // Compute aggregate status counts for the user
    const allApps = await Application.find({ userId: req.userId }).select('status');
    const summary = {
      total: allApps.length,
      pending: 0,
      applied: 0,
      rejected: 0,
    };
    for (const app of allApps) {
      if (app.status === 'pending') summary.pending += 1;
      else if (app.status === 'applied' || app.status === 'approved') summary.applied += 1;
      else if (app.status === 'rejected') summary.rejected += 1;
    }

    return res.json({ applications, summary });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch applications.' });
  }
});

/**
 * POST /api/applications/:id/approve
 * Approves a pending job and runs the simulated auto-apply bot, saving status as "applied".
 */
router.post('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('jobId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ message: `Application is already ${application.status}.` });
    }

    // Step 1: Mark approved by user
    application.status = 'approved';
    await application.save();

    // Step 2: Simulate auto-apply submission and persist final "applied" status
    application.status = 'applied';
    application.appliedAt = new Date();
    application.notes = `Auto-applied by JobPilot bot to ${application.jobId?.companyName || 'company'} (simulated).`;
    await application.save();

    return res.json({ application });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to approve and apply.' });
  }
});

/**
 * POST /api/applications/:id/reject
 * Rejects a pending job so the auto-apply bot never applies to it.
 */
router.post('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('jobId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ message: `Application is already ${application.status}.` });
    }

    application.status = 'rejected';
    application.notes = req.body?.notes || 'Rejected by user during review.';
    await application.save();

    return res.json({ application });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reject application.' });
  }
});

module.exports = router;

