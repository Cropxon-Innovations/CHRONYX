import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import CollapsibleNetWorth from "./CollapsibleNetWorth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const AppLayout = () => {
  const [isNetWorthCollapsed, setIsNetWorthCollapsed] = useState(false);
  const [isNetWorthPinned, setIsNetWorthPinned] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("networth-collapsed");
    const savedPinned = localStorage.getItem("networth-pinned");
    const savedSidebarCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) setIsNetWorthCollapsed(savedCollapsed === "true");
    if (savedPinned) setIsNetWorthPinned(savedPinned === "true");
    if (savedSidebarCollapsed) setIsSidebarCollapsed(savedSidebarCollapsed === "true");
    
    // Listen for sidebar collapse changes
    const handleStorageChange = () => {
      const sidebarState = localStorage.getItem("sidebar-collapsed");
      if (sidebarState) setIsSidebarCollapsed(sidebarState === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically for same-tab changes
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

  // Save state to localStorage
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
        <main className={`min-h-screen pt-14 lg:pt-0 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:ml-14" : "lg:ml-64"
        }`}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            <div className="flex gap-4 lg:gap-6">
              {/* Main Content - takes full width, max content width for readability */}
              <div className="flex-1 min-w-0 max-w-full xl:max-w-5xl">
                <Outlet />
              </div>
              
              {/* Net Worth Sidebar - Hidden on mobile, visible on xl screens unless pinned */}
              {!isNetWorthPinned && (
                <div className="hidden xl:block w-56 2xl:w-64 flex-shrink-0">
                  <div className="sticky top-6">
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

        {/* Pinned Net Worth - Fixed position, visible on all screen sizes when pinned */}
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
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;
