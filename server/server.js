require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { syncMockJobs } = require('./services/jobMatcher');
const { initAllSchedules } = require('./services/schedulerService');

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const preferencesRoutes = require('./routes/preferences');
const schedulerRoutes = require('./routes/scheduler');
const applicationRoutes = require('./routes/applications');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'JobPilot' });
});

app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/applications', applicationRoutes);

// Global error handler (including multer upload errors)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ message: err.message || 'Unexpected server error.' });
});

const PORT = process.env.PORT || 5001;

async function startServer() {
  await connectDB();
  await syncMockJobs();
  await initAllSchedules();

  app.listen(PORT, () => {
    console.log(`JobPilot backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
