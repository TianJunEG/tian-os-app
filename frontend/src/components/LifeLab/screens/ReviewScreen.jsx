import React, { useState } from 'react';
import Icon from '../Icon';

export default function ReviewScreen({ submission, onBack }) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!submission) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/lifelab/submission/${submission._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          feedback_text: feedback,
        }),
      });

      if (response.ok) {
        onBack();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!submission) {
    return (
      <>
        <div className="ll-nav-bar">
          <button className="ll-nav-btn" onClick={onBack}>
            <Icon name="arrow_left" size={20} />
          </button>
          <div className="ll-nav-bar-title"><h1>Inbox</h1></div>
        </div>
        <div className="ll-content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E7F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="chat" size={32} color="#2E7A5A" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3F', marginBottom: 8 }}>All Caught Up</div>
          <div style={{ fontSize: 13, color: '#6B7A95', lineHeight: 1.6, marginBottom: 28 }}>
            Student submissions that need your review will appear here.
          </div>
          <button className="ll-btn ll-btn-primary" style={{ width: '100%' }} onClick={onBack}>
            Back to Library
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ll-nav-bar">
        <button className="ll-nav-btn" onClick={onBack}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div className="ll-nav-bar-title">
          <h1>Review Submission</h1>
        </div>
      </div>

      <div className="ll-content">
        <div className="ll-content-scroll" style={{ padding: '16px 20px' }}>
          <div style={{ background: '#E6EEF7', padding: 12, borderRadius: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#13315C', marginBottom: 8 }}>
              Student Response
            </div>
            <div style={{ fontSize: 13, color: '#13315C', lineHeight: 1.6 }}>
              <p>Data collected and reflection questions answered.</p>
              <p>Photo evidence: Provided ✓</p>
            </div>
          </div>

          <form onSubmit={handleSubmitReview}>
            <div className="ll-input-field">
              <label className="ll-input-label">Your Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="ll-input-control"
                placeholder="Provide constructive feedback on the student's response..."
                rows={6}
              />
            </div>

            <div style={{ background: '#E7F3EC', padding: 12, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2E7A5A', marginBottom: 8 }}>
                AI Generated Insights
              </div>
              <div style={{ fontSize: 12, color: '#2E7A5A', lineHeight: 1.6 }}>
                <div><strong>Summary:</strong> Student showed good understanding of core concepts.</div>
                <div style={{ marginTop: 8 }}><strong>Misconceptions:</strong> None detected</div>
                <div style={{ marginTop: 8 }}><strong>Follow-up:</strong> Consider extending with related activity</div>
              </div>
            </div>
          </form>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F3F8', display: 'flex', gap: 8 }}>
          <button type="button" className="ll-btn ll-btn-secondary" onClick={onBack}>
            Cancel
          </button>
          <button className="ll-btn ll-btn-primary" onClick={handleSubmitReview} disabled={loading}>
            {loading ? 'Submitting...' : 'Post Review'}
          </button>
        </div>
      </div>
    </>
  );
}
