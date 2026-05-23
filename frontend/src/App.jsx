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

// Spelling app pages
import SpellingHomePage from './pages/spelling/SpellingHomePage';
import SpellingListsPage from './pages/spelling/SpellingListsPage';
import SpellingEditorPage from './pages/spelling/SpellingEditorPage';
import SpellingListDetailPage from './pages/spelling/SpellingListDetailPage';
import SpellingLibraryPage from './pages/spelling/SpellingLibraryPage';
import MisspeltWordsPage from './pages/spelling/MisspeltWordsPage';
import SurpriseSpellingPage from './pages/spelling/SurpriseSpellingPage';

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
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Find Your Perfect Tutor
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Connect with expert tutors and start learning today
        </p>
        <div className="space-x-4">
          <a href="/register?role=parent" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block font-medium">
            Find a Tutor
          </a>
          <a href="/register?role=tutor" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block font-medium">
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

          {/* Spelling app */}
          <Route path="/spelling" element={<ProtectedRoute><SpellingHomePage /></ProtectedRoute>} />
          <Route path="/spelling/lists" element={<ProtectedRoute><SpellingListsPage /></ProtectedRoute>} />
          <Route path="/spelling/lists/new" element={<ProtectedRoute><SpellingEditorPage /></ProtectedRoute>} />
          <Route path="/spelling/lists/:id" element={<ProtectedRoute><SpellingListDetailPage /></ProtectedRoute>} />
          <Route path="/spelling/lists/:id/edit" element={<ProtectedRoute><SpellingEditorPage /></ProtectedRoute>} />
          <Route path="/spelling/library" element={<ProtectedRoute><SpellingLibraryPage /></ProtectedRoute>} />
          <Route path="/spelling/misspelt" element={<ProtectedRoute><MisspeltWordsPage /></ProtectedRoute>} />
          <Route path="/spelling/surprise" element={<ProtectedRoute><SurpriseSpellingPage /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
