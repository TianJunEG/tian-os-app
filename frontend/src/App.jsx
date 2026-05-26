import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import ChildProfilePage from './pages/ChildProfilePage';
import TutorSearchPage from './pages/TutorSearchPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import BookingsPage from './pages/BookingsPage';
import MessagesPage from './pages/MessagesPage';
import TutorProfilePage from './pages/TutorProfilePage';
import ResourcesHubPage from './pages/ResourcesHubPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import SciencePracticePage from './pages/SciencePracticePage';
import WorksheetGeneratorPage from './pages/WorksheetGeneratorPage';
import StudentsPage from './pages/StudentsPage';
import ParentProgressPage from './pages/ParentProgressPage';
import AdminDashboard from './components/AdminDashboard';
import TutorOnboarding from './components/TutorOnboarding';
import ParentProfile from './components/ParentProfile';
import PwaManager from './components/PwaManager';
import ErrorBoundary from './components/ErrorBoundary';

// Spelling app pages
import SpellingHomePage from './pages/spelling/SpellingHomePage';
import SpellingListsPage from './pages/spelling/SpellingListsPage';
import SpellingEditorPage from './pages/spelling/SpellingEditorPage';
import SpellingListDetailPage from './pages/spelling/SpellingListDetailPage';
import SpellingLibraryPage from './pages/spelling/SpellingLibraryPage';
import MisspeltWordsPage from './pages/spelling/MisspeltWordsPage';
import SurpriseSpellingPage from './pages/spelling/SurpriseSpellingPage';
import SpellingRevisionPage from './pages/spelling/SpellingRevisionPage';
import SpellingDuePage from './pages/spelling/SpellingDuePage';
import SpellingProgressPage from './pages/spelling/SpellingProgressPage';
import SpellingAchievementsPage from './pages/spelling/SpellingAchievementsPage';
import SpellingPrintPage from './pages/spelling/SpellingPrintPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-navy-700"></div>
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-navy-700"></div>
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
  <div className="min-h-screen bg-white">
    <header className="bg-white/80 backdrop-blur border-b border-navy-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-navy-900 grid place-items-center text-gold-400 font-extrabold">E</span>
          <span className="text-xl font-extrabold text-navy-900 tracking-tight">Edu<span className="text-gold-500">OS</span></span>
        </div>
        <div className="space-x-4">
          <a href="/login" className="text-navy-700 hover:text-navy-900 font-medium">Login</a>
          <a href="/register" className="px-4 py-2 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition">Sign Up</a>
        </div>
      </div>
    </header>

    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 text-center">
          <div className="text-gold-300 text-xs font-semibold tracking-[0.2em] uppercase mb-5">Tian Jun Education Group</div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            AI-Native Learning.<br /><span className="text-gold-400">Built for Every Student.</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 mt-6 max-w-2xl mx-auto">
            Powered by teachers. Designed for parents. Personalized by AI.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <a href="/register?role=parent" className="px-7 py-3.5 bg-gold-400 text-navy-900 rounded-xl hover:bg-gold-300 font-bold inline-block transition">Find a Tutor</a>
            <a href="/register?role=tutor" className="px-7 py-3.5 bg-white/10 ring-1 ring-white/25 text-white rounded-xl hover:bg-white/15 font-semibold inline-block transition">Become a Tutor</a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            ['Personalized by AI', 'Every mistake becomes targeted mastery — worksheets and revision adapt to each child.'],
            ['One connected profile', 'Spelling, maths and science progress unify into a single readiness picture for parents.'],
            ['Powered by teachers', 'Expert tutors and an enrichment marketplace, matched to how your child learns.'],
          ].map(([t, d]) => (
            <div key={t} className="bg-white border border-navy-100 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-navy-900 mb-1.5">{t}</h3>
              <p className="text-sm text-gray-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>

    <footer className="border-t border-navy-100 py-8 text-center text-sm text-navy-400">
      <span className="font-semibold text-navy-700">Edu OS</span> · AI-Native Learning. Built for Every Student. · © Tian Jun Education Group
    </footer>
  </div>
);

// Main App
function App() {
  return (
    <Router>
      <AuthProvider>
        <PwaManager />
        <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/resources" element={<ResourcesHubPage />} />
          <Route path="/resources/:slug" element={<ResourceDetailPage />} />
          <Route path="/science" element={<ProtectedRoute><SciencePracticePage /></ProtectedRoute>} />

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
            path="/learning"
            element={
              <ProtectedRoute>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/children"
            element={
              <ProtectedRoute>
                <ParentDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/children/:childId"
            element={
              <ProtectedRoute>
                <ChildProfilePage />
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

          <Route path="/worksheets" element={<ProtectedRoute><WorksheetGeneratorPage /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ParentProgressPage /></ProtectedRoute>} />
          <Route path="/tutor/onboarding" element={<ProtectedRoute><TutorOnboarding /></ProtectedRoute>} />
          <Route path="/parent/profile" element={<ProtectedRoute><ParentProfile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

          {/* Spelling app */}
          <Route path="/spelling" element={<ProtectedRoute><SpellingHomePage /></ProtectedRoute>} />
          <Route path="/spelling/lists" element={<ProtectedRoute><SpellingListsPage /></ProtectedRoute>} />
          <Route path="/spelling/lists/new" element={<ProtectedRoute><SpellingEditorPage /></ProtectedRoute>} />
          <Route path="/spelling/lists/:id" element={<ProtectedRoute><SpellingListDetailPage /></ProtectedRoute>} />
          <Route path="/spelling/lists/:id/edit" element={<ProtectedRoute><SpellingEditorPage /></ProtectedRoute>} />
          <Route path="/spelling/library" element={<ProtectedRoute><SpellingLibraryPage /></ProtectedRoute>} />
          <Route path="/spelling/misspelt" element={<ProtectedRoute><MisspeltWordsPage /></ProtectedRoute>} />
          <Route path="/spelling/surprise" element={<ProtectedRoute><SurpriseSpellingPage /></ProtectedRoute>} />
          <Route path="/spelling/revision" element={<ProtectedRoute><SpellingRevisionPage /></ProtectedRoute>} />
          <Route path="/spelling/due" element={<ProtectedRoute><SpellingDuePage /></ProtectedRoute>} />
          <Route path="/spelling/progress" element={<ProtectedRoute><SpellingProgressPage /></ProtectedRoute>} />
          <Route path="/spelling/achievements" element={<ProtectedRoute><SpellingAchievementsPage /></ProtectedRoute>} />
          <Route path="/spelling/lists/:id/print" element={<ProtectedRoute><SpellingPrintPage /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
