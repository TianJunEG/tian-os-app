import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI } from '../services/api';
import { Calendar, Clock, User, DollarSign, AlertCircle } from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

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
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses = ['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                  {/* User Info */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {user?.role === 'parent' ? 'Tutor' : 'Student'}
                    </p>
                    <h3 className="font-semibold text-gray-900">
                      {user?.role === 'parent'
                        ? booking.tutorId?.name
                        : booking.parentId?.name}
                    </h3>
                  </div>

                  {/* Session Info */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Subject</p>
                    <p className="font-semibold text-gray-900">{booking.subject}</p>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Schedule</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{booking.startTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Amount */}
                  <div className="flex flex-col justify-between items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-bold text-purple-600">${booking.totalCost}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                    {user?.role === 'tutor' && booking.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(booking._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        Confirm
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(booking._id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
