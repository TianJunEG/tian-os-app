import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI } from '../services/api';
import { Calendar, Clock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [notesBooking, setNotesBooking] = useState(null);
  const [notesForm, setNotesForm] = useState({
    topicsCovered: '',
    studentUnderstanding: 'ok',
    homeworkAssigned: '',
    additionalNotes: ''
  });
  const [submittingNotes, setSubmittingNotes] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      const params = {
        role: user?.role,
        ...(filter !== 'all' && { status: filter })
      };
      const response = await bookingsAPI.getBookings(params);
      setBookings(response.data.bookings || []);
      setError('');
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId) => {
    try {
      await bookingsAPI.confirmBooking(bookingId);
      loadBookings();
    } catch (err) {
      alert('Failed to confirm booking');
    }
  };

  const handleCheckin = async (bookingId) => {
    try {
      await bookingsAPI.checkinBooking(bookingId);
      loadBookings();
    } catch (err) {
      alert('Failed to start session');
    }
  };

  const openNotesModal = (booking) => {
    setNotesForm({
      topicsCovered: '',
      studentUnderstanding: 'ok',
      homeworkAssigned: '',
      additionalNotes: ''
    });
    setNotesBooking(booking);
  };

  const handleSubmitNotes = async (e) => {
    e.preventDefault();
    setSubmittingNotes(true);
    try {
      await bookingsAPI.submitSessionNotes(notesBooking._id, {
        topicsCovered: notesForm.topicsCovered
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        studentUnderstanding: notesForm.studentUnderstanding,
        homeworkAssigned: notesForm.homeworkAssigned,
        additionalNotes: notesForm.additionalNotes
      });
      setNotesBooking(null);
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to submit notes');
    } finally {
      setSubmittingNotes(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingsAPI.cancelBooking(bookingId, {
          cancellationReason: 'Cancelled by user'
        });
        loadBookings();
      } catch (err) {
        alert('Failed to cancel booking');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-emerald-tint text-emerald-deep',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const statuses = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600">Sessions</div>
            <h1 className="text-3xl font-serif font-medium text-emerald-deep leading-tight">My Bookings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                filter === status
                  ? 'bg-emerald-deep text-white'
                  : 'bg-white text-gray-600 border border-emerald-tint hover:bg-emerald-tint'
              }`}
            >
              {status === 'all' ? 'All' : formatStatus(status)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-deep" />
            <p className="mt-4 text-gray-600">Loading bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-emerald-tint shadow-sm p-12 text-center">
            <p className="text-gray-500">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-lg transition overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                  {/* User Info */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                      {user?.role === 'parent' ? 'Tutor' : 'Student'}
                    </p>
                    <h3 className="font-bold text-emerald-deep">
                      {user?.role === 'parent' ? booking.tutorId?.name : booking.parentId?.name}
                    </h3>
                  </div>

                  {/* Session Info */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Subject</p>
                    <p className="font-semibold text-emerald-deep">{booking.subject}</p>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Schedule</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {booking.startTime}
                      </div>
                    </div>
                  </div>

                  {/* Status & Amount */}
                  <div className="flex flex-col justify-between items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {formatStatus(booking.status)}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-xl font-bold text-emerald-deep">${booking.totalCost}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {['pending', 'confirmed', 'in_progress'].includes(booking.status) && (
                  <div className="px-6 py-4 bg-emerald-tint border-t border-emerald-tint flex justify-end gap-2">
                    {user?.role === 'tutor' && booking.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(booking._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                      >
                        Confirm
                      </button>
                    )}
                    {user?.role === 'tutor' && booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCheckin(booking._id)}
                        className="px-4 py-2 bg-emerald-deep text-white rounded-lg hover:bg-emerald-deep transition text-sm font-semibold"
                      >
                        Start Session
                      </button>
                    )}
                    {user?.role === 'tutor' && booking.status === 'in_progress' && (
                      <button
                        onClick={() => openNotesModal(booking)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        Complete Session
                      </button>
                    )}
                    {booking.status !== 'in_progress' && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Complete Session — Notes Modal */}
      {notesBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Complete Session</h2>
              <p className="text-sm text-gray-600">
                {notesBooking.subject} with {notesBooking.parentId?.name}
              </p>
            </div>
            <form onSubmit={handleSubmitNotes} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topics covered <span className="text-gray-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={notesForm.topicsCovered}
                  onChange={(e) => setNotesForm(prev => ({ ...prev, topicsCovered: e.target.value }))}
                  placeholder="e.g. Quadratic equations, Factoring"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student understanding
                </label>
                <select
                  value={notesForm.studentUnderstanding}
                  onChange={(e) => setNotesForm(prev => ({ ...prev, studentUnderstanding: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                >
                  <option value="struggling">Struggling</option>
                  <option value="ok">OK</option>
                  <option value="mastered">Mastered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Homework assigned
                </label>
                <input
                  type="text"
                  value={notesForm.homeworkAssigned}
                  onChange={(e) => setNotesForm(prev => ({ ...prev, homeworkAssigned: e.target.value }))}
                  placeholder="e.g. Practice set 3, problems 1-10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={notesForm.additionalNotes}
                  onChange={(e) => setNotesForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNotesBooking(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotes}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {submittingNotes ? 'Submitting...' : 'Submit & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
