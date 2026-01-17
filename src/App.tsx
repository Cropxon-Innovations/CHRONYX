import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { PWAUpdater } from "@/components/pwa/PWAUpdater";
import { useState, useEffect, lazy, Suspense } from "react";
import SplashScreen from "@/components/layout/SplashScreen";
import PageLoader from "@/components/layout/PageLoader";

// Lazy load pages for better performance
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
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
const Social = lazy(() => import("./pages/app/Social"));
const PaymentAnalytics = lazy(() => import("./pages/app/PaymentAnalytics"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
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
  );
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // Check if this is first visit in this session
    const hasSeenSplash = sessionStorage.getItem("chronyx_splash_shown");
    if (hasSeenSplash) {
      setShowSplash(false);
      setIsFirstLoad(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("chronyx_splash_shown", "true");
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
