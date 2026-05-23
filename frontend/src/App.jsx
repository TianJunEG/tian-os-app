import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TutorSearchPage from './pages/TutorSearchPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import BookingsPage from './pages/BookingsPage';
import MessagesPage from './pages/MessagesPage';
import TutorProfilePage from './pages/TutorProfilePage';
import ParentProgressPage from './pages/ParentProgressPage';
import GroupLandingPage from './pages/GroupLandingPage';
import TutoringLandingPage from './pages/TutoringLandingPage';
import EduAppsLandingPage from './pages/EduAppsLandingPage';
import ResourcesHubPage from './pages/ResourcesHubPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import AdminDashboard from './components/AdminDashboard';
import TutorOnboarding from './components/TutorOnboarding';
import ParentProfile from './components/ParentProfile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Admin Route (requires authenticated admin role)
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Public Route (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Main App
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<GroupLandingPage />} />
          <Route path="/tutoring" element={<TutoringLandingPage />} />
          <Route path="/edu-apps" element={<EduAppsLandingPage />} />
          <Route path="/resources" element={<ResourcesHubPage />} />
          <Route path="/resources/:slug" element={<ResourceDetailPage />} />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <TutorSearchPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/booking/:tutorId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment/:bookingId"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/profile"
            element={
              <ProtectedRoute>
                <TutorProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/onboarding"
            element={
              <ProtectedRoute>
                <TutorOnboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/profile"
            element={
              <ProtectedRoute>
                <ParentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ParentProgressPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
