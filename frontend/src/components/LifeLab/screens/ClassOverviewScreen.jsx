import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

export default function ClassOverviewScreen({ onBack }) {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassOverview();
  }, []);

  const fetchClassOverview = async () => {
    try {
      const response = await fetch('/api/lifelab/class/class_id/overview');
      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
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
          <h1>Class Overview</h1>
          <p>Activity progress</p>
        </div>
      </div>

      <div className="lifelab-content">
        <div className="ll-content-scroll" style={{ padding: '16px 20px' }}>
          {loading ? (
            <div className="ll-loading">Loading...</div>
          ) : overview.length === 0 ? (
            <div className="ll-empty-state">
              <div className="ll-empty-state-icon">📚</div>
              <div className="ll-empty-state-text">No activities assigned yet</div>
            </div>
          ) : (
            overview.map((item, idx) => (
              <div key={idx} className="ll-card">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {item.assignment?.template_id?.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Assigned on {new Date(item.assignment?.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#E0F2FE', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{item.submissions}</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Submitted</div>
                  </div>
                  <div style={{ background: '#FEF3C7', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#B45309' }}>{item.reviewed}</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Reviewed</div>
                  </div>
                  <div style={{ background: '#ECFDF5', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#B45309' }}>{item.pending}</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Pending</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
