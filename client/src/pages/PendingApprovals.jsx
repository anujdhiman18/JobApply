import { useEffect, useState } from 'react';
import { apiRequest } from '../api/api';

export default function PendingApprovals() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPending() {
    setLoading(true);
    try {
      const data = await apiRequest('/api/applications?status=pending');
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleAction(id, action) {
    setBusyId(id);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/api/applications/${id}/${action}`, { method: 'POST' });
      setApplications((prev) => prev.filter((item) => item._id !== id));
      setMessage(
        action === 'approve'
          ? 'Job approved and auto-applied! Recorded in Application History.'
          : 'Job rejected and skipped.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRunSearchNow() {
    setError('');
    setMessage('');
    try {
      const result = await apiRequest('/api/scheduler/run-now', { method: 'POST' });
      setMessage(`Found ${result.matchedCount} match(es), queued ${result.createdCount} new pending job(s).`);
      await loadPending();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="page-title">Pending Approvals</h1>
      <p className="page-subtitle">
        Review matched jobs carefully before JobPilot auto-applies on your behalf.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <div className="card">Loading pending jobs...</div>
      ) : applications.length === 0 ? (
        <div className="card">
          <p style={{ marginTop: 0, color: '#6b7280' }}>
            No pending jobs right now. Wait for your daily schedule or trigger a search now.
          </p>
          <button type="button" className="btn" onClick={handleRunSearchNow}>
            Run Job Search Now
          </button>
        </div>
      ) : (
        applications.map((app) => {
          const job = app.jobId || {};
          const isBusy = busyId === app._id;

          return (
            <div key={app._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>
                    {job.roleName} — {job.companyName}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {job.companyType} | {job.roleType} | {job.location} | {job.experienceRequired}+ yrs exp
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  {job.salaryLpa} LPA
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', margin: '12px 0' }}>
                <strong>Company Info:</strong> {job.companyInfo}
              </p>

              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div>
                  <strong style={{ fontSize: '0.85rem' }}>Requirements</strong>
                  <ul className="tag-list">
                    {(job.requirements || []).map((req, i) => (
                      <li key={i} className="tag">{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ fontSize: '0.85rem' }}>Conditions</strong>
                  <ul className="tag-list">
                    {(job.conditions || []).map((cond, i) => (
                      <li key={i} className="tag">{cond}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {app.matchReason && (
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 14 }}>
                  <strong>Match Reason:</strong> {app.matchReason}
                </div>
              )}

              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={isBusy}
                  onClick={() => handleAction(app._id, 'approve')}
                >
                  {isBusy ? 'Processing...' : 'Approve & Auto-Apply'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={isBusy}
                  onClick={() => handleAction(app._id, 'reject')}
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

