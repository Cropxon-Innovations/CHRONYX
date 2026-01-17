import { useState, useEffect, Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import TopHeader from "./TopHeader";
import CollapsibleNetWorth from "./CollapsibleNetWorth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Breadcrumbs from "./Breadcrumbs";
import PageLoader from "./PageLoader";
import FloatingQuickAction from "./FloatingQuickAction";
import ChronyxBot from "@/components/chat/ChronyxBot";

const AppLayout = () => {
  const [isNetWorthCollapsed, setIsNetWorthCollapsed] = useState(false);
  const [isNetWorthPinned, setIsNetWorthPinned] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("networth-collapsed");
    const savedPinned = localStorage.getItem("networth-pinned");
    const savedSidebarCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) setIsNetWorthCollapsed(savedCollapsed === "true");
    if (savedPinned) setIsNetWorthPinned(savedPinned === "true");
    if (savedSidebarCollapsed) setIsSidebarCollapsed(savedSidebarCollapsed === "true");
    
    const handleStorageChange = () => {
      const sidebarState = localStorage.getItem("sidebar-collapsed");
      if (sidebarState) setIsSidebarCollapsed(sidebarState === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    
    const interval = setInterval(() => {
      const sidebarState = localStorage.getItem("sidebar-collapsed");
      if (sidebarState && (sidebarState === "true") !== isSidebarCollapsed) {
        setIsSidebarCollapsed(sidebarState === "true");
      }
    }, 100);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("networth-collapsed", String(isNetWorthCollapsed));
  }, [isNetWorthCollapsed]);

  useEffect(() => {
    localStorage.setItem("networth-pinned", String(isNetWorthPinned));
  }, [isNetWorthPinned]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <TopHeader />
        
        <main className={`min-h-screen pt-14 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:ml-14" : "lg:ml-64"
        }`}>
          {/* Add top padding for header on desktop */}
          <div className="w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 lg:pt-20">
            <Breadcrumbs />
            
            <div className="w-full flex flex-col xl:flex-row gap-4 lg:gap-6">
              <div className="w-full min-w-0 flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </div>
              
              {!isNetWorthPinned && (
                <div className="hidden xl:block w-60 2xl:w-72 flex-shrink-0">
                  <div className="sticky top-20">
                    <CollapsibleNetWorth 
                      isPinned={isNetWorthPinned}
                      onTogglePin={() => setIsNetWorthPinned(!isNetWorthPinned)}
                      isCollapsed={isNetWorthCollapsed}
                      onToggleCollapse={() => setIsNetWorthCollapsed(!isNetWorthCollapsed)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {isNetWorthPinned && (
          <div className="fixed bottom-4 right-4 z-50 w-56 sm:w-64 shadow-xl">
            <CollapsibleNetWorth 
              isPinned={isNetWorthPinned}
              onTogglePin={() => setIsNetWorthPinned(!isNetWorthPinned)}
              isCollapsed={isNetWorthCollapsed}
              onToggleCollapse={() => setIsNetWorthCollapsed(!isNetWorthCollapsed)}
            />
          </div>
        )}

        <FloatingQuickAction />
        <ChronyxBot />
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;
