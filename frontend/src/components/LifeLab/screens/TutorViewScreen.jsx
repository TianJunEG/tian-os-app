import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

export default function TutorViewScreen({ onBack }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/lifelab/assignments?role=tutor');
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      assigned: { bg: '#EEF2FA', color: '#13315C', label: 'Assigned', icon: '📋' },
      in_progress: { bg: '#EEF2FA', color: '#13315C', label: 'In Progress', icon: '⏳' },
      submitted: { bg: '#FBEEDD', color: '#B86B1A', label: 'Submitted', icon: '✅' },
      reviewed: { bg: '#E7F3EC', color: '#2E7A5A', label: 'Reviewed', icon: '⭐' },
    };
    const s = statusMap[status] || statusMap.assigned;
    return s;
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

      <div className="nav-bar">
        <button className="nav-bar-btn" onClick={onBack}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div className="nav-bar-title">
          <h1>Tutor Dashboard</h1>
          <p>Manage student assignments</p>
        </div>
      </div>

      <div className="lifelab-content">
        <div className="content-scroll" style={{ padding: '16px 20px' }}>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-text">No assignments yet</div>
            </div>
          ) : (
            assignments.map((assignment) => {
              const statusInfo = getStatusBadge(assignment.status);
              return (
                <div key={assignment._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3F' }}>
                        {assignment.template_id?.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7A95', marginTop: 4 }}>
                        To: {assignment.assigned_to_student_id?.name || 'Class Group'}
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
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  {assignment.due_date && (
                    <div style={{ fontSize: 12, color: '#6B7A95', marginBottom: 8 }}>
                      <Icon name="calendar" size={14} style={{ marginRight: 4 }} />
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'white',
                      border: '1px solid #E8EBF1',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#0B1F3F',
                      cursor: 'pointer',
                    }}>
                      View
                    </button>
                    {assignment.status === 'submitted' && (
                      <button style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#C8A042',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'white',
                        cursor: 'pointer',
                      }}>
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

      <div className="bottom-nav">
        {['home', 'library', 'submit', 'inbox', 'me'].map((item) => (
          <div key={item} className={`bottom-nav-item ${item === 'inbox' ? 'active' : ''}`}>
            <Icon name={item === 'submit' ? 'sparkle' : item} size={22} />
            <span style={{ textTransform: 'capitalize', fontSize: 10 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
