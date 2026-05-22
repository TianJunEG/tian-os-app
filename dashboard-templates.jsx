import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, DollarSign, Users, Star, TrendingUp, MessageSquare, Bell, Settings, LogOut, Home, BookOpen, CreditCard, BarChart3 } from 'lucide-react';

// ============================================
// PARENT DASHBOARD
// ============================================
export function ParentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const upcomingSessions = [
    { id: 1, tutor: 'Sarah Chen', subject: 'AP Calculus', date: '2024-06-15', time: '3:00 PM', status: 'confirmed' },
    { id: 2, tutor: 'Marcus Johnson', subject: 'Physics', date: '2024-06-17', time: '4:00 PM', status: 'confirmed' },
    { id: 3, tutor: 'Emma Rodriguez', subject: 'Spanish', date: '2024-06-20', time: '5:00 PM', status: 'pending' }
  ];

  const studentProgress = [
    { month: 'Jan', score: 72 },
    { month: 'Feb', score: 75 },
    { month: 'Mar', score: 78 },
    { month: 'Apr', score: 81 },
    { month: 'May', score: 85 },
    { month: 'Jun', score: 88 }
  ];

  const sessionHistory = [
    { date: '2024-06-10', tutor: 'Sarah Chen', duration: '60 min', topic: 'Derivatives & Limits', rating: 5 },
    { date: '2024-06-08', tutor: 'Marcus Johnson', duration: '45 min', topic: 'Mechanics', rating: 5 },
    { date: '2024-06-05', tutor: 'Emma Rodriguez', duration: '60 min', topic: 'Conversational Spanish', rating: 4 }
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AEO</h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-600 hover:text-slate-900 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 text-slate-600 hover:text-slate-900">
              <Settings size={20} />
            </button>
            <button className="p-2 text-slate-600 hover:text-slate-900">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Welcome back, John! 👋</h2>
          <p className="text-slate-600 mt-2">You're making great progress. Keep it up!</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Total Sessions</p>
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">24</p>
            <p className="text-xs text-slate-500 mt-2">+2 this week</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Total Spent</p>
              <CreditCard size={20} className="text-teal-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">$1,080</p>
            <p className="text-xs text-slate-500 mt-2">45 hours tutored</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Active Tutors</p>
              <Users size={20} className="text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">3</p>
            <p className="text-xs text-slate-500 mt-2">All highly rated</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Avg Rating</p>
              <Star size={20} className="text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">4.8</p>
            <p className="text-xs text-slate-500 mt-2">Excellent tutors</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Upcoming Sessions</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-6 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{session.subject} with {session.tutor}</p>
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                          <Calendar size={14} /> {session.date} at {session.time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        session.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button className="text-sm px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
                        Reschedule
                      </button>
                      <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Your Progress</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={studentProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[70, 90]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC' }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-slate-600 mt-4">
                Great work! Your test scores have improved 16 points since January. Keep booking sessions to maintain this momentum.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                  Search Tutors
                </button>
                <button className="w-full py-3 border-2 border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50">
                  Manage Tutors
                </button>
                <button className="w-full py-3 border-2 border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50">
                  Billing
                </button>
                <button className="w-full py-3 border-2 border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50">
                  Settings
                </button>
              </div>
            </div>

            {/* Saved Tutors */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Saved Tutors</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                  <div className="text-3xl">👩‍🏫</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Sarah Chen</p>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-slate-600">4.9 (287)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session History */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Recent Sessions</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {sessionHistory.map((s, idx) => (
                  <div key={idx} className="p-4 text-sm">
                    <p className="font-semibold text-slate-900">{s.topic}</p>
                    <p className="text-slate-600 text-xs mt-1">{s.date} • {s.duration}</p>
                    <p className="text-slate-600 text-xs">{s.tutor}</p>
                    <div className="flex gap-0.5 mt-2">
                      {[...Array(s.rating)].map((_, i) => (
                        <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TUTOR DASHBOARD
// ============================================
export function TutorDashboard() {
  const earningsData = [
    { week: 'Week 1', earnings: 450 },
    { week: 'Week 2', earnings: 620 },
    { week: 'Week 3', earnings: 580 },
    { week: 'Week 4', earnings: 710 }
  ];

  const bookings = [
    { id: 1, student: 'John Doe', subject: 'AP Calculus', date: '2024-06-15', time: '3:00 PM', duration: '60 min', rate: 45 },
    { id: 2, student: 'Emily Smith', subject: 'AP Calculus', date: '2024-06-17', time: '4:00 PM', duration: '90 min', rate: 45 },
    { id: 3, student: 'Michael Park', subject: 'Algebra', date: '2024-06-20', time: '2:00 PM', duration: '45 min', rate: 40 }
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Tutor Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:text-slate-900">
              <Bell size={20} />
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">
              Go Online
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">This Month</p>
              <DollarSign size={20} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">$2,360</p>
            <p className="text-xs text-slate-500 mt-2">+18% vs last month</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Sessions This Week</p>
              <Calendar size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">6</p>
            <p className="text-xs text-slate-500 mt-2">13.5 hours</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Rating</p>
              <Star size={20} className="text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">4.9</p>
            <p className="text-xs text-slate-500 mt-2">287 reviews</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Students</p>
              <Users size={20} className="text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">45</p>
            <p className="text-xs text-slate-500 mt-2">Active</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Available</p>
              <Clock size={20} className="text-teal-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">28 hrs</p>
            <p className="text-xs text-slate-500 mt-2">This week</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Earnings Chart */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Monthly Earnings</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="earnings" fill="#16a34a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Upcoming Sessions</h3>
                <a href="#" className="text-blue-600 text-sm font-medium">View All</a>
              </div>
              <div className="divide-y divide-slate-200">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-6 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{booking.student}</p>
                        <p className="text-sm text-slate-600 mt-1">{booking.subject} • {booking.duration}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                          <Calendar size={14} /> {booking.date} at {booking.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">${booking.rate}</p>
                        <p className="text-xs text-slate-500">{booking.duration}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button className="text-sm px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
                        Reschedule
                      </button>
                      <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Start Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
                  Update Availability
                </button>
                <button className="w-full py-3 border-2 border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50">
                  Edit Profile
                </button>
                <button className="w-full py-3 border-2 border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50">
                  Manage Rates
                </button>
                <button className="w-full py-3 border-2 border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50">
                  Payout Settings
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Messages</h3>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">3</span>
              </div>
              <div className="divide-y divide-slate-200">
                <div className="p-4 hover:bg-slate-50 cursor-pointer transition">
                  <p className="font-semibold text-slate-900">John Doe</p>
                  <p className="text-sm text-slate-600 mt-1 truncate">Can we reschedule to Friday?</p>
                  <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                </div>
              </div>
            </div>

            {/* Payout Info */}
            <div className="bg-green-50 rounded-lg border border-green-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Payout Coming</h3>
              <p className="text-3xl font-bold text-green-600 mb-2">$2,360</p>
              <p className="text-sm text-slate-600 mb-4">Next payout on June 1st</p>
              <button className="w-full py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADMIN DASHBOARD
// ============================================
export function AdminDashboard() {
  const platformStats = [
    { label: 'Total Users', value: '2,450', change: '+12%' },
    { label: 'Active Tutors', value: '487', change: '+8%' },
    { label: 'Monthly Revenue', value: '$18.5K', change: '+24%' },
    { label: 'Avg Rating', value: '4.7', change: '+0.2' }
  ];

  const disputes = [
    { id: 1, student: 'Alice Johnson', tutor: 'Bob Smith', reason: 'Session not delivered', status: 'pending' },
    { id: 2, student: 'Carol White', tutor: 'Dave Brown', reason: 'Technical difficulties', status: 'resolved' }
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:text-slate-900">
              <Bell size={20} />
            </button>
            <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {platformStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
              <p className="text-xs text-green-600 mt-2">↑ {stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: 'Jan', revenue: 12000 },
                  { month: 'Feb', revenue: 14000 },
                  { month: 'Mar', revenue: 15500 },
                  { month: 'Apr', revenue: 16200 },
                  { month: 'May', revenue: 17800 },
                  { month: 'Jun', revenue: 18500 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pending Tutors */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Pending Tutor Approvals</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {[
                  { name: 'Dr. Sarah Johnson', subject: 'Physics', verified: true },
                  { name: 'Michael Lee', subject: 'Computer Science', verified: false },
                  { name: 'Patricia Williams', subject: 'English', verified: true }
                ].map((tutor, idx) => (
                  <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-900">{tutor.name}</p>
                      <p className="text-sm text-slate-600">{tutor.subject}</p>
                      {tutor.verified && (
                        <span className="text-xs text-green-600 mt-2 inline-block">✓ Verified</span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50">
                        Reject
                      </button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Disputes */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Open Disputes</h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">2</span>
              </div>
              <div className="divide-y divide-slate-200">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="p-4">
                    <p className="text-sm font-semibold text-slate-900">{dispute.student}</p>
                    <p className="text-xs text-slate-600 mt-1">vs {dispute.tutor}</p>
                    <p className="text-xs text-slate-500 mt-1">{dispute.reason}</p>
                    <button className="mt-3 w-full py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">System Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">API Health</span>
                  <span className="text-green-600 font-semibold">● Healthy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Database</span>
                  <span className="text-green-600 font-semibold">● Healthy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Payment Gateway</span>
                  <span className="text-green-600 font-semibold">● Healthy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Email Service</span>
                  <span className="text-yellow-600 font-semibold">● Minor Issues</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Admin Tools</h3>
              <div className="space-y-2">
                <button className="w-full text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded transition">
                  View All Users
                </button>
                <button className="w-full text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded transition">
                  Manage Subjects
                </button>
                <button className="w-full text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded transition">
                  View Reports
                </button>
                <button className="w-full text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded transition">
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
