import { Toaster } from "@/components/ui/toaster"
import { Toaster as HotToaster } from "react-hot-toast";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import FreestyleSession from './pages/FreestyleSession';
import TechniqueStudio from './components/bioneer/technique/studio/TechniqueStudio';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import PublicSession from './pages/PublicSession';
import CoachPortal from './pages/CoachPortal';
import Achievements from './pages/Achievements';
import Progress from './pages/Progress';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import WorkoutPlans from './pages/WorkoutPlans';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Show landing page instead of auto-redirect
      return <Landing />;
    }
  }



  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {/* Freestyle session route (no layout) */}
      <Route path="/FreestyleSession" element={<FreestyleSession />} />
      {/* Technique Studio route (no layout) */}
      <Route path="/TechniqueStudio" element={<TechniqueStudio />} />
      {/* Settings route */}
      <Route path="/Settings" element={
        <LayoutWrapper currentPageName="Settings">
          <Settings />
        </LayoutWrapper>
      } />
      {/* Public session share */}
      <Route path="/session/:session_id/public" element={<PublicSession />} />
      {/* Coach portal */}
      <Route path="/CoachPortal" element={
        <LayoutWrapper currentPageName="CoachPortal">
          <CoachPortal />
        </LayoutWrapper>
      } />
      {/* Achievements */}
      <Route path="/Achievements" element={
        <LayoutWrapper currentPageName="Achievements">
          <Achievements />
        </LayoutWrapper>
      } />
      {/* Progress */}
      <Route path="/Progress" element={
        <LayoutWrapper currentPageName="Progress">
          <Progress />
        </LayoutWrapper>
      } />
      <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
      <Route path="/TermsOfService" element={<TermsOfService />} />
      <Route path="/WorkoutPlans" element={
        <LayoutWrapper currentPageName="WorkoutPlans">
          <WorkoutPlans />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


// Preload speech synthesis voices (async in Chrome — trigger early)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
}

// Prefetch WASM files into browser cache after page load (low priority)
const WASM_FILES = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/vision_wasm_internal.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/vision_wasm_internal.wasm',
];
if (typeof window !== 'undefined') {
  setTimeout(() => WASM_FILES.forEach(url => fetch(url, { priority: 'low' }).catch(() => {})), 2000);
}

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <HotToaster position="bottom-right" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App