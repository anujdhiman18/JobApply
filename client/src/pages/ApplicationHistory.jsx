import { useEffect, useState } from 'react';
import { apiRequest } from '../api/api';

const FILTERS = ['all', 'applied', 'pending', 'rejected'];

export default function ApplicationHistory() {
  const [filter, setFilter] = useState('all');
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, applied: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const query = filter === 'all' ? '' : `?status=${filter}`;
        const data = await apiRequest(`/api/applications${query}`);
        setApplications(data.applications || []);
        setSummary(data.summary || { total: 0, pending: 0, applied: 0, rejected: 0 });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [filter]);

  return (
    <div>
      <h1 className="page-title">Application History</h1>
      <p className="page-subtitle">
        Full report of Applied ({summary.applied}), Pending ({summary.pending}), and Rejected ({summary.rejected}) jobs.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="btn-row" style={{ marginBottom: 14 }}>
        {FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            className={`btn ${filter === status ? '' : 'btn-outline'}`}
            onClick={() => setFilter(status)}
            style={{ textTransform: 'capitalize' }}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 20 }}>Loading history...</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: 20, color: '#6b7280' }}>No applications found for this filter.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const job = app.jobId || {};
                  return (
                    <tr key={app._id}>
                      <td>
                        <strong>{job.companyName}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                          {job.companyType} | {job.location}
                        </div>
                      </td>
                      <td>{job.roleName}</td>
                      <td>{job.salaryLpa} LPA</td>
                      <td>
                        <span className={`badge badge-${app.status}`}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                        {new Date(app.appliedAt || app.updatedAt).toLocaleString()}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#374151' }}>
                        {app.notes || app.matchReason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

