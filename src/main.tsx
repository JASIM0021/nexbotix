import { StrictMode, useEffect, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { useSetupStatus } from './hooks/useSetupStatus'

// ── Eagerly loaded (needed for first paint) ──
import { LandingLayout } from './components/landing/LandingLayout'
import { HomePage } from './components/landing/HomePage'
import { LoginPage } from './components/auth/LoginPage'

// Loading spinner for lazy-loaded routes
function RouteSpinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Lazy-loaded (route-level code splitting) ──
const App = lazy(() => import('./App.tsx'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })))
const TermsConditions = lazy(() => import('./pages/TermsConditions').then(m => ({ default: m.TermsConditions })))
const RefundPolicy = lazy(() => import('./pages/RefundPolicy').then(m => ({ default: m.RefundPolicy })))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })))
const DevDocsPage = lazy(() => import('./pages/DevDocsPage').then(m => ({ default: m.DevDocsPage })))
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })))
const PaymentSuccess = lazy(() => import('./pages/PaymentResult').then(m => ({ default: m.PaymentSuccess })))
const PaymentFailure = lazy(() => import('./pages/PaymentResult').then(m => ({ default: m.PaymentFailure })))
const BotSetupPage = lazy(() => import('./pages/BotSetupPage').then(m => ({ default: m.BotSetupPage })))
const BotDetectionPage = lazy(() => import('./pages/BotDetectionPage').then(m => ({ default: m.BotDetectionPage })))
const SecurityPage = lazy(() => import('./pages/SecurityPage').then(m => ({ default: m.SecurityPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const EmailPage = lazy(() => import('./pages/EmailPage').then(m => ({ default: m.EmailPage })))
const LeadsPage = lazy(() => import('./pages/LeadsPage').then(m => ({ default: m.LeadsPage })))
const WebsiteChatbotSetupPage = lazy(() => import('./pages/WebsiteChatbotSetupPage').then(m => ({ default: m.WebsiteChatbotSetupPage })))
const WebsiteChatbotLeadsPage = lazy(() => import('./pages/WebsiteChatbotLeadsPage').then(m => ({ default: m.WebsiteChatbotLeadsPage })))
const WebsiteChatbotEmbedPage = lazy(() => import('./pages/WebsiteChatbotEmbedPage').then(m => ({ default: m.WebsiteChatbotEmbedPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const SessionsPage = lazy(() => import('./pages/SessionsPage').then(m => ({ default: m.SessionsPage })))
const CheckChatbotPage = lazy(() => import('./pages/CheckChatbotPage').then(m => ({ default: m.CheckChatbotPage })))
const ChatbotDemoPage = lazy(() => import('./pages/ChatbotDemoPage').then(m => ({ default: m.ChatbotDemoPage })))
const BotOnboardingModal = lazy(() => import('./components/onboarding/BotOnboardingModal').then(m => ({ default: m.BotOnboardingModal })))
const SetupPage = lazy(() => import('./pages/SetupPage').then(m => ({ default: m.SetupPage })))
const DataDeletionPage = lazy(() => import('./pages/DataDeletionPage').then(m => ({ default: m.DataDeletionPage })))
const FacebookPage = lazy(() => import('./pages/facebook/FacebookPage').then(m => ({ default: m.FacebookPage })))
const FacebookCallbackPage = lazy(() => import('./pages/facebook/FacebookCallbackPage').then(m => ({ default: m.FacebookCallbackPage })))
const GmailCallbackPage = lazy(() => import('./pages/email/GmailCallbackPage').then(m => ({ default: m.GmailCallbackPage })))
const LinkedInPage = lazy(() => import('./pages/linkedin/LinkedInPage').then(m => ({ default: m.LinkedInPage })))
const LinkedInApprovePage = lazy(() => import('./pages/linkedin/LinkedInApprovePage').then(m => ({ default: m.LinkedInApprovePage })))
const SEOPage = lazy(() => import('./pages/seo/SEOPage').then(m => ({ default: m.SEOPage })))
const SEOBlogCallbackPage = lazy(() => import('./pages/seo/SEOBlogCallbackPage').then(m => ({ default: m.SEOBlogCallbackPage })))
const CampaignPage = lazy(() => import('@/pages/CampaignPage').then(m => ({ default: m.CampaignPage })))
const InfluencerDashboard = lazy(() => import('@/pages/influencer/InfluencerDashboard'))
const DeveloperPage = lazy(() => import('./pages/DeveloperPage').then(m => ({ default: m.DeveloperPage })))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const MCPOAuthApprovePage = lazy(() => import('./pages/MCPOAuthApprovePage').then(m => ({ default: m.MCPOAuthApprovePage })))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

function SetupGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isComplete, isLoading: setupLoading } = useSetupStatus(isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || setupLoading || !isAuthenticated) return;

    const isExemptRoute =
      location.pathname.startsWith('/setup') ||
      location.pathname.startsWith('/login') ||
      location.pathname.startsWith('/signup');

    const skipped = localStorage.getItem('botx_setup_complete') === '1';

    if (!isExemptRoute && !isComplete && !skipped) {
      navigate('/setup', { replace: true });
    }
  }, [isLoading, setupLoading, isAuthenticated, isComplete, location.pathname, navigate]);

  return null;
}

function AppRoutes() {

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://nexbotix.online/api/website-chatbot/script?apikey=bsk_9db5bdcaf9b80908495b62d7c42223d4';
    s.async = true;
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, []);
  return (
    <Suspense fallback={<RouteSpinner />}>
      <BotOnboardingModal />
      <SetupGuard />
      <Routes>
        {/* Public landing pages */}
      <Route path="/" element={<LandingLayout><HomePage /></LandingLayout>} />
      <Route path="/privacy" element={<LandingLayout><PrivacyPolicy /></LandingLayout>} />
      <Route path="/terms" element={<LandingLayout><TermsConditions /></LandingLayout>} />
      <Route path="/refund" element={<LandingLayout><RefundPolicy /></LandingLayout>} />
      <Route path="/docs" element={<LandingLayout><DevDocsPage /></LandingLayout>} />
      <Route path="/contact" element={<LandingLayout><ContactPage /></LandingLayout>} />
      <Route path="/about" element={<LandingLayout><AboutPage /></LandingLayout>} />
      <Route path="/data-deletion" element={<LandingLayout><DataDeletionPage /></LandingLayout>} />

      {/* Public Blog Platform */}
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />

      {/* Public chatbot demo tool (no auth required) */}
      <Route path="/check-chatbot" element={<CheckChatbotPage />} />
      <Route path="/demo/:id" element={<ChatbotDemoPage />} />
      <Route path="/linkedin/approve" element={<LinkedInApprovePage />} />

      {/* Login / Signup */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Setup flow — protected, no app shell */}
      <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />

      {/* MCP OAuth Approval Flow */}
      <Route path="/mcp-auth" element={<ProtectedRoute><MCPOAuthApprovePage /></ProtectedRoute>} />

      {/* Payment result pages (accessible without auth - user returns from PayU) */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failure" element={<PaymentFailure />} />

      {/* Protected routes */}
      <Route path="/subscription" element={
        <ProtectedRoute><SubscriptionPage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute><AdminPanel /></ProtectedRoute>
      } />
      <Route path="/bot" element={
        <ProtectedRoute><BotSetupPage /></ProtectedRoute>
      } />
      <Route path="/bot/detection" element={
        <ProtectedRoute><BotDetectionPage /></ProtectedRoute>
      } />
      <Route path="/security" element={
        <ProtectedRoute><SecurityPage /></ProtectedRoute>
      } />
      <Route path="/sessions" element={
        <ProtectedRoute><SessionsPage /></ProtectedRoute>
      } />
      <Route path="/email" element={
        <ProtectedRoute>
          <AppProvider>
            <EmailPage />
          </AppProvider>
        </ProtectedRoute>
      } />
      <Route path="/leads" element={
        <ProtectedRoute>
          <AppProvider>
            <LeadsPage />
          </AppProvider>
        </ProtectedRoute>
      } />
      <Route path="/website-chatbot" element={
        <ProtectedRoute><WebsiteChatbotSetupPage /></ProtectedRoute>
      } />
      <Route path="/website-chatbot/leads" element={
        <ProtectedRoute><WebsiteChatbotLeadsPage /></ProtectedRoute>
      } />
      <Route path="/website-chatbot/embed" element={
        <ProtectedRoute><WebsiteChatbotEmbedPage /></ProtectedRoute>
      } />
      <Route path="/app" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/whatsapp" element={
        <ProtectedRoute>
          <AppProvider>
            <App />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* Facebook channel */}
      <Route path="/facebook" element={
        <ProtectedRoute>
          <AppProvider>
            <FacebookPage />
          </AppProvider>
        </ProtectedRoute>
      } />
      <Route path="/facebook/callback" element={
        <ProtectedRoute><FacebookCallbackPage /></ProtectedRoute>
      } />
      <Route path="/email/gmail/callback" element={
        <ProtectedRoute><GmailCallbackPage /></ProtectedRoute>
      } />

      {/* LinkedIn channel */}
      <Route path="/linkedin" element={
        <ProtectedRoute>
          <AppProvider>
            <LinkedInPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* SEO Extension */}
      <Route path="/seo" element={
        <ProtectedRoute>
          <AppProvider>
            <SEOPage />
          </AppProvider>
        </ProtectedRoute>
      } />
      <Route path="/seo/blog/callback" element={
        <ProtectedRoute><SEOBlogCallbackPage /></ProtectedRoute>
      } />

      {/* Campaigns channel */}
      <Route path="/campaigns" element={
        <ProtectedRoute>
          <AppProvider>
            <CampaignPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* Influencer / affiliate portal */}
      <Route path="/influencer" element={
        <ProtectedRoute><InfluencerDashboard /></ProtectedRoute>
      } />

      {/* Developer Hub — API keys, REST docs, MCP docs */}
      <Route path="/developer" element={
        <ProtectedRoute><DeveloperPage /></ProtectedRoute>
      } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
