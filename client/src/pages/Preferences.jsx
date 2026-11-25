import { useEffect, useState } from 'react';
import { apiRequest } from '../api/api';

const INITIAL_FORM = {
  companyType: 'any',
  roleType: 'tech',
  roleName: '',
  experienceYears: 1,
  expectedLpa: 10,
  location: '',
  extraNotes: '',
  scheduleTime: '09:00',
  schedulerEnabled: true,
};

export default function Preferences() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    apiRequest('/api/preferences')
      .then((data) => {
        if (data.preferences) {
          setForm({
            companyType: data.preferences.companyType || 'any',
            roleType: data.preferences.roleType || 'tech',
            roleName: data.preferences.roleName || '',
            experienceYears: data.preferences.experienceYears ?? 0,
            expectedLpa: data.preferences.expectedLpa ?? 0,
            location: data.preferences.location || '',
            extraNotes: data.preferences.extraNotes || '',
            scheduleTime: data.preferences.scheduleTime || '09:00',
            schedulerEnabled: data.preferences.schedulerEnabled ?? true,
          });
        }
        setScheduleInfo(data.scheduleInfo);
      })
      .catch((err) => setError(err.message));
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const data = await apiRequest('/api/preferences', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setScheduleInfo(data.scheduleInfo);
      setSuccess('Preferences saved and daily scheduler updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Job Preferences & Scheduler</h1>
      <p className="page-subtitle">Define your target roles and pick a daily time for JobPilot to find matching jobs.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="companyType">Company Type</label>
              <select
                id="companyType"
                value={form.companyType}
                onChange={(e) => updateField('companyType', e.target.value)}
              >
                <option value="any">Any</option>
                <option value="startup">Startup</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="MNC">MNC</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="roleType">Role Type</label>
              <select
                id="roleType"
                value={form.roleType}
                onChange={(e) => updateField('roleType', e.target.value)}
              >
                <option value="tech">Tech</option>
                <option value="non-tech">Non-Tech</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="roleName">Role Name</label>
              <input
                id="roleName"
                type="text"
                value={form.roleName}
                onChange={(e) => updateField('roleName', e.target.value)}
                required
                placeholder="e.g. Full Stack Developer, Product Manager"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Preferred Location</label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="e.g. Bangalore, Remote, Any"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="experienceYears">Experience (Years)</label>
              <input
                id="experienceYears"
                type="number"
                min="0"
                step="0.5"
                value={form.experienceYears}
                onChange={(e) => updateField('experienceYears', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedLpa">Expected Salary (LPA)</label>
              <input
                id="expectedLpa"
                type="number"
                min="0"
                step="0.5"
                value={form.expectedLpa}
                onChange={(e) => updateField('expectedLpa', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="extraNotes">Extra Notes</label>
            <textarea
              id="extraNotes"
              value={form.extraNotes}
              onChange={(e) => updateField('extraNotes', e.target.value)}
              placeholder="Notice period, preferred stack, shift constraints, etc."
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '18px 0' }} />

          <div className="grid-2" style={{ alignItems: 'center' }}>
            <div className="form-group">
              <label htmlFor="scheduleTime">Daily Search Time (24h)</label>
              <input
                id="scheduleTime"
                type="time"
                value={form.scheduleTime}
                onChange={(e) => updateField('scheduleTime', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.schedulerEnabled}
                  onChange={(e) => updateField('schedulerEnabled', e.target.checked)}
                />
                Enable daily automated job search
              </label>
              {scheduleInfo?.isScheduled && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                  Active cron schedule: <code>{scheduleInfo.cronExpression}</code>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
}

