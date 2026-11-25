import { useEffect, useState } from 'react';
import { apiRequest } from '../api/api';

export default function UploadResume() {
  const [file, setFile] = useState(null);
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    apiRequest('/api/resume/latest')
      .then((data) => setResume(data.resume))
      .catch((err) => setError(err.message));
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const data = await apiRequest('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });
      setResume(data.resume);
      setSuccess('Resume uploaded and analyzed.');
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Upload Resume</h1>
      <p className="page-subtitle">Upload your PDF resume to extract text and calculate your ATS score.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label htmlFor="resume-file">Resume PDF (max 5 MB)</label>
            <input
              id="resume-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button type="submit" className="btn" disabled={uploading}>
            {uploading ? 'Analyzing...' : 'Upload & Calculate ATS Score'}
          </button>
        </form>
      </div>

      {resume && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: '0 0 4px' }}>{resume.fileName}</h3>
              <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                Uploaded {new Date(resume.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="stat-label">ATS Score</div>
              <div className="stat-value">{resume.atsScore} / 100</div>
            </div>
          </div>

          <div className="grid-4" style={{ marginTop: 16 }}>
            <div className="card" style={{ marginBottom: 0, padding: 12 }}>
              <div className="stat-label">Keywords</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{resume.breakdown?.keywords ?? 0} / 25</div>
            </div>
            <div className="card" style={{ marginBottom: 0, padding: 12 }}>
              <div className="stat-label">Sections</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{resume.breakdown?.sections ?? 0} / 25</div>
            </div>
            <div className="card" style={{ marginBottom: 0, padding: 12 }}>
              <div className="stat-label">Formatting</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{resume.breakdown?.formatting ?? 0} / 25</div>
            </div>
            <div className="card" style={{ marginBottom: 0, padding: 12 }}>
              <div className="stat-label">Length & Impact</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{resume.breakdown?.length ?? 0} / 25</div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <h4 style={{ marginBottom: 8 }}>Suggestions to Improve</h4>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {resume.suggestions.map((tip, index) => (
                <li key={index} style={{ marginBottom: 6, fontSize: '0.9rem' }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {resume.textPreview && (
            <div style={{ marginTop: 18 }}>
              <h4 style={{ marginBottom: 8 }}>Extracted Text Preview</h4>
              <div className="text-preview">{resume.textPreview}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

