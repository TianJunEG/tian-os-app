import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sparkles, Layers, GraduationCap, ArrowRight } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GOLD, GOLD_SOFT, INK, INK_SOFT, BG, SANS, SERIF, Reveal, Eyebrow, Headline, GlassCard, Wordmark, EduOSKeyframes } from './components/eduos';

// Pages
import FounderStoryPage from './pages/FounderStoryPage';
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

// Landing Page — cinematic Edu OS look (matches the launch video / founder story).
const LANDING_FEATURES = [
  { icon: Sparkles, title: 'Personalized by AI', body: 'Every mistake becomes targeted mastery — worksheets and revision adapt to each child.' },
  { icon: Layers, title: 'One connected profile', body: 'Spelling, maths and science progress unify into a single readiness picture for parents.' },
  { icon: GraduationCap, title: 'Powered by teachers', body: 'Expert tutors and an enrichment marketplace, matched to how your child learns.' },
];
const navLink = { color: INK_SOFT, fontFamily: SANS, fontWeight: 600, fontSize: 15, textDecoration: 'none' };

const LandingPage = () => (
  <div style={{ background: BG, color: INK, fontFamily: SANS, minHeight: '100vh', overflowX: 'hidden' }}>
    <EduOSKeyframes />
    <header style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)', background: 'rgba(5,10,20,0.7)', borderBottom: '1px solid rgba(180,200,240,0.12)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/"><Wordmark /></Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <Link to="/founder" style={navLink}>Our story</Link>
          <Link to="/login" style={navLink}>Login</Link>
          <Link to="/register" style={{ padding: '10px 20px', borderRadius: 999, background: GOLD, color: '#1a1f2e', fontFamily: SANS, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: `0 10px 24px -8px ${GOLD}66` }}>Sign Up</Link>
        </nav>
      </div>
    </header>

    <main>
      <section style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 38%, #1a2940 0%, #0a1428 58%, #050a14 100%)' }}>
        <div style={{ position: 'absolute', right: '-6%', top: '-10%', width: 620, height: 620, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD_SOFT} 0%, transparent 60%)`, filter: 'blur(40px)', pointerEvents: 'none', opacity: 0.5 }} />
        <div style={{ position: 'relative', maxWidth: 980, margin: '0 auto', padding: '120px 24px 130px', textAlign: 'center' }}>
          <Reveal><Eyebrow>Tian Jun Education Group</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <Headline style={{ marginTop: 22, fontSize: 'clamp(40px, 7vw, 78px)' }}>
              AI-Native Learning.<br /><span style={{ color: GOLD }}>Built for Every Student.</span>
            </Headline>
          </Reveal>
          <Reveal delay={0.2}>
            <p style={{ marginTop: 24, fontSize: 'clamp(17px, 2.2vw, 21px)', color: INK_SOFT, maxWidth: 620, margin: '24px auto 0', lineHeight: 1.6 }}>
              Powered by teachers. Designed for parents. Personalized by AI.
            </p>
          </Reveal>
          <Reveal delay={0.3} style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <Link to="/register?role=parent" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 30px', borderRadius: 999, background: GOLD, color: '#1a1f2e', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: `0 20px 40px -12px ${GOLD}66, 0 0 40px ${GOLD_SOFT}` }}>Find a Tutor <ArrowRight size={18} /></Link>
            <Link to="/register?role=tutor" style={{ padding: '15px 30px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', color: INK, fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>Become a Tutor</Link>
          </Reveal>
          <Reveal delay={0.4}>
            <Link to="/founder" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 28, color: GOLD, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Read our founder story <ArrowRight size={15} /></Link>
          </Reveal>
        </div>
      </section>

      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '90px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
          {LANDING_FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <GlassCard style={{ padding: 30, height: '100%' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.4)', display: 'grid', placeItems: 'center', marginBottom: 18 }}>
                  <f.icon size={24} color={GOLD} />
                </div>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 24, color: INK, margin: 0 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: INK_SOFT, marginTop: 10, lineHeight: 1.6 }}>{f.body}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>
    </main>

    <footer style={{ borderTop: '1px solid rgba(180,200,240,0.12)', padding: '28px 24px', textAlign: 'center', fontSize: 13, color: INK_SOFT }}>
      <span style={{ color: INK, fontWeight: 700 }}>Edu OS</span> · AI-Native Learning. Built for Every Student. · © Tian Jun Education Group
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
          <Route path="/founder" element={<FounderStoryPage />} />

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
