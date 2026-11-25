import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/api';

export default function Dashboard() {
  const [summary, setSummary] = useState({ total: 0, pending: 0, applied: 0, rejected: 0 });
  const [resume, setResume] = useState(null);
  const [scheduler, setScheduler] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  async function loadDashboard() {
    try {
      const [appsRes, resumeRes, schedRes] = await Promise.all([
        apiRequest('/api/applications'),
        apiRequest('/api/resume/latest'),
        apiRequest('/api/scheduler/status'),
      ]);
      setSummary(appsRes.summary);
      setResume(resumeRes.resume);
      setScheduler(schedRes);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleRunNow() {
    setError('');
    setMessage('');
    setRunning(true);
    try {
      const result = await apiRequest('/api/scheduler/run-now', { method: 'POST' });
      setMessage(
        `Search completed: ${result.matchedCount} matching job(s) found, ${result.createdCount} new pending approval(s) queued.`
      );
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of your ATS score, daily job bot, and application pipeline.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="grid-4">
        <div className="card">
          <div className="stat-label">Applied</div>
          <div className="stat-value" style={{ color: '#065f46' }}>{summary.applied}</div>
        </div>
        <div className="card">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value" style={{ color: '#92400e' }}>{summary.pending}</div>
        </div>
        <div className="card">
          <div className="stat-label">Rejected</div>
          <div className="stat-value" style={{ color: '#991b1b' }}>{summary.rejected}</div>
        </div>
        <div className="card">
          <div className="stat-label">ATS Score</div>
          <div className="stat-value">{resume ? `${resume.atsScore}/100` : '--'}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Daily Job Scheduler</h3>
          {scheduler?.hasPreferences ? (
            <div style={{ fontSize: '0.9rem', marginBottom: 14 }}>
              <div>
                <strong>Status:</strong>{' '}
                {scheduler.schedulerEnabled ? 'Active' : 'Paused'}
              </div>
              <div>
                <strong>Daily Run Time:</strong> {scheduler.scheduleTime}
              </div>
              <div>
                <strong>Cron Schedule:</strong> <code>{scheduler.cronExpression || 'Not scheduled'}</code>
              </div>
              <div>
                <strong>Last Run:</strong>{' '}
                {scheduler.lastRunAt ? new Date(scheduler.lastRunAt).toLocaleString() : 'Never'}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Set your job preferences first so the scheduler knows what jobs to match.
            </p>
          )}

          <div className="btn-row">
            <button
              type="button"
              className="btn"
              onClick={handleRunNow}
              disabled={running || !scheduler?.hasPreferences}
            >
              {running ? 'Searching...' : 'Run Job Search Now'}
            </button>
            <Link to="/preferences" className="btn btn-outline">
              Edit Preferences
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: 0 }}>
            JobPilot never submits applications without your approval. Review pending matches before auto-apply runs.
          </p>
          <div className="btn-row">
            <Link to="/resume" className="btn btn-outline">
              {resume ? 'Update Resume' : 'Upload Resume'}
            </Link>
            <Link to="/approvals" className="btn">
              Review Pending ({summary.pending})
            </Link>
            <Link to="/history" className="btn btn-outline">
              View History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

