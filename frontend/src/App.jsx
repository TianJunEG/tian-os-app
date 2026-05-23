import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MobileNav from './components/MobileNav';
import PwaManager from './components/PwaManager';
import ErrorBoundary from './components/ErrorBoundary';

// Pages are code-split so each route loads its own chunk on demand.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TutorSearchPage = lazy(() => import('./pages/TutorSearchPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const TutorProfilePage = lazy(() => import('./pages/TutorProfilePage'));
const WorksheetGeneratorPage = lazy(() => import('./pages/WorksheetGeneratorPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

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

  return (
    <>
      <div className="pb-16 md:pb-0">{children}</div>
      <MobileNav />
    </>
  );
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

// Landing Page
const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">Tutor Match</h1>
          <div className="space-x-4">
            <a href="/login" className="text-gray-700 hover:text-purple-600 font-medium">
              Login
            </a>
            <a href="/register" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </header>

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Find Your Perfect Tutor
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Connect with expert tutors and start learning today
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
          <a href="/register?role=parent" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-center">
            Find a Tutor
          </a>
          <a href="/register?role=tutor" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center">
            Become a Tutor
          </a>
        </div>
      </div>
    </main>
  </div>
);

// Main App
function App() {
  return (
    <Router>
      <AuthProvider>
        <PwaManager />
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

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
            path="/worksheets"
            element={
              <ProtectedRoute>
                <WorksheetGeneratorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
