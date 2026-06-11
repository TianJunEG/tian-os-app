import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

export default function ParentViewScreen({ onBack, onNavigate }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/lifelab/assignments?role=parent', {
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
      assigned: { bg: '#E0F2FE', color: '#064E3B', label: 'Assigned' },
      submitted: { bg: '#FEF3C7', color: '#B45309', label: 'Submitted' },
      reviewed: { bg: '#D1FAE5', color: '#059669', label: 'Reviewed' },
    };
    return statusMap[status] || statusMap.assigned;
  };

  return (
    <>
      <div className="ll-nav-bar">
        <button className="ll-nav-btn" onClick={onBack}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div className="ll-nav-bar-title">
          <h1>Your Child's Activities</h1>
          <p>Monitor progress</p>
        </div>
      </div>

      <div className="ll-content">
        <div className="ll-content-scroll" style={{ padding: '16px 20px' }}>
          {loading ? (
            <div className="ll-loading">Loading...</div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="home" size={32} color="#F59E0B" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No Activities Yet</div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                When your child's teacher assigns a LifeLab activity, you'll be able to track their progress here.
              </div>
            </div>
          ) : (
            assignments.map((assignment) => {
              const statusInfo = getStatusBadge(assignment.status);
              return (
                <div key={assignment._id} className="ll-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {assignment.template_id?.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
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
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                      Due: {new Date(assignment.due_date).toLocaleDateString('en-SG')}
                    </div>
                  )}

                  <div style={{ background: '#ECFDF5', padding: 8, borderRadius: 8, fontSize: 12, color: '#0F172A' }}>
                    {assignment.custom_instructions || 'Complete all data collection and reflection questions.'}
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
    </>
  );
}
