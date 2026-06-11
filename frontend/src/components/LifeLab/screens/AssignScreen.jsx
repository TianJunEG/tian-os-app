import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Icon from '../Icon';

export default function AssignScreen({ template, onBack }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    student_name: '',
    difficulty: 'medium',
    due_date: '',
    custom_instructions: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!template) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_name.trim()) {
      setError('Please enter the student name.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/lifelab/assign/${template._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          difficulty: formData.difficulty,
          due_date: formData.due_date || undefined,
          custom_instructions: formData.custom_instructions || undefined,
          assigned_by_user_id: user?._id || user?.id,
          student_name: formData.student_name,
        }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to assign activity.');
      }
    } catch (err) {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="lifelab-phone">
        <div className="status-bar">
          <span>9:41</span>
          <div className="status-bar-right">
            <Icon name="signal" size={14} />
            <Icon name="wifi" size={14} />
          </div>
        </div>
        <div className="lifelab-content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E7F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="check_circle" size={32} color="#2E7A5A" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3F', marginBottom: 8 }}>Activity Assigned!</div>
          <div style={{ fontSize: 13, color: '#6B7A95', lineHeight: 1.6, marginBottom: 28 }}>
            <strong>{template.title}</strong> has been assigned to <strong>{formData.student_name}</strong>.
          </div>
          <button className="ll-btn ll-btn-primary" style={{ width: '100%' }} onClick={onBack}>
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lifelab-phone">
      <div className="status-bar">
        <span>9:41</span>
        <div className="status-bar-right">
          <Icon name="signal" size={14} />
          <Icon name="wifi" size={14} />
        </div>
      </div>

      <div className="ll-nav-bar">
        <button className="ll-nav-btn" onClick={onBack}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div className="ll-nav-bar-title">
          <h1>Assign Activity</h1>
          <p>{template.title}</p>
        </div>
      </div>

      <div className="lifelab-content">
        <form className="ll-content-scroll" style={{ padding: '16px 20px 24px' }} onSubmit={handleSubmit}>

          <div className="ll-input-field">
            <label className="ll-input-label">Student Name</label>
            <input
              type="text"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              className="ll-input-control"
              placeholder="e.g. Wei Jie"
              required
            />
          </div>

          <div className="ll-input-field">
            <label className="ll-input-label">Difficulty Level</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="ll-input-control"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="ll-input-field">
            <label className="ll-input-label">Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="ll-input-control"
            />
          </div>

          <div className="ll-input-field">
            <label className="ll-input-label">Custom Instructions (Optional)</label>
            <textarea
              name="custom_instructions"
              value={formData.custom_instructions}
              onChange={handleChange}
              className="ll-input-control"
              placeholder="Add any special instructions or modifications for this assignment..."
            />
          </div>

          {error && (
            <div style={{ background: '#FEF0EE', border: '1px solid #F5C5C0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#B04030', marginBottom: 8 }}>
              {error}
            </div>
          )}

          <div style={{ background: '#EEF2FA', padding: 12, borderRadius: 10, marginTop: 8, fontSize: 12, color: '#13315C', lineHeight: 1.5 }}>
            <strong>Assignment Summary:</strong>
            <div style={{ marginTop: 6 }}>
              • Activity: {template.title}<br />
              • Subject: {template.subject}<br />
              • Duration: {template.duration}<br />
              • Difficulty: {formData.difficulty}
              {formData.due_date && <><br />• Due: {new Date(formData.due_date).toLocaleDateString('en-SG')}</>}
              {formData.student_name && <><br />• Student: {formData.student_name}</>}
              {user?.name && <><br />• Assigned by: {user.name}</>}
            </div>
          </div>
        </form>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F3F8', background: '#fff', display: 'flex', gap: 8 }}>
          <button type="button" className="ll-btn ll-btn-secondary" style={{ width: 'auto', paddingLeft: 16, paddingRight: 16 }} onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="ll-btn ll-btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Assigning…' : 'Assign Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
