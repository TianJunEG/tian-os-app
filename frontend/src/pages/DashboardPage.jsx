import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, BookOpen, MessageSquare, Star, Shield, TrendingUp, UserCog, ClipboardList } from 'lucide-react';
import { bookingsAPI } from '../services/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      const params = { role: user?.role };
      const response = await bookingsAPI.getBookings(params);
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {user?.role === 'parent' && (
            <>
              <button
                onClick={() => navigate('/search')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
              >
                <Search className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Find Tutors</h3>
                <p className="text-sm text-gray-600">Search & book tutors</p>
              </button>
              <button
                onClick={() => navigate('/progress')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
              >
                <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Progress</h3>
                <p className="text-sm text-gray-600">Track learning & notes</p>
              </button>
              <button
                onClick={() => navigate('/parent/profile')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
              >
                <UserCog className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Student Profile</h3>
                <p className="text-sm text-gray-600">Goals & preferences</p>
              </button>
            </>
          )}

          {user?.role === 'tutor' && (
            <>
              <button
                onClick={() => navigate('/tutor/profile')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
              >
                <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-900">My Profile</h3>
                <p className="text-sm text-gray-600">Edit your profile</p>
              </button>
              <button
                onClick={() => navigate('/tutor/onboarding')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
              >
                <ClipboardList className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Onboarding</h3>
                <p className="text-sm text-gray-600">Complete your application</p>
              </button>
            </>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
            >
              <Shield className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
              <p className="text-sm text-gray-600">Users, verification & disputes</p>
            </button>
          )}

          <button
            onClick={() => navigate('/messages')}
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <MessageSquare className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Messages</h3>
            <p className="text-sm text-gray-600">Chat with users</p>
          </button>

          <button
            onClick={() => navigate('/bookings')}
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <BookOpen className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">My Bookings</h3>
            <p className="text-sm text-gray-600">View all bookings</p>
          </button>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No bookings yet</p>
              {user?.role === 'parent' && (
                <button
                  onClick={() => navigate('/search')}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                >
                  Find a tutor →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      {user?.role === 'parent' ? 'Tutor' : 'Student'}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user?.role === 'parent'
                          ? booking.tutorId?.name
                          : booking.parentId?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{booking.subject}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${booking.totalCost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
