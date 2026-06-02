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

      <div className="nav-bar">
        <button className="nav-bar-btn" onClick={onBack}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div className="nav-bar-title">
          <h1>Class Overview</h1>
          <p>Activity progress</p>
        </div>
      </div>

      <div className="lifelab-content">
        <div className="content-scroll" style={{ padding: '16px 20px' }}>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : overview.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-text">No activities assigned yet</div>
            </div>
          ) : (
            overview.map((item, idx) => (
              <div key={idx} className="card">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3F' }}>
                    {item.assignment?.template_id?.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7A95', marginTop: 2 }}>
                    Assigned on {new Date(item.assignment?.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#EEF2FA', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0B2545' }}>{item.submissions}</div>
                    <div style={{ fontSize: 10, color: '#6B7A95' }}>Submitted</div>
                  </div>
                  <div style={{ background: '#FBEEDD', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#B86B1A' }}>{item.reviewed}</div>
                    <div style={{ fontSize: 10, color: '#6B7A95' }}>Reviewed</div>
                  </div>
                  <div style={{ background: '#FAF7EE', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#9A7A23' }}>{item.pending}</div>
                    <div style={{ fontSize: 10, color: '#6B7A95' }}>Pending</div>
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
