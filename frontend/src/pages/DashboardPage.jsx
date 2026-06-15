import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, BookOpen, MessageSquare, Star, SpellCheck, TrendingUp, FlaskConical, Calculator, FileText } from 'lucide-react';
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
      'in-progress': 'bg-emerald-tint text-emerald-deep',
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
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-deep grid place-items-center text-gold-400 font-extrabold">E</span>
              <div>
                <h1 className="text-xl font-extrabold text-emerald-deep tracking-tight leading-none">Tian<span className="text-gold-500">OS</span></h1>
                <p className="text-gray-500 text-sm">Welcome, {user?.name}</p>
              </div>
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
          <button
            onClick={() => navigate(user?.role === 'parent' ? '/children' : '/learning')}
            className="p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
          >
            <TrendingUp className="w-8 h-8 text-emerald-deep mb-2" />
            <h3 className="font-semibold text-gray-900">{user?.role === 'parent' ? 'My Children' : 'My Learning'}</h3>
            <p className="text-sm text-gray-600">{user?.role === 'parent' ? 'Each child’s progress' : 'Progress across all apps'}</p>
          </button>
          {user?.role === 'parent' && (
            <>
              <button
                onClick={() => navigate('/search')}
                className="p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
              >
                <Search className="w-8 h-8 text-emerald-deep mb-2" />
                <h3 className="font-semibold text-gray-900">Find Tutors</h3>
                <p className="text-sm text-gray-600">Search & book tutors</p>
              </button>
            </>
          )}

          {user?.role === 'tutor' && (
            <>
              <button
                onClick={() => navigate('/tutor/profile')}
                className="p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
              >
                <BookOpen className="w-8 h-8 text-emerald-deep mb-2" />
                <h3 className="font-semibold text-gray-900">My Profile</h3>
                <p className="text-sm text-gray-600">Edit your profile</p>
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/messages')}
            className="p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
          >
            <MessageSquare className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Messages</h3>
            <p className="text-sm text-gray-600">Chat with users</p>
          </button>

          <button
            onClick={() => navigate('/bookings')}
            className="p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
          >
            <BookOpen className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">My Bookings</h3>
            <p className="text-sm text-gray-600">View all bookings</p>
          </button>

          <a
            href="/mathpath/index.html?return=/dashboard"
            className="block p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
          >
            <Calculator className="w-8 h-8 text-emerald-deep mb-2" />
            <h3 className="font-semibold text-gray-900">MathPath</h3>
            <p className="text-sm text-gray-600">Mastery practice across every skill</p>
          </a>

          <button
            onClick={() => navigate('/worksheets')}
            className="p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
          >
            <FileText className="w-8 h-8 text-gold-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Worksheet Generator</h3>
            <p className="text-sm text-gray-600">Targeted mastery from marked mistakes</p>
          </button>

          <button
            onClick={() => navigate('/spelling')}
            className="p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
          >
            <SpellCheck className="w-8 h-8 text-pink-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Spelling</h3>
            <p className="text-sm text-gray-600">Lists, tests & games</p>
          </button>

          <button
            onClick={() => navigate('/science')}
            className="p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
          >
            <FlaskConical className="w-8 h-8 text-emerald-deep mb-2" />
            <h3 className="font-semibold text-gray-900">Science</h3>
            <p className="text-sm text-gray-600">P6 revision Q&amp;A · feeds progress</p>
          </button>

          <a
            href="/science/index.html"
            target="_blank"
            rel="noopener"
            className="block p-6 bg-white rounded-2xl border border-emerald-tint shadow-sm hover:shadow-md transition text-left"
          >
            <FlaskConical className="w-8 h-8 text-gold-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Science Lab</h3>
            <p className="text-sm text-gray-600">Interactive revision & concept maps</p>
          </a>
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
                  className="mt-4 text-emerald-deep hover:text-emerald-deep font-medium"
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
