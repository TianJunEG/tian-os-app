import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { Sparkles, Layers, GraduationCap, ArrowRight } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GOLD, GOLD_SOFT, INK, INK_SOFT, BG, SANS, SERIF, Reveal, Eyebrow, Headline, GlassCard, Wordmark, TianOSKeyframes } from './components/tianos';

// Pages
const FounderStoryPage = lazy(() => import('./pages/FounderStoryPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const ParentDashboardPage = lazy(() => import('./pages/ParentDashboardPage'));
const ChildProfilePage = lazy(() => import('./pages/ChildProfilePage'));
const TutorSearchPage = lazy(() => import('./pages/TutorSearchPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const TutorProfilePage = lazy(() => import('./pages/TutorProfilePage'));
const ResourcesHubPage = lazy(() => import('./pages/ResourcesHubPage'));
const ResourceDetailPage = lazy(() => import('./pages/ResourceDetailPage'));
const SciencePracticePage = lazy(() => import('./pages/SciencePracticePage'));
const WorksheetGeneratorPage = lazy(() => import('./pages/WorksheetGeneratorPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const ParentProgressPage = lazy(() => import('./pages/ParentProgressPage'));
import AdminDashboard from './components/AdminDashboard';
import TutorOnboarding from './components/TutorOnboarding';
import ParentProfile from './components/ParentProfile';
import PwaManager from './components/PwaManager';
import ErrorBoundary from './components/ErrorBoundary';
import LifeLabLayout from './components/LifeLab/LifeLabLayout';

// Tian OS unified shell (Phase 1 foundation)
import { WorkspaceProvider } from './context/WorkspaceContext';
import AppShell from './components/shell/AppShell';
import { ToastProvider } from './components/ui';
import { ROLE_HOME } from './config/nav';
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
import Placeholder from './pages/Placeholder';
// MathPath (Phase 2)
const MathPathHome = lazy(() => import('./pages/student/mathpath/MathPathHome'));
const TopicDetail = lazy(() => import('./pages/student/mathpath/TopicDetail'));
const PracticeSession = lazy(() => import('./pages/student/mathpath/PracticeSession'));
const PracticeResult = lazy(() => import('./pages/student/mathpath/PracticeResult'));
const MistakeReview = lazy(() => import('./pages/student/mathpath/MistakeReview'));
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'));
// Spelling Practice (Phase 6) — shared-core wiring
const SpellingHome = lazy(() => import('./pages/student/spelling/SpellingHome'));
const SpellingWordLists = lazy(() => import('./pages/student/spelling/WordLists'));
const SpellingLearn = lazy(() => import('./pages/student/spelling/LearnMode'));
const SpellingSelfTest = lazy(() => import('./pages/student/spelling/SelfTest'));
const SpellingPracticeResults = lazy(() => import('./pages/student/spelling/SpellingResults'));
const SpellingPracticeMistakes = lazy(() => import('./pages/student/spelling/SpellingMistakes'));
const StudentLifeLab = lazy(() => import('./pages/student/StudentLifeLab'));
const SkillGraph = lazy(() => import('./pages/student/SkillGraph'));
const StudentWorksheets = lazy(() => import('./pages/student/StudentWorksheets'));
// MathPath features (Phase 4): Fluency + Mistake-to-Mastery
const FluencyHome = lazy(() => import('./pages/student/mathpath/fluency/FluencyHome'));
const FluencySkills = lazy(() => import('./pages/student/mathpath/fluency/FluencySkills'));
const MistakesHome = lazy(() => import('./pages/student/mathpath/MistakesHome'));
const MistakeDetail = lazy(() => import('./pages/student/mathpath/MistakeDetail'));
// Science Adaptive Revision (secondary module) — reuses shared practice/result screens
const ScienceHome = lazy(() => import('./pages/student/science/ScienceHome'));
const ScienceTopics = lazy(() => import('./pages/student/science/ScienceTopics'));
const ScienceMistakes = lazy(() => import('./pages/student/science/ScienceMistakes'));
// Parent (Phase 3)
const ParentHome = lazy(() => import('./pages/parent/ParentHome'));
const ParentChildren = lazy(() => import('./pages/parent/ParentChildren'));
const ChildProgress = lazy(() => import('./pages/parent/ChildProgress'));
const ChildScience = lazy(() => import('./pages/parent/ChildScience'));
const ChildLifeLab = lazy(() => import('./pages/parent/ChildLifeLab'));
const WeakTopics = lazy(() => import('./pages/parent/WeakTopics'));
const RecommendedActions = lazy(() => import('./pages/parent/RecommendedActions'));
const AssignPractice = lazy(() => import('./pages/parent/AssignPractice'));
const MistakeHistory = lazy(() => import('./pages/parent/MistakeHistory'));
const ChildAssignments = lazy(() => import('./pages/parent/ChildAssignments'));
// Tutor (Phase 4)
const TutorHome = lazy(() => import('./pages/tutor/TutorHome'));
const AssignedStudents = lazy(() => import('./pages/tutor/AssignedStudents'));
const TutorStudentProfile = lazy(() => import('./pages/tutor/TutorStudentProfile'));
const LessonPrep = lazy(() => import('./pages/tutor/LessonPrep'));
const LessonNotes = lazy(() => import('./pages/tutor/LessonNotes'));
const AssignHomework = lazy(() => import('./pages/tutor/AssignHomework'));
const TutorHomework = lazy(() => import('./pages/tutor/TutorHomework'));
const TutorAvailability = lazy(() => import('./pages/tutor/Availability'));
const TutorTraining = lazy(() => import('./pages/tutor/Training'));
// Teacher (Phase 5)
const TeacherHome = lazy(() => import('./pages/teacher/TeacherHome'));
const Classes = lazy(() => import('./pages/teacher/Classes'));
const ClassOverview = lazy(() => import('./pages/teacher/ClassOverview'));
const ClassMasteryMap = lazy(() => import('./pages/teacher/ClassMasteryMap'));
const ClassStudents = lazy(() => import('./pages/teacher/ClassStudents'));
const Grouping = lazy(() => import('./pages/teacher/Grouping'));
const TeacherAssignPractice = lazy(() => import('./pages/teacher/AssignPractice'));
const Intervention = lazy(() => import('./pages/teacher/Intervention'));
const Reports = lazy(() => import('./pages/teacher/Reports'));
const TeacherStudentDetail = lazy(() => import('./pages/teacher/TeacherStudentDetail'));
const TeacherLifeLab = lazy(() => import('./pages/teacher/LifeLab'));
const TeacherLifeLabHome = lazy(() => import('./pages/teacher/LifeLabHome'));
// Parent worksheet generator (Phase 4)
// Secondary → Mechanisms Playground (D&T lower secondary)
const MechanismsHome = lazy(() => import('./pages/secondary/mechanisms/MechanismsHome'));
const MechanismSimulator = lazy(() => import('./pages/secondary/mechanisms/MechanismSimulator'));
const MechanismPresent = lazy(() => import('./pages/secondary/mechanisms/MechanismPresent'));

const WorksheetHome = lazy(() => import('./pages/parent/WorksheetHome'));
const WorksheetSetup = lazy(() => import('./pages/parent/WorksheetSetup'));
const WorksheetPreview = lazy(() => import('./pages/parent/WorksheetPreview'));

// Spelling app pages
const SpellingHomePage = lazy(() => import('./pages/spelling/SpellingHomePage'));
const SpellingListsPage = lazy(() => import('./pages/spelling/SpellingListsPage'));
const SpellingEditorPage = lazy(() => import('./pages/spelling/SpellingEditorPage'));
const SpellingListDetailPage = lazy(() => import('./pages/spelling/SpellingListDetailPage'));
const SpellingLibraryPage = lazy(() => import('./pages/spelling/SpellingLibraryPage'));
const MisspeltWordsPage = lazy(() => import('./pages/spelling/MisspeltWordsPage'));
const SurpriseSpellingPage = lazy(() => import('./pages/spelling/SurpriseSpellingPage'));
const SpellingRevisionPage = lazy(() => import('./pages/spelling/SpellingRevisionPage'));
const SpellingDuePage = lazy(() => import('./pages/spelling/SpellingDuePage'));
const SpellingProgressPage = lazy(() => import('./pages/spelling/SpellingProgressPage'));
const SpellingAchievementsPage = lazy(() => import('./pages/spelling/SpellingAchievementsPage'));
const SpellingPrintPage = lazy(() => import('./pages/spelling/SpellingPrintPage'));

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

// Public Route (redirects logged-in users to their unified role home)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

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
    return <Navigate to={ROLE_HOME[user?.role] || '/student'} />;
  }

  return children;
};

// The legacy /dashboard is retired — send signed-in users to their unified
// Tian OS role home; send anyone not signed in to login.
const LegacyDashboardRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user?.role] || '/student'} replace />;
};

// Landing Page — cinematic Tian OS look (matches the launch video / founder story).
const LANDING_FEATURES = [
  { icon: Sparkles, title: 'Personalized by AI', body: 'Every mistake becomes targeted mastery — worksheets and revision adapt to each child.' },
  { icon: Layers, title: 'One connected profile', body: 'Spelling, maths and science progress unify into a single readiness picture for parents.' },
  { icon: GraduationCap, title: 'Powered by teachers', body: 'Expert tutors and an enrichment marketplace, matched to how your child learns.' },
];
const navLink = { color: INK_SOFT, fontFamily: SANS, fontWeight: 600, fontSize: 15, textDecoration: 'none' };

const LandingPage = () => (
  <div style={{ background: BG, color: INK, fontFamily: SANS, minHeight: '100vh', overflowX: 'hidden' }}>
    <TianOSKeyframes />
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
      <span style={{ color: INK, fontWeight: 700 }}>Tian OS</span> · AI-Native Learning. Built for Every Student. · © Tian Jun Education Group
    </footer>
  </div>
);

// Tian OS unified shell layout — protected, provides role/workspace context,
// renders the sidebar/topbar/bottom-nav around each role dashboard. Phase 1
// ships the student dashboard live; other role/feature screens are placeholders
// wired so navigation is whole. Existing routes (/dashboard etc.) are untouched.
const ShellLayout = () => (
  <ProtectedRoute>
    <WorkspaceProvider>
      <AppShell><Outlet /></AppShell>
    </WorkspaceProvider>
  </ProtectedRoute>
);

// Main App
function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
        <PwaManager />
        <ErrorBoundary>
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-bone border-t-navy-700" /></div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/founder" element={<FounderStoryPage />} />
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

          {/* Legacy dashboard retired → unified Tian OS role home */}
          <Route path="/dashboard" element={<LegacyDashboardRedirect />} />

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

          {/* LifeLab */}
          <Route path="/lifelab" element={<ProtectedRoute><LifeLabLayout /></ProtectedRoute>} />

          {/* ─── Tian OS unified shell (Phase 1 foundation) ─── */}
          <Route element={<ShellLayout />}>
            {/* Student — dashboard shell is live */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/mathpath" element={<MathPathHome />} />
            <Route path="/student/mathpath/topics/:topicId" element={<TopicDetail />} />
            <Route path="/student/mathpath/practice/:sessionId" element={<PracticeSession />} />
            <Route path="/student/mathpath/results/:sessionId" element={<PracticeResult />} />
            {/* Mistake-to-Mastery (MathPath feature) */}
            <Route path="/student/mathpath/mistakes" element={<MistakesHome />} />
            <Route path="/student/mathpath/mistakes/review" element={<MistakeReview />} />
            <Route path="/student/mathpath/mistakes/:mistakeId" element={<MistakeDetail />} />
            {/* Fluency (MathPath feature). Practice/results reuse the shared MathPath screens. */}
            <Route path="/student/mathpath/fluency" element={<FluencyHome />} />
            <Route path="/student/mathpath/fluency/skills" element={<FluencySkills />} />
            <Route path="/student/fluency" element={<Navigate to="/student/mathpath/fluency" replace />} />
            <Route path="/student/worksheets" element={<StudentWorksheets />} />
            {/* Science Adaptive Revision (secondary module). Practice/results reuse the shared screens. */}
            <Route path="/student/science" element={<ScienceHome />} />
            <Route path="/student/science/topics" element={<ScienceTopics />} />
            <Route path="/student/science/mistakes" element={<ScienceMistakes />} />
            <Route path="/student/science/practice/:sessionId" element={<PracticeSession />} />
            <Route path="/student/science/results/:sessionId" element={<PracticeResult />} />
            <Route path="/student/lifelab" element={<StudentLifeLab />} />
            {/* Spelling Practice (secondary module, English · Spelling) — shared core */}
            <Route path="/student/spelling" element={<SpellingHome />} />
            <Route path="/student/spelling/lists" element={<SpellingWordLists />} />
            <Route path="/student/spelling/lists/:listId/learn" element={<SpellingLearn />} />
            <Route path="/student/spelling/practice/:sessionId" element={<SpellingSelfTest />} />
            <Route path="/student/spelling/results/:sessionId" element={<SpellingPracticeResults />} />
            <Route path="/student/spelling/mistakes" element={<SpellingPracticeMistakes />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/progress" element={<SkillGraph />} />

            {/* Parent (Phase 3) */}
            <Route path="/parent" element={<ParentHome />} />
            <Route path="/parent/children" element={<ParentChildren />} />
            <Route path="/parent/children/:studentId/progress" element={<ChildProgress />} />
            <Route path="/parent/children/:studentId/science" element={<ChildScience />} />
            <Route path="/parent/children/:studentId/lifelab" element={<ChildLifeLab />} />
            <Route path="/parent/children/:studentId/weak-topics" element={<WeakTopics />} />
            <Route path="/parent/children/:studentId/actions" element={<RecommendedActions />} />
            <Route path="/parent/children/:studentId/assign-practice" element={<AssignPractice />} />
            <Route path="/parent/children/:studentId/mistakes" element={<MistakeHistory />} />
            <Route path="/parent/children/:studentId/assignments" element={<ChildAssignments />} />
            {/* Mastery Worksheet Generator (Phase 4) */}
            <Route path="/parent/children/:studentId/worksheets" element={<WorksheetHome />} />
            <Route path="/parent/children/:studentId/worksheets/new" element={<WorksheetSetup />} />
            <Route path="/parent/children/:studentId/worksheets/:worksheetId" element={<WorksheetPreview />} />

            {/* Tutor (Phase 4) */}
            <Route path="/tutor" element={<TutorHome />} />
            <Route path="/tutor/students" element={<AssignedStudents />} />
            <Route path="/tutor/students/:id" element={<TutorStudentProfile />} />
            <Route path="/tutor/students/:id/lesson-prep" element={<LessonPrep />} />
            <Route path="/tutor/students/:id/lesson-notes" element={<LessonNotes />} />
            <Route path="/tutor/students/:id/assign-homework" element={<AssignHomework />} />
            <Route path="/tutor/homework" element={<TutorHomework />} />
            <Route path="/tutor/availability" element={<TutorAvailability />} />
            <Route path="/tutor/training" element={<TutorTraining />} />

            {/* Teacher (Phase 5) */}
            <Route path="/teacher" element={<TeacherHome />} />
            <Route path="/teacher/classes" element={<Classes />} />
            <Route path="/teacher/classes/:id" element={<ClassOverview />} />
            <Route path="/teacher/classes/:id/mastery" element={<ClassMasteryMap />} />
            <Route path="/teacher/classes/:id/students" element={<ClassStudents />} />
            <Route path="/teacher/classes/:id/groups" element={<Grouping />} />
            <Route path="/teacher/classes/:id/assign" element={<TeacherAssignPractice />} />
            <Route path="/teacher/classes/:id/interventions" element={<Intervention />} />
            <Route path="/teacher/classes/:id/lifelab" element={<TeacherLifeLab />} />
            <Route path="/teacher/classes/:id/reports" element={<Reports />} />
            <Route path="/teacher/students/:id" element={<TeacherStudentDetail />} />
            <Route path="/teacher/lifelab" element={<TeacherLifeLabHome />} />

            {/* ─── Secondary → Mechanisms Playground (D&T) ─── */}
            <Route path="/secondary/mechanisms" element={<MechanismsHome />} />
            <Route path="/secondary/mechanisms/:mechanism" element={<MechanismSimulator />} />
            <Route path="/secondary/mechanisms/:mechanism/present" element={<MechanismPresent />} />

            {/* Shared "More" sheet */}
            <Route path="/more" element={<Placeholder title="More" />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
