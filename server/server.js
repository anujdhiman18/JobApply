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

// Allow requests from any Vercel preview URL and production URL
const allowedOrigins = [
  'https://jobapply-flax.vercel.app',
  /https:\/\/jobapply.*\.vercel\.app$/,
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
    },
    credentials: true,
  })
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'JobPilot' });
});

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

// ─── Startup ────────────────────────────────────────────────────────────────
// On Vercel (serverless) we cannot call app.listen() – the platform calls the
// exported handler directly for each request.  We still need to connect to
// MongoDB on first invocation, so we do it lazily via the connectDB helper.
//
// When running locally (node server.js / npm run dev) we still start the
// HTTP server so the development workflow is unchanged.

let dbReady = false;

async function ensureDB() {
  if (!dbReady) {
    await connectDB();
    await syncMockJobs();
    dbReady = true;
  }
}

// Vercel serverless entry-point
module.exports = async (req, res) => {
  await ensureDB();
  app(req, res);
};

// Local development entry-point
if (require.main === module) {
  // Only import the cron scheduler in long-running server mode.
  // node-cron does NOT work on serverless (each request = new process).
  const { initAllSchedules } = require('./services/schedulerService');

  ensureDB()
    .then(() => initAllSchedules())
    .then(() => {
      const PORT = process.env.PORT || 5001;
      app.listen(PORT, () => {
        console.log(`JobPilot backend running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
