require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { syncMockJobs } = require('./services/jobMatcher');

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const preferencesRoutes = require('./routes/preferences');
const schedulerRoutes = require('./routes/scheduler');
const applicationRoutes = require('./routes/applications');

const app = express();

// ─── CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow: no-origin (mobile/curl), localhost dev, any *.vercel.app URL
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.includes('vercel.app')
      ) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'JobPilot' }));
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/applications', applicationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ message: err.message || 'Unexpected server error.' });
});

// ─── DB connection (lazy, cached across warm serverless invocations) ─────────
let dbReady = false;
async function ensureDB() {
  if (!dbReady) {
    await connectDB();
    await syncMockJobs();
    dbReady = true;
  }
}

// ─── Vercel serverless export ────────────────────────────────────────────────
// Vercel calls module.exports(req, res) for each request.
module.exports = async (req, res) => {
  await ensureDB();
  return app(req, res);
};

// ─── Local dev: start HTTP server ───────────────────────────────────────────
if (require.main === module) {
  const { initAllSchedules } = require('./services/schedulerService');
  ensureDB()
    .then(() => initAllSchedules())
    .then(() => {
      const PORT = process.env.PORT || 5001;
      app.listen(PORT, () =>
        console.log(`JobPilot backend running on http://localhost:${PORT}`)
      );
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
