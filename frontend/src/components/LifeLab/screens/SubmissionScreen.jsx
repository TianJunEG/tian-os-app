import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

export default function SubmissionScreen({ assignment, onBack }) {
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment?.template_id) {
      fetchTemplate(assignment.template_id);
    }
  }, [assignment]);

  const fetchTemplate = async (templateId) => {
    try {
      const response = await fetch(`/api/lifelab/templates/${templateId}`);
      const data = await response.json();
      setTemplate(data);
      initializeForm(data);
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const initializeForm = (tmpl) => {
    const initial = {};
    tmpl.data_fields?.forEach((field) => {
      initial[field.name] = '';
    });
    tmpl.reflection_questions?.forEach((q) => {
      initial[`reflection_${q.id}`] = '';
    });
    setFormData(initial);
  };

  const handleDataChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      if (photoFile) {
        formDataObj.append('photo', photoFile);
      }

      const dataResponse = {};
      const reflectionResponse = {};

      Object.entries(formData).forEach(([key, value]) => {
        if (key.startsWith('reflection_')) {
          reflectionResponse[key] = value;
        } else {
          dataResponse[key] = value;
        }
      });

      formDataObj.append('student_id', 'current_student_id');
      formDataObj.append('data_response', JSON.stringify(dataResponse));
      formDataObj.append('reflection_response', JSON.stringify(reflectionResponse));

      const response = await fetch(`/api/lifelab/submission/${assignment._id}`, {
        method: 'POST',
        body: formDataObj,
      });

      if (response.ok) {
        alert('Submission saved successfully!');
        onBack();
      }
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!assignment) {
    return (
      <div className="lifelab-phone">
        <div className="status-bar">
          <span>9:41</span>
          <div className="status-bar-right">
            <Icon name="signal" size={14} />
            <Icon name="wifi" size={14} />
          </div>
        </div>
        <div className="nav-bar">
          <button className="nav-bar-btn" onClick={onBack}>
            <Icon name="arrow_left" size={20} />
          </button>
          <div className="nav-bar-title"><h1>My Submissions</h1></div>
        </div>
        <div className="lifelab-content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EEF2FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="sparkle" size={32} color="#13315C" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3F', marginBottom: 8 }}>No Pending Activities</div>
          <div style={{ fontSize: 13, color: '#6B7A95', lineHeight: 1.6, marginBottom: 28 }}>
            When your teacher assigns a LifeLab activity, it will appear here for you to complete.
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onBack}>
            Browse Library
          </button>
        </div>
      </div>
    );
  }

  if (!template) return <div className="loading">Loading...</div>;

  return (
    <div className="lifelab-phone">
      <div className="status-bar">
        <span>9:41</span>
        <div className="status-bar-right">
          <Icon name="signal" size={14} />
          <Icon name="wifi" size={14} />
        </div>
      </div>

      <div className="nav-bar">
        <button className="nav-bar-btn" onClick={onBack}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div className="nav-bar-title">
          <h1>Submit Response</h1>
          <p>{template.title}</p>
        </div>
      </div>

      <div className="lifelab-content">
        <form className="content-scroll" style={{ padding: '16px 20px' }} onSubmit={handleSubmit}>
          {/* Data collection section */}
          {template.data_fields?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3F', marginBottom: 12 }}>
                Data Collection
              </div>
              {template.data_fields.map((field) => (
                <div key={field.name} className="input-field">
                  <label className="input-label">
                    {field.label}
                    {field.unit && <span style={{ color: '#A7B1C2', fontWeight: 400 }}> ({field.unit})</span>}
                    {field.required && <span style={{ color: '#B86B1A' }}> *</span>}
                  </label>
                  {field.type === 'number' ? (
                    <input
                      type="number"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleDataChange(field.name, e.target.value)}
                      className="input-control"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleDataChange(field.name, e.target.value)}
                      className="input-control"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Photo upload */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Photo Evidence (Optional)</label>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 20,
              border: '2px dashed #C8A042',
              borderRadius: 10,
              cursor: 'pointer',
              background: '#FAF7EE',
            }}>
              <Icon name="camera" size={32} color="#C8A042" />
              <span style={{ marginTop: 8, fontSize: 13, color: '#0B1F3F', fontWeight: 600 }}>
                {photoFile ? photoFile.name : 'Upload photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Reflection questions */}
          {template.reflection_questions?.length > 0 && (
            <div style={{ marginBottom: 80 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3F', marginBottom: 12 }}>
                Reflection
              </div>
              {template.reflection_questions.map((q) => (
                <div key={q.id} className="input-field">
                  <label className="input-label">{q.question}</label>
                  <textarea
                    value={formData[`reflection_${q.id}`] || ''}
                    onChange={(e) => handleDataChange(`reflection_${q.id}`, e.target.value)}
                    className="input-control"
                    placeholder="Write your response..."
                  />
                </div>
              ))}
            </div>
          )}
        </form>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F3F8', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onBack}>Save Draft</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      </div>
    </div>
  );
}
