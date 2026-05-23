import React, { useState, useEffect } from 'react';
import { adminAPI, partnersAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    dashboard: null,
    users: null,
    verificationQueue: null,
    bookings: null,
    disputes: null,
    partners: null
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userRole: '',
    bookingStatus: '',
    disputeStatus: 'open',
    page: 1,
    limit: 20
  });

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminAPI.getDashboard();
        setData(prev => ({ ...prev, dashboard: res.data.dashboard }));
      } catch (error) {
        console.error('Dashboard error:', error);
      }
    };
    fetchDashboard();
  }, []);

  // Fetch current tab data
  useEffect(() => {
    const fetchTabData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const res = await adminAPI.getUsers({
            role: filters.userRole || undefined,
            page: filters.page,
            limit: filters.limit
          });
          setData(prev => ({ ...prev, users: res.data }));
        } else if (activeTab === 'verification') {
          const res = await adminAPI.getVerificationQueue({
            status: 'pending_verification',
            page: filters.page,
            limit: filters.limit
          });
          setData(prev => ({ ...prev, verificationQueue: res.data }));
        } else if (activeTab === 'bookings') {
          const res = await adminAPI.getBookings({
            status: filters.bookingStatus || undefined,
            page: filters.page,
            limit: filters.limit
          });
          setData(prev => ({ ...prev, bookings: res.data }));
        } else if (activeTab === 'disputes') {
          const res = await adminAPI.getDisputes({
            status: filters.disputeStatus,
            page: filters.page,
            limit: filters.limit
          });
          setData(prev => ({ ...prev, disputes: res.data }));
        } else if (activeTab === 'partners') {
          const res = await partnersAPI.getInquiries({
            page: filters.page,
            limit: filters.limit
          });
          setData(prev => ({ ...prev, partners: res.data }));
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab !== 'dashboard') {
      fetchTabData();
    }
  }, [activeTab, filters]);

  const handleVerifyTutor = async (tutorId, action) => {
    try {
      const notes = prompt(`Enter notes for this verification (${action}):`);
      if (!notes) return;

      await adminAPI.verifyTutor(tutorId, { action, notes });

      alert(`Tutor ${action === 'approve' ? 'approved' : 'rejected'}`);
      // Refresh verification queue
      setFilters(prev => ({ ...prev, page: 1 }));
    } catch (error) {
      alert('Error updating verification: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleResolvDispute = async (bookingId) => {
    try {
      const resolution = prompt('Enter resolution details:');
      const action = prompt('Action? (refund/keep/other)');

      if (!resolution || !action) return;

      await adminAPI.resolveDispute(bookingId, { resolution, action });

      alert('Dispute resolved');
      setFilters(prev => ({ ...prev, page: 1 }));
    } catch (error) {
      alert('Error resolving dispute: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>🔧 Admin Dashboard</h1>
        <div className="admin-nav">
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Overview
          </button>
          <button
            className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            className={`nav-btn ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            ✅ Verification ({data.verificationQueue?.pagination?.total || 0})
          </button>
          <button
            className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📅 Bookings
          </button>
          <button
            className={`nav-btn ${activeTab === 'disputes' ? 'active' : ''}`}
            onClick={() => setActiveTab('disputes')}
          >
            ⚠️ Disputes ({data.disputes?.pagination?.total || 0})
          </button>
          <button
            className={`nav-btn ${activeTab === 'partners' ? 'active' : ''}`}
            onClick={() => setActiveTab('partners')}
          >
            🤝 Partnerships ({data.partners?.pagination?.total || 0})
          </button>
        </div>
      </header>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && data.dashboard && (
        <div className="dashboard-grid">
          {/* Users Card */}
          <div className="metric-card">
            <h3>👥 Users</h3>
            <div className="metric-row">
              <span>Parents:</span>
              <strong>{data.dashboard.users.parents}</strong>
            </div>
            <div className="metric-row">
              <span>Tutors:</span>
              <strong>{data.dashboard.users.tutors}</strong>
            </div>
            <div className="metric-row">
              <span>Verified:</span>
              <strong>{data.dashboard.users.verified}/{data.dashboard.users.tutors}</strong>
            </div>
            <div className="metric-row">
              <span>Pending Verification:</span>
              <strong>{data.dashboard.users.pendingVerification}</strong>
            </div>
          </div>

          {/* Bookings Card */}
          <div className="metric-card">
            <h3>📅 Bookings</h3>
            <div className="metric-row">
              <span>Total:</span>
              <strong>{data.dashboard.bookings.total}</strong>
            </div>
            <div className="metric-row">
              <span>Completed:</span>
              <strong>{data.dashboard.bookings.completed}</strong>
            </div>
            <div className="metric-row">
              <span>Active:</span>
              <strong>{data.dashboard.bookings.active}</strong>
            </div>
            <div className="metric-row">
              <span>Completion Rate:</span>
              <strong>{data.dashboard.bookings.completionRate}%</strong>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="metric-card">
            <h3>💰 Revenue</h3>
            <div className="metric-row">
              <span>Total:</span>
              <strong>${data.dashboard.revenue.total.toFixed(2)}</strong>
            </div>
            <div className="metric-row">
              <span>Platform Fee (12%):</span>
              <strong>${data.dashboard.revenue.platformFee.toFixed(2)}</strong>
            </div>
            <div className="metric-row">
              <span>Tutor Payouts (88%):</span>
              <strong>${data.dashboard.revenue.tutorPayouts.toFixed(2)}</strong>
            </div>
          </div>

          {/* Quality Card */}
          <div className="metric-card">
            <h3>⭐ Quality</h3>
            <div className="metric-row">
              <span>Avg Tutor Rating:</span>
              <strong>{data.dashboard.quality.avgTutorRating}/5.0</strong>
            </div>
            <div className="metric-row">
              <span>Avg Match Success:</span>
              <strong>{data.dashboard.quality.avgMatchSuccess}%</strong>
            </div>
            <div className="metric-row">
              <span>Verification Rate:</span>
              <strong>{data.dashboard.quality.verificationRate}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && data.users && (
        <div className="admin-section">
          <div className="filters">
            <select
              value={filters.userRole}
              onChange={(e) =>
                setFilters(prev => ({ ...prev, userRole: e.target.value, page: 1 }))
              }
              className="filter-select"
            >
              <option value="">All Roles</option>
              <option value="parent">Parents</option>
              <option value="tutor">Tutors</option>
            </select>
          </div>

          <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-small">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              ← Prev
            </button>
            <span>Page {data.users.pagination.page} of {data.users.pagination.pages}</span>
            <button
              disabled={filters.page >= data.users.pagination.pages}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* VERIFICATION QUEUE TAB */}
      {activeTab === 'verification' && data.verificationQueue && (
        <div className="admin-section">
          <h2>Pending Tutor Verifications ({data.verificationQueue.pagination.total})</h2>

          <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tutor Name</th>
                <th>Email</th>
                <th>Specialties</th>
                <th>Grades</th>
                <th>Rate</th>
                <th>Hours Taught</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.verificationQueue.tutors.map(tutor => (
                <tr key={tutor._id}>
                  <td>{tutor.name}</td>
                  <td>{tutor.email}</td>
                  <td>{(tutor.specialties || []).join(', ')}</td>
                  <td>{(tutor.grades || tutor.gradeLevel || []).join(', ')}</td>
                  <td>${tutor.hourlyRate}/hr</td>
                  <td>{tutor.totalHoursTaught}h</td>
                  <td>
                    <span className="badge badge-warning">Pending</span>
                  </td>
                  <td>
                    <button
                      className="btn-success"
                      onClick={() => handleVerifyTutor(tutor._id, 'approve')}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleVerifyTutor(tutor._id, 'reject')}
                    >
                      ✗ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {data.verificationQueue.tutors.length === 0 && (
            <p className="empty-state">✓ No pending verifications</p>
          )}
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && data.bookings && (
        <div className="admin-section">
          <div className="filters">
            <select
              value={filters.bookingStatus}
              onChange={(e) =>
                setFilters(prev => ({ ...prev, bookingStatus: e.target.value, page: 1 }))
              }
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Tutor</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.bookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.parent}</td>
                  <td>{booking.tutor}</td>
                  <td>{booking.subject}</td>
                  <td>{new Date(booking.date).toLocaleDateString()}</td>
                  <td>{booking.duration}h</td>
                  <td>${booking.totalCost}</td>
                  <td>
                    <span className={`status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <span className={booking.sessionNotes === 'Submitted' ? 'text-success' : 'text-warning'}>
                      {booking.sessionNotes}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* DISPUTES TAB */}
      {activeTab === 'disputes' && data.disputes && (
        <div className="admin-section">
          <h2>Disputes ({data.disputes.pagination.total})</h2>

          <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Tutor</th>
                <th>Reason</th>
                <th>Description</th>
                <th>Flagged</th>
                <th>Hours Open</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.disputes.disputes.map(dispute => (
                <tr key={dispute._id}>
                  <td>{dispute.parent}</td>
                  <td>{dispute.tutor}</td>
                  <td>{dispute.reason}</td>
                  <td className="truncate">{dispute.description}</td>
                  <td>{new Date(dispute.flaggedAt).toLocaleDateString()}</td>
                  <td>{dispute.hoursOpen}h</td>
                  <td>
                    <button
                      className="btn-success"
                      onClick={() => handleResolvDispute(dispute._id)}
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {data.disputes.disputes.length === 0 && (
            <p className="empty-state">✓ No open disputes</p>
          )}
        </div>
      )}

      {/* PARTNERSHIPS TAB */}
      {activeTab === 'partners' && data.partners && (
        <div className="admin-section">
          <h2>Partnership Inquiries ({data.partners.pagination.total})</h2>

          <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Organization</th>
                <th>Email</th>
                <th>Message</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {data.partners.inquiries.map(inquiry => (
                <tr key={inquiry._id}>
                  <td>{inquiry.name}</td>
                  <td>{inquiry.organization || 'N/A'}</td>
                  <td>{inquiry.email}</td>
                  <td className="truncate">{inquiry.message}</td>
                  <td>
                    <span className="badge badge-parent">{inquiry.status}</span>
                  </td>
                  <td>{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {data.partners.inquiries.length === 0 && (
            <p className="empty-state">No partnership inquiries yet</p>
          )}

          <div className="pagination">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              ← Prev
            </button>
            <span>Page {data.partners.pagination.page} of {data.partners.pagination.pages}</span>
            <button
              disabled={filters.page >= data.partners.pagination.pages}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
