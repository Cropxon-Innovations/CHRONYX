import React, { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { PWAUpdater } from "@/components/pwa/PWAUpdater";
import SplashScreen from "@/components/layout/SplashScreen";
import PageLoader from "@/components/layout/PageLoader";

// Lazy load pages for better performance
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Security = lazy(() => import("./pages/Security"));
const Refund = lazy(() => import("./pages/Refund"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Todos = lazy(() => import("./pages/app/Todos"));
const Study = lazy(() => import("./pages/app/Study"));
const Loans = lazy(() => import("./pages/app/Loans"));
const Insurance = lazy(() => import("./pages/app/Insurance"));
const Expenses = lazy(() => import("./pages/app/Expenses"));
const Income = lazy(() => import("./pages/app/Income"));
const Reports = lazy(() => import("./pages/app/Reports"));
const Lifespan = lazy(() => import("./pages/app/Lifespan"));
const Achievements = lazy(() => import("./pages/app/Achievements"));
const Activity = lazy(() => import("./pages/app/Activity"));
const Settings = lazy(() => import("./pages/app/Settings"));
const Profile = lazy(() => import("./pages/app/Profile"));
const Memory = lazy(() => import("./pages/app/Memory"));
const MemoryTimeline = lazy(() => import("./pages/app/MemoryTimeline"));
const Search = lazy(() => import("./pages/app/Search"));
const Backup = lazy(() => import("./pages/app/Backup"));
const Documents = lazy(() => import("./pages/app/Documents"));
const Social = lazy(() => import("./pages/app/SocialHub"));
const PaymentAnalytics = lazy(() => import("./pages/app/PaymentAnalytics"));
const Vault = lazy(() => import("./pages/app/Vault"));
const Tax = lazy(() => import("./pages/app/Tax"));
const Library = lazy(() => import("./pages/app/Library"));
const FamilyTree = lazy(() => import("./pages/app/FamilyTree"));
const PrivacyCenter = lazy(() => import("./pages/app/PrivacyCenter"));
const SecurityDashboard = lazy(() => import("./pages/app/SecurityDashboard"));
const Resolutions = lazy(() => import("./pages/app/Resolutions"));

const News = lazy(() => import("./pages/app/News"));
const Tools = lazy(() => import("./pages/app/Tools"));
  const Aeon = lazy(() => import("./pages/app/Aeon"));
const TaskManagement = lazy(() => import("./pages/app/TaskManagement"));
const TaskProject = lazy(() => import("./pages/app/TaskProject"));
const TaskJoin = lazy(() => import("./pages/app/TaskJoin"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IconPreview = lazy(() => import("./pages/IconPreview"));

// WealthX module (isolated, lazy-loaded)
const WealthXLayout      = lazy(() => import("./modules/wealthx/components/WealthXLayout"));
const WealthXDashboard   = lazy(() => import("./modules/wealthx/pages/WealthXDashboard"));
const WealthXPortfolio   = lazy(() => import("./modules/wealthx/pages/Portfolio"));
const WealthXMutualFunds = lazy(() => import("./modules/wealthx/pages/MutualFunds"));
const WealthXStocks      = lazy(() => import("./modules/wealthx/pages/Stocks"));
const WealthXETFs        = lazy(() => import("./modules/wealthx/pages/ETFs"));
const WealthXGold        = lazy(() => import("./modules/wealthx/pages/Gold"));
const WealthXTransactions= lazy(() => import("./modules/wealthx/pages/Transactions"));
const WealthXSIPManager  = lazy(() => import("./modules/wealthx/pages/SIPManager"));
const WealthXGoals       = lazy(() => import("./modules/wealthx/pages/Goals"));
const WealthXWatchlist   = lazy(() => import("./modules/wealthx/pages/Watchlist"));
const WealthXAnalytics   = lazy(() => import("./modules/wealthx/pages/Analytics"));
const WealthXInsights    = lazy(() => import("./modules/wealthx/pages/Insights"));
const WealthXPredictions = lazy(() => import("./modules/wealthx/pages/Predictions"));
const WealthXNews        = lazy(() => import("./modules/wealthx/pages/News"));
const WealthXSettings    = lazy(() => import("./modules/wealthx/pages/Settings"));

const queryClient = new QueryClient();

// Enhanced page transition with smooth fade and subtle scale
const pageTransition = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
  transition: { 
    duration: 0.4, 
    ease: "easeOut" as const
  }
};

/**
 * Global OAuth hash handler - detects tokens in URL hash and redirects to auth callback
 */
const GlobalOAuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    
    // Check if hash contains OAuth tokens (from implicit flow)
    if (hash && hash.includes('access_token')) {
      console.log('[GlobalOAuth] Detected OAuth tokens in hash, redirecting to auth callback...');
      
      // If we're not already on auth/callback, redirect there with the hash
      if (location.pathname !== '/auth/callback') {
        // Preserve the hash and redirect to auth callback
        navigate('/auth/callback' + hash, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      {/* Global OAuth handler to catch tokens on any page */}
      <GlobalOAuthHandler />
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Landing />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/home" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Landing />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/login" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Login />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <ForgotPassword />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/reset-password" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <ResetPassword />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/privacy" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Privacy />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/terms" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Terms />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/security" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Security />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/refund" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Refund />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/pricing" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Pricing />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/about" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <About />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/contact" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <Contact />
              </Suspense>
            </motion.div>
          } 
        />
        <Route
          path="/icon-preview"
          element={
            <Suspense fallback={<PageLoader />}>
              <IconPreview />
            </Suspense>
          }
        />
        <Route 
          path="/chronyx-control-8x9k2m" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <AdminPanel />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/auth/callback" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <AuthCallback />
              </Suspense>
            </motion.div>
          } 
        />
        <Route 
          path="/app"
          element={
            <Suspense fallback={<PageLoader />}>
              <AppLayout />
            </Suspense>
          }
        >
          <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="todos" element={<Suspense fallback={<PageLoader />}><Todos /></Suspense>} />
          <Route path="study" element={<Suspense fallback={<PageLoader />}><Study /></Suspense>} />
          <Route path="loans" element={<Suspense fallback={<PageLoader />}><Loans /></Suspense>} />
          <Route path="insurance" element={<Suspense fallback={<PageLoader />}><Insurance /></Suspense>} />
          <Route path="expenses" element={<Suspense fallback={<PageLoader />}><Expenses /></Suspense>} />
          <Route path="income" element={<Suspense fallback={<PageLoader />}><Income /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
          <Route path="lifespan" element={<Suspense fallback={<PageLoader />}><Lifespan /></Suspense>} />
          <Route path="achievements" element={<Suspense fallback={<PageLoader />}><Achievements /></Suspense>} />
          <Route path="activity" element={<Suspense fallback={<PageLoader />}><Activity /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
          <Route path="memory" element={<Suspense fallback={<PageLoader />}><Memory /></Suspense>} />
          <Route path="memory/timeline" element={<Suspense fallback={<PageLoader />}><MemoryTimeline /></Suspense>} />
          <Route path="search" element={<Suspense fallback={<PageLoader />}><Search /></Suspense>} />
          <Route path="backup" element={<Suspense fallback={<PageLoader />}><Backup /></Suspense>} />
          <Route path="documents" element={<Suspense fallback={<PageLoader />}><Documents /></Suspense>} />
          <Route path="social" element={<Suspense fallback={<PageLoader />}><Social /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<PageLoader />}><PaymentAnalytics /></Suspense>} />
          <Route path="notes" element={<Suspense fallback={<PageLoader />}><Notes /></Suspense>} />
          <Route path="vault" element={<Suspense fallback={<PageLoader />}><Vault /></Suspense>} />
          <Route path="tax" element={<Suspense fallback={<PageLoader />}><Tax /></Suspense>} />
          <Route path="library" element={<Suspense fallback={<PageLoader />}><Library /></Suspense>} />
          <Route path="family-tree" element={<Suspense fallback={<PageLoader />}><FamilyTree /></Suspense>} />
          <Route path="financeflow" element={<Suspense fallback={<PageLoader />}><FinanceFlow /></Suspense>} />
          <Route path="privacy" element={<Suspense fallback={<PageLoader />}><PrivacyCenter /></Suspense>} />
          <Route path="security" element={<Suspense fallback={<PageLoader />}><SecurityDashboard /></Suspense>} />
          <Route path="resolutions" element={<Suspense fallback={<PageLoader />}><Resolutions /></Suspense>} />
          <Route path="noteflowlm" element={<Suspense fallback={<PageLoader />}><NoteflowLMWorkspace /></Suspense>} />
          <Route path="news" element={<Suspense fallback={<PageLoader />}><News /></Suspense>} />
          <Route path="tools" element={<Suspense fallback={<PageLoader />}><Tools /></Suspense>} />
           <Route path="aeon" element={<Suspense fallback={<PageLoader />}><Aeon /></Suspense>} />
          <Route path="tasks" element={<Suspense fallback={<PageLoader />}><TaskManagement /></Suspense>} />
          <Route path="tasks/join/:token" element={<Suspense fallback={<PageLoader />}><TaskJoin /></Suspense>} />
          <Route path="tasks/:projectId" element={<Suspense fallback={<PageLoader />}><TaskProject /></Suspense>} />
          <Route path="wealthx" element={<Suspense fallback={<PageLoader />}><WealthXLayout /></Suspense>}>
            <Route index                 element={<Suspense fallback={<PageLoader />}><WealthXDashboard /></Suspense>} />
            <Route path="portfolio"      element={<Suspense fallback={<PageLoader />}><WealthXPortfolio /></Suspense>} />
            <Route path="mutual-funds"   element={<Suspense fallback={<PageLoader />}><WealthXMutualFunds /></Suspense>} />
            <Route path="stocks"         element={<Suspense fallback={<PageLoader />}><WealthXStocks /></Suspense>} />
            <Route path="etfs"           element={<Suspense fallback={<PageLoader />}><WealthXETFs /></Suspense>} />
            <Route path="gold"           element={<Suspense fallback={<PageLoader />}><WealthXGold /></Suspense>} />
            <Route path="transactions"   element={<Suspense fallback={<PageLoader />}><WealthXTransactions /></Suspense>} />
            <Route path="sip"            element={<Suspense fallback={<PageLoader />}><WealthXSIPManager /></Suspense>} />
            <Route path="goals"          element={<Suspense fallback={<PageLoader />}><WealthXGoals /></Suspense>} />
            <Route path="watchlist"      element={<Suspense fallback={<PageLoader />}><WealthXWatchlist /></Suspense>} />
            <Route path="analytics"      element={<Suspense fallback={<PageLoader />}><WealthXAnalytics /></Suspense>} />
            <Route path="insights"       element={<Suspense fallback={<PageLoader />}><WealthXInsights /></Suspense>} />
            <Route path="predictions"    element={<Suspense fallback={<PageLoader />}><WealthXPredictions /></Suspense>} />
            <Route path="news"           element={<Suspense fallback={<PageLoader />}><WealthXNews /></Suspense>} />
            <Route path="settings"       element={<Suspense fallback={<PageLoader />}><WealthXSettings /></Suspense>} />
          </Route>
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        </Route>
        <Route 
          path="*" 
          element={
            <motion.div {...pageTransition}>
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            </motion.div>
          } 
        />
      </Routes>
    </AnimatePresence>
    </>
  );
};

/**
 * Splash policy: shown at most once per browser session. The inline SVG in
 * SplashScreen renders instantly (no network dependency), and we preload
 * the high-res orbital mark with a cache-busted URL + a bounded retry so
 * a slow / flaky connection can never leave the splash blank. After login
 * the same session flag applies, so users don't see the splash again on
 * route changes or auth callbacks.
 */
const SPLASH_KEY = "chronyx_splash_shown_v3";
const SPLASH_ASSET_VERSION = "3";

const preloadSplashAsset = (attempt = 0): void => {
  const src = `/icons/icon-mark.png?v=${SPLASH_ASSET_VERSION}`;
  const img = new Image();
  img.onerror = () => {
    if (attempt < 2) setTimeout(() => preloadSplashAsset(attempt + 1), 400 * (attempt + 1));
  };
  img.src = src;
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem(SPLASH_KEY);
    if (hasSeenSplash) {
      setShowSplash(false);
      setIsFirstLoad(false);
    } else {
      preloadSplashAsset();
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
    setIsFirstLoad(false);
  };

  return (
    <>
      <SplashScreen 
        isVisible={showSplash && isFirstLoad} 
        onComplete={handleSplashComplete}
      />
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <PWAUpdater />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
