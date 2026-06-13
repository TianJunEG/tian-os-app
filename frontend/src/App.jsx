import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { Sparkles, Layers, GraduationCap, ArrowRight, Brain, BarChart3, School } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CORAL, CORAL_GLOW, TEAL, TEAL_DARK, IVORY, SKY, INK, INK_SOFT, BG, SANS, SERIF, Reveal, Eyebrow, Headline, GlassCard, Wordmark, TianOSKeyframes } from './components/tianos';

// Demo
const StrokeReplayDemo = lazy(() => import('./pages/StrokeReplayDemo'));
const DiagramDemo = lazy(() => import('./pages/DiagramDemo'));

// Pages
const FounderStoryPage = lazy(() => import('./pages/FounderStoryPage'));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
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

// Tian OS unified shell (Phase 1 foundation)
import { WorkspaceProvider } from './context/WorkspaceContext';
import AppShell from './components/shell/AppShell';
import { ToastProvider, useToast } from './components/ui';
import { registerApiErrorHandler } from './services/api';
import { ROLE_HOME } from './config/nav';
import FeatureGuard from './components/FeatureGuard';
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const MorePage = lazy(() => import('./pages/MorePage'));
// MathPath (Phase 2)
const MathPathHome = lazy(() => import('./pages/student/mathpath/MathPathHome'));
const TopicDetail = lazy(() => import('./pages/student/mathpath/TopicDetail'));
const PracticeSession = lazy(() => import('./pages/student/mathpath/PracticeSession'));
const PracticeResult = lazy(() => import('./pages/student/mathpath/PracticeResult'));
const QuestionReviewPage = lazy(() => import('./pages/student/mathpath/QuestionReviewPage'));
const MathPathAssignments = lazy(() => import('./pages/student/mathpath/MathPathAssignments'));
const RecoveryPackTeachingFlow = lazy(() => import('./pages/student/mathpath/RecoveryPackTeachingFlow'));
const RemediationJourney = lazy(() => import('./pages/student/mathpath/RemediationJourney'));
const FractionsLearningPathPage = lazy(() => import('./pages/student/mathpath/FractionsLearningPathPage'));
const P1LearningPathPage = lazy(() => import('./pages/student/mathpath/P1LearningPathPage'));
const P2LearningPathPage = lazy(() => import('./pages/student/mathpath/P2LearningPathPage'));
const P3LearningPathPage = lazy(() => import('./pages/student/mathpath/P3LearningPathPage'));
const P4LearningPathPage = lazy(() => import('./pages/student/mathpath/P4LearningPathPage'));
const P5LearningPathPage = lazy(() => import('./pages/student/mathpath/P5LearningPathPage'));
const P6LearningPathPage = lazy(() => import('./pages/student/mathpath/P6LearningPathPage'));
const FractionsStoryModeSession = lazy(() => import('./pages/student/mathpath/FractionsStoryModeSession'));
const StoryModeDomainRoute = lazy(() => import('./pages/student/mathpath/StoryModeDomainRoute'));
const FractionsModelTrainer = lazy(() => import('./pages/student/mathpath/FractionsModelTrainer'));
const SimilarQuestionPractice = lazy(() => import('./pages/student/mathpath/SimilarQuestionPractice'));
const UploadPaperPage = lazy(() => import('./pages/student/mathpath/UploadPaperPage'));
const MistakeReview = lazy(() => import('./pages/student/mathpath/MistakeReview'));
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'));
const InformalAssessment = lazy(() => import('./pages/student/InformalAssessment'));
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
const StudentWorksheetSetup = lazy(() => import('./pages/student/worksheets/WorksheetSetup'));
const StudentWorksheetPreview = lazy(() => import('./pages/student/worksheets/WorksheetPreview'));
// MathPath features (Phase 4): Fluency + Mistake-to-Mastery
const FluencyHome = lazy(() => import('./pages/student/mathpath/fluency/FluencyHome'));
const FluencySkills = lazy(() => import('./pages/student/mathpath/fluency/FluencySkills'));
const TimesTablesHome = lazy(() => import('./pages/student/mathpath/fluency/TimesTablesHome'));
const TimesTablesFlashQuiz = lazy(() => import('./pages/student/mathpath/fluency/TimesTablesFlashQuiz'));
const MistakesHome = lazy(() => import('./pages/student/mathpath/MistakesHome'));
const MistakeDetail = lazy(() => import('./pages/student/mathpath/MistakeDetail'));
const DiagnosticIntroScreen = lazy(() => import('./pages/student/mathpath/diagnostic/DiagnosticIntroScreen'));
const DiagnosticQuestionScreen = lazy(() => import('./pages/student/mathpath/diagnostic/DiagnosticQuestionScreen'));
const DiagnosticResultScreen = lazy(() => import('./pages/student/mathpath/diagnostic/DiagnosticResultScreen'));
const AssessmentIntroScreen = lazy(() => import('./pages/student/mathpath/assessment/AssessmentIntroScreen'));
const AssessmentQuestionScreen = lazy(() => import('./pages/student/mathpath/assessment/AssessmentQuestionScreen'));
const AssessmentReviewScreen = lazy(() => import('./pages/student/mathpath/assessment/AssessmentReviewScreen'));
const AssessmentWorkingPromptScreen = lazy(() => import('./pages/student/mathpath/assessment/AssessmentWorkingPromptScreen'));
const AssessmentResultScreen = lazy(() => import('./pages/student/mathpath/assessment/AssessmentResultScreen'));
const TestSpecificationPage = lazy(() => import('./pages/mathpath/TestSpecificationPage'));
const AssessmentUploadPage = lazy(() => import('./pages/mathpath/AssessmentUploadPage'));
const PaperAnalysisPage = lazy(() => import('./pages/mathpath/PaperAnalysisPage'));
const PilotAnalyticsPage = lazy(() => import('./pages/admin/PilotAnalyticsPage'));
const PilotInterventionsPage = lazy(() => import('./pages/admin/PilotInterventionsPage'));
const QuestionQualityPage = lazy(() => import('./pages/admin/QuestionQualityPage'));
const FractionsSkillIntegrityPage = lazy(() => import('./pages/admin/FractionsSkillIntegrityPage'));
const QuestionVisualQualityPage = lazy(() => import('./pages/admin/QuestionVisualQualityPage'));
const DiagnosticValidationPage = lazy(() => import('./pages/admin/DiagnosticValidationPage'));
const RemediationQualityPage = lazy(() => import('./pages/admin/RemediationQualityPage'));
const LearningPathQualityPage = lazy(() => import('./pages/admin/LearningPathQualityPage'));
const RecoveryPackAssetsPage = lazy(() => import('./pages/admin/RecoveryPackAssetsPage'));
const DomainHealthPage = lazy(() => import('./pages/admin/DomainHealthPage'));
const MisconceptionCoveragePage = lazy(() => import('./pages/admin/MisconceptionCoveragePage'));
const BillingPage = lazy(() => import('./pages/admin/BillingPage'));
const PartnersPage = lazy(() => import('./pages/admin/PartnersPage'));
const PartnerDetailPage = lazy(() => import('./pages/admin/PartnerDetailPage'));
const WorkingUploadScreen = lazy(() => import('./pages/student/mathpath/working/WorkingUploadScreen'));
const WorkingUploadReviewScreen = lazy(() => import('./pages/student/mathpath/working/WorkingUploadReviewScreen'));
const WorkingUploadSuccessScreen = lazy(() => import('./pages/student/mathpath/working/WorkingUploadSuccessScreen'));
// Problem Solving Lab (PSL) — guided word-problem reasoning
const PSLHome = lazy(() => import('./pages/student/psl/PSLHome'));
const PSLSession = lazy(() => import('./pages/student/psl/PSLSession'));
const PSLResults = lazy(() => import('./pages/student/psl/PSLResults'));
const PSLMistakeReview = lazy(() => import('./pages/student/psl/PSLMistakeReview'));
const PSLDecisionGuide = lazy(() => import('./pages/student/psl/DecisionGuide'));
// Science Adaptive Revision (secondary module) — reuses shared practice/result screens
const ScienceHome = lazy(() => import('./pages/student/science/ScienceHome'));
const ScienceTopics = lazy(() => import('./pages/student/science/ScienceTopics'));
const ScienceMistakes = lazy(() => import('./pages/student/science/ScienceMistakes'));
const ScienceTopicNotes = lazy(() => import('./pages/student/science/ScienceTopicNotes'));
const ScienceTopicLesson = lazy(() => import('./pages/student/science/ScienceTopicLesson'));
const ScienceNotes = lazy(() => import('./pages/student/science/ScienceNotes'));
// Parent (Phase 3)
const ParentHome = lazy(() => import('./pages/parent/ParentHome'));
const ParentNotifications = lazy(() => import('./pages/parent/Notifications'));
const ParentLessonReplay = lazy(() => import('./pages/parent/LessonReplay'));
const ParentLinkRequests = lazy(() => import('./pages/parent/LinkRequests'));
const AgencyDashboard = lazy(() => import('./pages/agency/AgencyDashboard'));
const TutorAgencyMembership = lazy(() => import('./pages/tutor/AgencyMembership'));
const TutorRequestStudentLink = lazy(() => import('./pages/tutor/RequestStudentLink'));
const PartnerLicencePage = lazy(() => import('./pages/admin/PartnerLicencePage'));
const ParentChildren = lazy(() => import('./pages/parent/ParentChildren'));
const ChildProgress = lazy(() => import('./pages/parent/ChildProgress'));
const ParentSuccessCentre = lazy(() => import('./pages/parent/ParentSuccessCentre'));
const ParentMathPathDashboardPage = lazy(() => import('./pages/parent/ParentMathPathDashboardPage'));
const ChildScience = lazy(() => import('./pages/parent/ChildScience'));
const ChildLifeLab = lazy(() => import('./pages/parent/ChildLifeLab'));
const WeakTopics = lazy(() => import('./pages/parent/WeakTopics'));
const RecommendedActions = lazy(() => import('./pages/parent/RecommendedActions'));
const AssignPractice = lazy(() => import('./pages/parent/AssignPractice'));
const MistakeHistory = lazy(() => import('./pages/parent/MistakeHistory'));
const ChildAssignments = lazy(() => import('./pages/parent/ChildAssignments'));
const StudentCareDashboard = lazy(() => import('./pages/studentCare/StudentCareDashboard'));
const StudentCareHomework = lazy(() => import('./pages/studentCare/StudentCareHomework'));
const StudentCareRecoveryPacks = lazy(() => import('./pages/studentCare/StudentCareRecoveryPacks'));
const StudentCareRechecks = lazy(() => import('./pages/studentCare/StudentCareRechecks'));
const StudentCareReports = lazy(() => import('./pages/studentCare/StudentCareReports'));
// Tutor (Phase 4)
const TutorHome = lazy(() => import('./pages/tutor/TutorHome'));
const AssignedStudents = lazy(() => import('./pages/tutor/AssignedStudents'));
const TutorStudentProfile = lazy(() => import('./pages/tutor/TutorStudentProfile'));
const TutorMathPathDashboardPage = lazy(() => import('./pages/tutor/TutorMathPathDashboardPage'));
const TutorPSLDashboardPage = lazy(() => import('./pages/tutor/TutorPSLDashboardPage'));
const LessonPrep = lazy(() => import('./pages/tutor/LessonPrep'));
const LessonNotes = lazy(() => import('./pages/tutor/LessonNotes'));
const LessonRecorder = lazy(() => import('./pages/tutor/LessonRecorder'));
const AssignHomework = lazy(() => import('./pages/tutor/AssignHomework'));
const TutorHomework = lazy(() => import('./pages/tutor/TutorHomework'));
const TutorAvailability = lazy(() => import('./pages/tutor/Availability'));
const TutorTraining = lazy(() => import('./pages/tutor/Training'));
const TutorExplanationRecorder = lazy(() => import('./pages/tutor/TutorExplanationRecorder'));
// Teacher (Phase 5)
const TeacherHome = lazy(() => import('./pages/teacher/TeacherHome'));
const Classes = lazy(() => import('./pages/teacher/Classes'));
const ClassOverview = lazy(() => import('./pages/teacher/ClassOverview'));
const TeacherMathPathDashboardPage = lazy(() => import('./pages/teacher/TeacherMathPathDashboardPage'));
const TeacherPSLDashboardPage = lazy(() => import('./pages/teacher/TeacherPSLDashboardPage'));
const SchoolAdminConsole = lazy(() => import('./pages/admin/school/SchoolAdminConsole'));
const TutorInviteConnectPage = lazy(() => import('./pages/TutorInviteConnectPage'));
const ParentInviteConnectPage = lazy(() => import('./pages/ParentInviteConnectPage'));
const JoinClassPage = lazy(() => import('./pages/student/JoinClassPage'));
const BillingSuccessPage = lazy(() => import('./pages/BillingSuccessPage'));
const PremiumHomeUpgradePage = lazy(() => import('./pages/parent/PremiumHomeUpgradePage'));
const PendingUpgradesPage = lazy(() => import('./pages/admin/PendingUpgradesPage'));
const ClassMasteryMap = lazy(() => import('./pages/teacher/ClassMasteryMap'));
const ClassStudents = lazy(() => import('./pages/teacher/ClassStudents'));
const Grouping = lazy(() => import('./pages/teacher/Grouping'));
const WeakGroups = lazy(() => import('./pages/teacher/WeakGroups'));
const TeacherAssignPractice = lazy(() => import('./pages/teacher/AssignPractice'));
const TeacherAssessments = lazy(() => import('./pages/teacher/Assessments'));
const TeacherCreateAssessment = lazy(() => import('./pages/teacher/CreateAssessment'));
const TeacherAssessmentResults = lazy(() => import('./pages/teacher/AssessmentResults'));
const Intervention = lazy(() => import('./pages/teacher/Intervention'));
const TeacherWorksheets = lazy(() => import('./pages/teacher/TeacherWorksheets'));
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
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleGuard = ({ role, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : [user?.role].filter(Boolean);
  if (!roles.includes(role)) {
    return <Navigate to={ROLE_HOME[user?.role] || '/student'} replace />;
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
    return <Navigate to={ROLE_HOME[user?.role] || '/student'} replace />;
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

// Landing Page — B2B marketing design system (ocean green / paper).
// Shares typography + layout with the Our Story page; hero is deep ocean green.
const B2B_NAVY = '#062b22';
const B2B_NAVY_DEEP = '#031a13';
const B2B_PAPER = '#f4efe6';
const B2B_INK = '#1d2230';
const B2B_BODY = '#3a4150';
const B2B_BODY_MUTED = '#5c6472';
const B2B_PERIWINKLE = '#34d399';
const B2B_PERIWINKLE_SOFT = '#6ee7b7';
const B2B_GOLD = '#cf8a44';
const B2B_TEXT_LIGHT = '#f4f0e8';
const B2B_TEXT_CREAM = '#f6f2ea';
const B2B_TEXT_MUTED_DARK = '#a4c4b5';
const B2B_TEXT_DIM_DARK = '#7a9e8e';
const B2B_TEXT_FOOTER = '#8a8270';
const B2B_BORDER_WARM = '#e1d9ca';
const B2B_NEWSREADER = "'Newsreader', serif";
const B2B_SANS = "'Hanken Grotesk', system-ui, sans-serif";
const B2B_MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

const LANDING_CSS = `
  html { scroll-behavior: smooth; }
  ::selection { background: #cf8a44; color: #011A14; }
  @media (max-width: 768px) {
    .landing-nav-links { display: none !important; }
    .landing-features-grid { grid-template-columns: 1fr !important; }
    .landing-page > section { padding-left: 20px !important; padding-right: 20px !important; }
    .landing-page header { padding-left: 20px !important; padding-right: 20px !important; }
    .landing-hero-ctas { flex-direction: column; align-items: center; }
  }
`;

const LANDING_FEATURES = [
  { icon: Brain, title: 'Adaptive & personalised', body: 'AI diagnoses skill gaps and generates targeted practice — every student gets an individualised learning path at scale.' },
  { icon: BarChart3, title: 'Real-time visibility', body: 'Unified dashboards surface mastery data, misconceptions and progress across classes — no more spreadsheet tracking.' },
  { icon: School, title: 'Teacher-designed', body: 'Built with experienced educators and aligned to curriculum standards. Your teachers stay in control; AI handles the differentiation.' },
];

function LandingTianLogo({ light = false }) {
  const size = 26;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.27,
        background: `linear-gradient(135deg, ${B2B_PERIWINKLE}, ${B2B_PERIWINKLE_SOFT})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: B2B_NEWSREADER, fontWeight: 600, color: B2B_NAVY_DEEP, fontSize: size * 0.65,
      }}>T</div>
      <span style={{ fontWeight: 600, fontSize: size * 0.65, letterSpacing: '-0.01em', color: light ? B2B_TEXT_LIGHT : B2B_INK, whiteSpace: 'nowrap' }}>Tian OS</span>
    </div>
  );
}

function LandingReveal({ children, delay = 0, style = {} }) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(26px)',
      transition: `opacity .9s cubic-bezier(.2,.65,.2,1) ${delay}s, transform .9s cubic-bezier(.2,.65,.2,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

const LandingPage = () => (
  <div className="landing-page" style={{ background: B2B_PAPER, color: B2B_INK, fontFamily: B2B_SANS, minHeight: '100vh', overflowX: 'hidden', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textRendering: 'optimizeLegibility' }}>
    <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" />

    {/* ── HERO ── */}
    <section style={{ position: 'relative', background: '#011A14', color: B2B_TEXT_LIGHT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/hero-ocean.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(165deg, rgba(1,26,20,0.7) 0%, rgba(2,44,34,0.4) 50%, rgba(6,78,59,0.3) 100%)' }} />

      <header style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none' }}><LandingTianLogo light /></Link>
        <nav className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: 14.5, color: B2B_TEXT_MUTED_DARK }}>
          <Link to="/founder" style={{ color: 'inherit', textDecoration: 'none' }}>Our Story</Link>
          <Link to="/edu-apps" style={{ color: 'inherit', textDecoration: 'none' }}>Platform</Link>
          <span>For Schools</span>
          <Link to="/register" style={{ border: '1px solid rgba(255,255,255,0.18)', padding: '9px 18px', borderRadius: 999, color: B2B_TEXT_LIGHT, whiteSpace: 'nowrap', textDecoration: 'none' }}>Book a demo</Link>
        </nav>
      </header>

      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '80px 40px 130px' }}>
        <LandingReveal>
          <div style={{ fontFamily: B2B_MONO, fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: B2B_PERIWINKLE_SOFT, marginBottom: 28 }}>
            AI-Native Learning Infrastructure
          </div>
        </LandingReveal>
        <LandingReveal delay={0.1}>
          <h1 style={{ fontFamily: B2B_NEWSREADER, fontWeight: 400, fontSize: 'clamp(42px, 6.2vw, 88px)', lineHeight: 1.02, letterSpacing: '-0.022em', margin: 0, maxWidth: '18ch', color: B2B_TEXT_CREAM }}>
            Close learning gaps across your school — at{' '}
            <em style={{ fontStyle: 'italic', color: B2B_PERIWINKLE_SOFT }}>scale</em>.
          </h1>
        </LandingReveal>
        <LandingReveal delay={0.2}>
          <p style={{ marginTop: 30, fontSize: 19.5, lineHeight: 1.7, color: B2B_TEXT_MUTED_DARK, maxWidth: 640 }}>
            Evidence-based intervention tools powered by AI, guided by teachers. Diagnostic assessment, targeted practice, and real-time mastery data — deployed school-wide.
          </p>
        </LandingReveal>
        <LandingReveal delay={0.3} style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <Link to="/register" className="landing-hero-ctas" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 32px', borderRadius: 999, background: B2B_PERIWINKLE, color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 20px 40px -12px rgba(52,211,153,0.45)' }}>
            Book a demo <ArrowRight size={18} />
          </Link>
          <Link to="/founder" style={{ padding: '15px 32px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: B2B_TEXT_LIGHT, fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
            Read our story
          </Link>
        </LandingReveal>
      </div>
    </section>

    {/* ── EVIDENCE-BASED ── */}
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 40px 20px' }}>
      <LandingReveal>
        <div style={{ fontFamily: B2B_MONO, fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#2ba87a', marginBottom: 28 }}>
          Evidence-based approach
        </div>
      </LandingReveal>
      <LandingReveal delay={0.1}>
        <h2 style={{ fontFamily: B2B_NEWSREADER, fontWeight: 400, fontSize: 'clamp(32px, 4.4vw, 54px)', lineHeight: 1.08, letterSpacing: '-0.02em', margin: '0 0 30px', color: B2B_INK }}>
          Intervention tools grounded in research
        </h2>
      </LandingReveal>
      <LandingReveal delay={0.15}>
        <p style={{ marginBottom: 16, color: B2B_BODY, fontSize: 18.5, lineHeight: 1.72, maxWidth: 860 }}>
          Tian OS is built around established mathematics intervention practices: diagnostic assessment, targeted skill-gap practice, visual models, guided review, progress monitoring and data-informed remediation — deployed school-wide.
        </p>
      </LandingReveal>
      <LandingReveal delay={0.2}>
        <p style={{ marginBottom: 16, color: B2B_BODY, fontSize: 18.5, lineHeight: 1.72, maxWidth: 860 }}>
          Instead of only marking answers right or wrong, the platform analyses confidence, timing, misconceptions and working evidence — giving educators the insight to intervene early and at scale.
        </p>
      </LandingReveal>
      <LandingReveal delay={0.25}>
        <p style={{ color: B2B_BODY_MUTED, fontSize: 15, lineHeight: 1.7, maxWidth: 860 }}>
          Aligned with intervention principles from the Institute of Education Sciences' What Works Clearinghouse and the National Center on Intensive Intervention.
        </p>
      </LandingReveal>
    </section>

    {/* ── FEATURES ── */}
    <section style={{ maxWidth: 1180, margin: '0 auto', padding: '80px 40px 100px' }}>
      <div className="landing-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {LANDING_FEATURES.map((f, i) => (
          <LandingReveal key={f.title} delay={i * 0.1}>
            <div style={{ background: '#fff', border: `1px solid ${B2B_BORDER_WARM}`, borderRadius: 16, padding: 32, height: '100%' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(52,211,153,0.12)', display: 'grid', placeItems: 'center', marginBottom: 20 }}>
                <f.icon size={24} color={B2B_PERIWINKLE} />
              </div>
              <h3 style={{ fontFamily: B2B_NEWSREADER, fontWeight: 400, fontSize: 24, color: B2B_INK, margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontSize: 15.5, color: B2B_BODY_MUTED, margin: 0, lineHeight: 1.65 }}>{f.body}</p>
            </div>
          </LandingReveal>
        ))}
      </div>
    </section>

    {/* ── CTA BAND ── */}
    <section style={{ background: `linear-gradient(180deg, ${B2B_NAVY} 0%, ${B2B_NAVY_DEEP} 100%)`, padding: '80px 40px', textAlign: 'center' }}>
      <LandingReveal>
        <div style={{ fontFamily: B2B_MONO, fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: B2B_PERIWINKLE_SOFT, marginBottom: 24 }}>
          Get started
        </div>
      </LandingReveal>
      <LandingReveal delay={0.1}>
        <h2 style={{ fontFamily: B2B_NEWSREADER, fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.02em', margin: '0 auto 20px', maxWidth: 700, color: B2B_TEXT_CREAM }}>
          See how Tian OS works for your school
        </h2>
      </LandingReveal>
      <LandingReveal delay={0.15}>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: B2B_TEXT_MUTED_DARK, maxWidth: 540, margin: '0 auto 40px' }}>
          Book a 20-minute walkthrough with our team. We'll show you the platform, answer questions, and help you plan a pilot.
        </p>
      </LandingReveal>
      <LandingReveal delay={0.2}>
        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '16px 36px', borderRadius: 999, background: B2B_PERIWINKLE, color: '#fff', fontWeight: 700, fontSize: 16.5, textDecoration: 'none', boxShadow: '0 20px 40px -12px rgba(52,211,153,0.45)' }}>
          Book a demo <ArrowRight size={18} />
        </Link>
      </LandingReveal>
    </section>

    {/* ── FOOTER ── */}
    <footer style={{ borderTop: `1px solid ${B2B_BORDER_WARM}`, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: B2B_TEXT_FOOTER, flexWrap: 'wrap', gap: 12 }}>
      <LandingTianLogo />
      <span>© Tian Jun Education Group · AI-Native Learning Infrastructure for Schools</span>
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
// Bridges the axios interceptor (which runs outside React) to the toast system.
// Surfaces server (5xx) and rate-limit (429) errors that would otherwise fail
// silently, throttled to one toast per window so background-call bursts (e.g.
// telemetry mirrors) can't spam the student.
function ApiErrorToastBridge() {
  const toast = useToast();
  React.useEffect(() => {
    let lastShownAt = 0;
    registerApiErrorHandler(({ message }) => {
      const now = Date.now();
      if (now - lastShownAt < 5000) return;
      lastShownAt = now;
      toast(message, { tone: 'error' });
    });
    return () => registerApiErrorHandler(null);
  }, [toast]);
  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
        <ApiErrorToastBridge />
        <PwaManager />
        <ErrorBoundary>
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-bone border-t-navy-700" /></div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo/stroke-replay" element={<StrokeReplayDemo />} />
          <Route path="/demo/diagrams" element={<DiagramDemo />} />
          <Route path="/founder" element={<FounderStoryPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
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
          <Route path="/connect/tutor/:token" element={<TutorInviteConnectPage />} />
          <Route path="/connect/parent/:token" element={<ParentInviteConnectPage />} />
          <Route path="/join" element={<ProtectedRoute><JoinClassPage /></ProtectedRoute>} />
          <Route path="/join/:code" element={<ProtectedRoute><JoinClassPage /></ProtectedRoute>} />
          <Route path="/billing/success" element={<ProtectedRoute><BillingSuccessPage /></ProtectedRoute>} />
          <Route path="/parent/upgrade" element={<RoleGuard role="parent"><PremiumHomeUpgradePage /></RoleGuard>} />
          <Route path="/admin/pending-upgrades" element={<ProtectedRoute><FeatureGuard feature="admin"><PendingUpgradesPage /></FeatureGuard></ProtectedRoute>} />

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

          <Route path="/children" element={<ProtectedRoute><FeatureGuard feature="parent" comingSoonAllowed={true}><ParentDashboardPage /></FeatureGuard></ProtectedRoute>} />

          <Route path="/children/:childId" element={<ProtectedRoute><FeatureGuard feature="parent" comingSoonAllowed={true}><ChildProfilePage /></FeatureGuard></ProtectedRoute>} />

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

          <Route path="/worksheets" element={<ProtectedRoute><FeatureGuard feature="worksheets"><WorksheetGeneratorPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ParentProgressPage /></ProtectedRoute>} />
          <Route path="/tutor/onboarding" element={<ProtectedRoute><TutorOnboarding /></ProtectedRoute>} />
          <Route path="/parent/profile" element={<ProtectedRoute><ParentProfile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><FeatureGuard feature="admin"><AdminDashboard /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/pilot-analytics" element={<ProtectedRoute><FeatureGuard feature="admin"><PilotAnalyticsPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/pilot/interventions" element={<ProtectedRoute><FeatureGuard feature="admin"><PilotInterventionsPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/question-quality" element={<ProtectedRoute><FeatureGuard feature="admin"><QuestionQualityPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/fractions-skill-integrity" element={<ProtectedRoute><FeatureGuard feature="admin"><FractionsSkillIntegrityPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/question-visual-quality" element={<ProtectedRoute><FeatureGuard feature="admin"><QuestionVisualQualityPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/diagnostic-validation" element={<ProtectedRoute><FeatureGuard feature="admin"><DiagnosticValidationPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/remediation-quality" element={<ProtectedRoute><FeatureGuard feature="admin"><RemediationQualityPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/learning-path-quality" element={<ProtectedRoute><FeatureGuard feature="admin"><LearningPathQualityPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/recovery-pack-assets" element={<ProtectedRoute><FeatureGuard feature="admin"><RecoveryPackAssetsPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/domain-health" element={<ProtectedRoute><FeatureGuard feature="admin"><DomainHealthPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/misconception-coverage" element={<ProtectedRoute><FeatureGuard feature="admin"><MisconceptionCoveragePage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/billing" element={<ProtectedRoute><FeatureGuard feature="admin"><BillingPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/partners" element={<ProtectedRoute><FeatureGuard feature="admin"><PartnersPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/partners/:partnerId" element={<ProtectedRoute><FeatureGuard feature="admin"><PartnerDetailPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/admin/mathpath/assessment-upload" element={<ProtectedRoute><FeatureGuard feature="admin"><AssessmentUploadPage /></FeatureGuard></ProtectedRoute>} />

          {/* Spelling app */}
          <Route path="/spelling" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingHomePage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/lists" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingListsPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/lists/new" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingEditorPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/lists/:id" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingListDetailPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/lists/:id/edit" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingEditorPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/library" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingLibraryPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/misspelt" element={<ProtectedRoute><FeatureGuard feature="spelling"><MisspeltWordsPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/surprise" element={<ProtectedRoute><FeatureGuard feature="spelling"><SurpriseSpellingPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/revision" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingRevisionPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/due" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingDuePage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/progress" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingProgressPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/achievements" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingAchievementsPage /></FeatureGuard></ProtectedRoute>} />
          <Route path="/spelling/lists/:id/print" element={<ProtectedRoute><FeatureGuard feature="spelling"><SpellingPrintPage /></FeatureGuard></ProtectedRoute>} />

          {/* ─── Tian OS unified shell (Phase 1 foundation) ─── */}
          <Route element={<ShellLayout />}>
            {/* Student — dashboard shell is live */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/mathpath" element={<MathPathHome />} />
            <Route path="/student/mathpath/topics/:topicId" element={<TopicDetail />} />
            <Route path="/student/mathpath/practice/:sessionId" element={<PracticeSession />} />
            <Route path="/student/mathpath/results/:sessionId" element={<PracticeResult />} />
            <Route path="/student/mathpath/review" element={<QuestionReviewPage />} />
            <Route path="/student/mathpath/assignments" element={<MathPathAssignments />} />
            <Route path="/student/mathpath/recovery-pack/:assignmentId" element={<RecoveryPackTeachingFlow />} />
            <Route path="/student/mathpath/remediation/:id" element={<RemediationJourney />} />
            <Route path="/student/mathpath/path" element={<FractionsLearningPathPage />} />
            <Route path="/student/mathpath/p1" element={<P1LearningPathPage />} />
            <Route path="/student/mathpath/p2" element={<P2LearningPathPage />} />
            <Route path="/student/mathpath/p3" element={<P3LearningPathPage />} />
            <Route path="/student/mathpath/p4" element={<P4LearningPathPage />} />
            <Route path="/student/mathpath/p5" element={<P5LearningPathPage />} />
            <Route path="/student/mathpath/p6" element={<P6LearningPathPage />} />
            <Route path="/student/mathpath/fractions/story" element={<FractionsStoryModeSession />} />
            <Route path="/student/mathpath/fractions/story/:skillId" element={<FractionsStoryModeSession />} />
            <Route path="/student/mathpath/:domain/story" element={<StoryModeDomainRoute />} />
            <Route path="/student/mathpath/:domain/story/:skillId" element={<StoryModeDomainRoute />} />
            <Route path="/student/mathpath/fractions/model-trainer" element={<FractionsModelTrainer />} />
            <Route path="/student/mathpath/fractions/model-trainer/:templateId" element={<FractionsModelTrainer />} />
            <Route path="/student/mathpath/fractions/similar-practice/:practiceSetId" element={<SimilarQuestionPractice />} />
            {/* Mistake-to-Mastery (MathPath feature) */}
            <Route path="/student/mathpath/mistakes" element={<MistakesHome />} />
            <Route path="/student/mathpath/mistakes/review" element={<MistakeReview />} />
            <Route path="/student/mathpath/mistakes/:mistakeId" element={<MistakeDetail />} />
            <Route path="/student/mathpath/diagnostic" element={<DiagnosticIntroScreen />} />
            <Route path="/student/mathpath/diagnostic/session/:diagnosticSessionId" element={<DiagnosticQuestionScreen />} />
            <Route path="/student/mathpath/diagnostic/results/:diagnosticSessionId" element={<DiagnosticResultScreen />} />
            <Route path="/student/mathpath/assessment" element={<AssessmentIntroScreen />} />
            <Route path="/student/mathpath/test" element={<Navigate to="/student/mathpath/assessment" replace />} />
            <Route path="/student/mathpath/assessment/session/:assessmentSessionId" element={<AssessmentQuestionScreen />} />
            <Route path="/student/mathpath/assessment/review/:assessmentSessionId" element={<AssessmentReviewScreen />} />
            <Route path="/student/mathpath/assessment/working/:assessmentSessionId" element={<AssessmentWorkingPromptScreen />} />
            <Route path="/student/mathpath/assessment/results/:assessmentSessionId" element={<AssessmentResultScreen />} />
            <Route path="/student/mathpath/upload-paper" element={<UploadPaperPage />} />
            <Route path="/student/mathpath/working/upload" element={<WorkingUploadScreen />} />
            <Route path="/student/mathpath/working/review" element={<WorkingUploadReviewScreen />} />
            <Route path="/student/mathpath/working/success" element={<WorkingUploadSuccessScreen />} />
            {/* Fluency (MathPath feature). Practice/results reuse the shared MathPath screens. */}
            <Route path="/student/mathpath/fluency" element={<FluencyHome />} />
            <Route path="/student/mathpath/fluency/skills" element={<FluencySkills />} />
            <Route path="/student/mathpath/fluency/times-tables" element={<TimesTablesHome />} />
            <Route path="/student/mathpath/fluency/times-tables/flash-quiz" element={<TimesTablesFlashQuiz />} />
            <Route path="/student/fluency" element={<Navigate to="/student/mathpath/fluency" replace />} />
            <Route path="/student/worksheets" element={<FeatureGuard feature="worksheets"><StudentWorksheets /></FeatureGuard>} />
            <Route path="/student/worksheets/new" element={<FeatureGuard feature="worksheets"><StudentWorksheetSetup /></FeatureGuard>} />
            <Route path="/student/worksheets/:worksheetId" element={<FeatureGuard feature="worksheets"><StudentWorksheetPreview /></FeatureGuard>} />
            {/* Science Adaptive Revision (secondary module). Practice/results reuse the shared screens. */}
            <Route path="/student/science" element={<FeatureGuard feature="science"><ScienceHome /></FeatureGuard>} />
            <Route path="/student/science/topics" element={<FeatureGuard feature="science"><ScienceTopics /></FeatureGuard>} />
            <Route path="/student/science/mistakes" element={<FeatureGuard feature="science"><ScienceMistakes /></FeatureGuard>} />
            <Route path="/student/science/topic/:topicId/notes" element={<FeatureGuard feature="science"><ScienceTopicNotes /></FeatureGuard>} />
            <Route path="/student/science/topic/:topicId/lesson" element={<FeatureGuard feature="science"><ScienceTopicLesson /></FeatureGuard>} />
            <Route path="/student/science/notes" element={<FeatureGuard feature="science"><ScienceNotes /></FeatureGuard>} />
            <Route path="/student/science/practice/:sessionId" element={<FeatureGuard feature="science"><PracticeSession /></FeatureGuard>} />
            <Route path="/student/science/results/:sessionId" element={<FeatureGuard feature="science"><PracticeResult /></FeatureGuard>} />
            <Route path="/student/lifelab" element={<FeatureGuard feature="lifelab"><StudentLifeLab /></FeatureGuard>} />
            {/* Spelling Practice (secondary module, English · Spelling) — shared core */}
            <Route path="/student/spelling" element={<FeatureGuard feature="spelling"><SpellingHome /></FeatureGuard>} />
            <Route path="/student/spelling/lists" element={<FeatureGuard feature="spelling"><SpellingWordLists /></FeatureGuard>} />
            <Route path="/student/spelling/lists/:listId/learn" element={<FeatureGuard feature="spelling"><SpellingLearn /></FeatureGuard>} />
            <Route path="/student/spelling/practice/:sessionId" element={<FeatureGuard feature="spelling"><SpellingSelfTest /></FeatureGuard>} />
            <Route path="/student/spelling/results/:sessionId" element={<FeatureGuard feature="spelling"><SpellingPracticeResults /></FeatureGuard>} />
            <Route path="/student/spelling/mistakes" element={<FeatureGuard feature="spelling"><SpellingPracticeMistakes /></FeatureGuard>} />

            {/* Problem Solving Lab */}
            <Route path="/student/psl" element={<FeatureGuard feature="psl"><PSLHome /></FeatureGuard>} />
            <Route path="/student/psl/session/:sessionId" element={<FeatureGuard feature="psl"><PSLSession /></FeatureGuard>} />
            <Route path="/student/psl/results/:sessionId" element={<FeatureGuard feature="psl"><PSLResults /></FeatureGuard>} />
            <Route path="/student/psl/mistakes" element={<FeatureGuard feature="psl"><PSLMistakeReview /></FeatureGuard>} />
            <Route path="/student/psl/decision-guide" element={<FeatureGuard feature="psl"><PSLDecisionGuide /></FeatureGuard>} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/assessment/:sessionId" element={<InformalAssessment />} />
            <Route path="/student/progress" element={<SkillGraph />} />

            {/* Parent (Phase 3) */}
            <Route path="/parent" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ParentHome /></FeatureGuard>} />
            <Route path="/parent/notifications" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ParentNotifications /></FeatureGuard>} />
            <Route path="/parent/link-requests" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ParentLinkRequests /></FeatureGuard>} />
            <Route path="/parent/recordings/:rid" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ParentLessonReplay /></FeatureGuard>} />
            <Route path="/parent/success-centre" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ParentSuccessCentre /></FeatureGuard>} />
            <Route path="/parent/children" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ParentChildren /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/progress" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ChildProgress /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/mathpath" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ParentMathPathDashboardPage /></FeatureGuard>} />
            <Route path="/parent/mathpath/analyse-paper" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><PaperAnalysisPage /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/mathpath/analyse-paper" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><PaperAnalysisPage /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/mathpath/test-spec" element={<FeatureGuard feature="parent"><TestSpecificationPage /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/mathpath/assessment-upload" element={<FeatureGuard feature="parent"><AssessmentUploadPage /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/science" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ChildScience /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/lifelab" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ChildLifeLab /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/weak-topics" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><WeakTopics /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/actions" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><RecommendedActions /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/assign-practice" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><AssignPractice /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/mistakes" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><MistakeHistory /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/assignments" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><ChildAssignments /></FeatureGuard>} />
            {/* Mastery Worksheet Generator (Phase 4) */}
            <Route path="/parent/children/:studentId/worksheets" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><WorksheetHome /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/worksheets/new" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><WorksheetSetup /></FeatureGuard>} />
            <Route path="/parent/children/:studentId/worksheets/:worksheetId" element={<FeatureGuard feature="parent" comingSoonAllowed={true}><WorksheetPreview /></FeatureGuard>} />

            {/* Student Care MVP */}
            <Route path="/student-care/dashboard" element={<RoleGuard role="student_care"><StudentCareDashboard /></RoleGuard>} />
            <Route path="/student-care/homework" element={<RoleGuard role="student_care"><StudentCareHomework /></RoleGuard>} />
            <Route path="/student-care/recovery-packs" element={<RoleGuard role="student_care"><StudentCareRecoveryPacks /></RoleGuard>} />
            <Route path="/student-care/rechecks" element={<RoleGuard role="student_care"><StudentCareRechecks /></RoleGuard>} />
            <Route path="/student-care/reports" element={<RoleGuard role="student_care"><StudentCareReports /></RoleGuard>} />
            <Route path="/student-care/analyse-paper" element={<RoleGuard role="student_care"><PaperAnalysisPage /></RoleGuard>} />
            <Route path="/student-care/students/:studentId/analyse-paper" element={<RoleGuard role="student_care"><PaperAnalysisPage /></RoleGuard>} />

            {/* Tutor (Phase 4) */}
            <Route path="/tutor" element={<FeatureGuard feature="tutor"><TutorHome /></FeatureGuard>} />
            <Route path="/tutor/students" element={<FeatureGuard feature="tutor"><AssignedStudents /></FeatureGuard>} />
            <Route path="/tutor/students/:id" element={<FeatureGuard feature="tutor"><TutorStudentProfile /></FeatureGuard>} />
            <Route path="/tutor/students/:id/mathpath" element={<FeatureGuard feature="tutor"><TutorMathPathDashboardPage /></FeatureGuard>} />
            <Route path="/tutor/students/:id/psl" element={<FeatureGuard feature="tutor"><TutorPSLDashboardPage /></FeatureGuard>} />
            <Route path="/tutor/mathpath/students/:studentId/analyse-paper" element={<FeatureGuard feature="tutor"><PaperAnalysisPage /></FeatureGuard>} />
            <Route path="/tutor/students/:id/mathpath/test-spec" element={<FeatureGuard feature="tutor"><TestSpecificationPage /></FeatureGuard>} />
            <Route path="/tutor/students/:id/mathpath/assessment-upload" element={<FeatureGuard feature="tutor"><AssessmentUploadPage /></FeatureGuard>} />
            <Route path="/tutor/students/:id/lesson-prep" element={<FeatureGuard feature="tutor"><LessonPrep /></FeatureGuard>} />
            <Route path="/tutor/students/:id/lesson-notes" element={<FeatureGuard feature="tutor"><LessonNotes /></FeatureGuard>} />
            <Route path="/tutor/students/:id/record" element={<FeatureGuard feature="tutor"><LessonRecorder /></FeatureGuard>} />
            <Route path="/tutor/subscription" element={<FeatureGuard feature="tutor"><TutorAgencyMembership /></FeatureGuard>} />
            <Route path="/tutor/request-access" element={<FeatureGuard feature="tutor"><TutorRequestStudentLink /></FeatureGuard>} />
            <Route path="/agency" element={<AgencyDashboard />} />
            <Route path="/admin/partners/:pid/licence" element={<PartnerLicencePage />} />
            <Route path="/tutor/students/:id/assign-homework" element={<FeatureGuard feature="tutor"><AssignHomework /></FeatureGuard>} />
            <Route path="/tutor/homework" element={<FeatureGuard feature="tutor"><TutorHomework /></FeatureGuard>} />
            <Route path="/tutor/students/:id/mistakes/:mistakeId/explain" element={<FeatureGuard feature="tutor"><TutorExplanationRecorder /></FeatureGuard>} />
            <Route path="/tutor/availability" element={<FeatureGuard feature="tutor"><TutorAvailability /></FeatureGuard>} />
            <Route path="/tutor/training" element={<FeatureGuard feature="tutor"><TutorTraining /></FeatureGuard>} />

            {/* Teacher (Phase 5) */}
            <Route path="/teacher" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherHome /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/dashboard" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherHome /></FeatureGuard></RoleGuard>} />
            <Route path="/school-admin" element={<RoleGuard role="school_admin"><SchoolAdminConsole /></RoleGuard>} />
            <Route path="/teacher/classes" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><Classes /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><ClassOverview /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/mathpath" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherMathPathDashboardPage /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/psl" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherPSLDashboardPage /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/mathpath/classes/:classId/students/:studentId/analyse-paper" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><PaperAnalysisPage /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/mathpath/test-spec" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TestSpecificationPage /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/mathpath/assessment-upload" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><AssessmentUploadPage /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/mastery" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><ClassMasteryMap /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/students" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><ClassStudents /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/groups" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><Grouping /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/weak-groups" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><WeakGroups /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/assign" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherAssignPractice /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/assessments" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherAssessments /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/assessments/new" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherCreateAssessment /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/assessments/:assessmentId/results" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherAssessmentResults /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/interventions" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><Intervention /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/worksheets" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherWorksheets /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/lifelab" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherLifeLab /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/classes/:id/reports" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><Reports /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/students/:id" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherStudentDetail /></FeatureGuard></RoleGuard>} />
            <Route path="/teacher/lifelab" element={<RoleGuard role="teacher"><FeatureGuard feature="teacher"><TeacherLifeLabHome /></FeatureGuard></RoleGuard>} />

            {/* ─── Secondary → Mechanisms Playground (D&T) ─── */}
            <Route path="/secondary/mechanisms" element={<FeatureGuard feature="mechanisms"><MechanismsHome /></FeatureGuard>} />
            <Route path="/secondary/mechanisms/:mechanism" element={<FeatureGuard feature="mechanisms"><MechanismSimulator /></FeatureGuard>} />
            <Route path="/secondary/mechanisms/:mechanism/present" element={<FeatureGuard feature="mechanisms"><MechanismPresent /></FeatureGuard>} />

            {/* Shared "More" sheet */}
            <Route path="/more" element={<MorePage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
