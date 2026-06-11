import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

export default function TutorViewScreen({ onBack, onNavigate }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/lifelab/assignments?role=tutor', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      assigned: { bg: '#EEF2FA', color: '#13315C', label: 'Assigned' },
      in_progress: { bg: '#EEF2FA', color: '#13315C', label: 'In Progress' },
      submitted: { bg: '#FBEEDD', color: '#B86B1A', label: 'Submitted' },
      reviewed: { bg: '#E7F3EC', color: '#2E7A5A', label: 'Reviewed' },
    };
    return statusMap[status] || statusMap.assigned;
  };

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
          <h1>Tutor Dashboard</h1>
          <p>Manage student activities</p>
        </div>
      </div>

      <div className="lifelab-content">
        <div className="ll-content-scroll" style={{ padding: '16px 20px' }}>
          {loading ? (
            <div className="ll-loading">Loading...</div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EEF2FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="compass" size={32} color="#13315C" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3F', marginBottom: 8 }}>No Activities Assigned Yet</div>
              <div style={{ fontSize: 13, color: '#6B7A95', lineHeight: 1.6, marginBottom: 28 }}>
                Assign a LifeLab activity from the library to get started. Students will appear here once an activity is set.
              </div>
              <button className="ll-btn ll-btn-primary" style={{ width: '100%' }} onClick={onBack}>
                Browse Library
              </button>
            </div>
          ) : (
            assignments.map((assignment) => {
              const statusInfo = getStatusBadge(assignment.status);
              return (
                <div key={assignment._id} className="ll-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3F' }}>
                        {assignment.template_id?.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7A95', marginTop: 4 }}>
                        To: {assignment.student_name || 'Student'}
                      </div>
                      <div style={{ fontSize: 11, color: '#A7B1C2', marginTop: 2 }}>
                        {assignment.template_id?.subject} • {assignment.template_id?.duration}
                      </div>
                    </div>
                    <span style={{
                      background: statusInfo.bg,
                      color: statusInfo.color,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {assignment.due_date && (
                    <div style={{ fontSize: 12, color: '#6B7A95', marginBottom: 8 }}>
                      Due: {new Date(assignment.due_date).toLocaleDateString('en-SG')}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="ll-btn ll-btn-secondary ll-btn-sm" style={{ flex: 1 }}>
                      View
                    </button>
                    {assignment.status === 'submitted' && (
                      <button className="ll-btn ll-btn-primary ll-btn-sm" style={{ flex: 1, background: '#C8A042' }}>
                        Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="ll-bottom-nav">
        {[
          { id: 'home',    label: 'Home',    icon: 'home',    action: onBack },
          { id: 'library', label: 'Library', icon: 'compass', action: onBack },
          { id: 'submit',  label: 'Submit',  icon: 'sparkle', action: () => onNavigate?.('submission') },
          { id: 'inbox',   label: 'Inbox',   icon: 'chat',    action: () => onNavigate?.('review') },
          { id: 'me',      label: 'Me',      icon: 'user',    action: null },
        ].map(({ id, label, icon, action }) => (
          <button
            key={id}
            className={`ll-bottom-nav-item ${id === 'me' ? 'active' : ''}`}
            onClick={action || undefined}
            style={{ background: 'none', border: 'none', cursor: action ? 'pointer' : 'default' }}
          >
            <Icon name={icon} size={22} />
            <span style={{ textTransform: 'capitalize' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
