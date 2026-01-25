import { useState, useEffect, Suspense } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import TopHeader from "./TopHeader";
import CollapsibleNetWorth from "./CollapsibleNetWorth";
import CollapsibleTodos from "./CollapsibleTodos";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Breadcrumbs from "./Breadcrumbs";
import PageLoader from "./PageLoader";
import FloatingQuickAction from "./FloatingQuickAction";
import ChronyxBot from "@/components/chat/ChronyxBot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CheckSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_ROUTE } from "@/hooks/useAdminCheck";

const AppLayout = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  // Redirect admin users to admin panel
  useEffect(() => {
    if (isAdmin) {
      navigate(ADMIN_ROUTE, { replace: true });
    }
  }, [isAdmin, navigate]);

  const [isNetWorthCollapsed, setIsNetWorthCollapsed] = useState(false);
  const [isNetWorthPinned, setIsNetWorthPinned] = useState(false);
  const [isTodosCollapsed, setIsTodosCollapsed] = useState(false);
  const [isTodosPinned, setIsTodosPinned] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeFloatingTab, setActiveFloatingTab] = useState<"networth" | "todos">("networth");

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("networth-collapsed");
    const savedPinned = localStorage.getItem("networth-pinned");
    const savedTodosCollapsed = localStorage.getItem("todos-collapsed");
    const savedTodosPinned = localStorage.getItem("todos-pinned");
    const savedSidebarCollapsed = localStorage.getItem("sidebar-collapsed");
    
    if (savedCollapsed) setIsNetWorthCollapsed(savedCollapsed === "true");
    if (savedPinned) setIsNetWorthPinned(savedPinned === "true");
    if (savedTodosCollapsed) setIsTodosCollapsed(savedTodosCollapsed === "true");
    if (savedTodosPinned) setIsTodosPinned(savedTodosPinned === "true");
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

  useEffect(() => {
    localStorage.setItem("todos-collapsed", String(isTodosCollapsed));
  }, [isTodosCollapsed]);

  useEffect(() => {
    localStorage.setItem("todos-pinned", String(isTodosPinned));
  }, [isTodosPinned]);

  const isPinned = isNetWorthPinned || isTodosPinned;

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
              
              {/* Side Panel - Only show if not pinned */}
              {!isPinned && (
                <div className="hidden xl:block w-60 2xl:w-72 flex-shrink-0">
                  <div className="sticky top-20 space-y-4">
                    <CollapsibleNetWorth 
                      isPinned={isNetWorthPinned}
                      onTogglePin={() => setIsNetWorthPinned(!isNetWorthPinned)}
                      isCollapsed={isNetWorthCollapsed}
                      onToggleCollapse={() => setIsNetWorthCollapsed(!isNetWorthCollapsed)}
                    />
                    <CollapsibleTodos 
                      isPinned={isTodosPinned}
                      onTogglePin={() => setIsTodosPinned(!isTodosPinned)}
                      isCollapsed={isTodosCollapsed}
                      onToggleCollapse={() => setIsTodosCollapsed(!isTodosCollapsed)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Floating Pinned Widgets */}
        {isPinned && (
          <div className="fixed bottom-20 right-4 z-40 w-56 sm:w-64 shadow-xl">
            <Tabs value={activeFloatingTab} onValueChange={(v) => setActiveFloatingTab(v as "networth" | "todos")}>
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="networth" className="text-xs gap-1">
                  <Wallet className="w-3 h-3" />
                  Net Worth
                </TabsTrigger>
                <TabsTrigger value="todos" className="text-xs gap-1">
                  <CheckSquare className="w-3 h-3" />
                  Tasks
                </TabsTrigger>
              </TabsList>
              <TabsContent value="networth" className="mt-0">
                <CollapsibleNetWorth 
                  isPinned={isNetWorthPinned}
                  onTogglePin={() => setIsNetWorthPinned(!isNetWorthPinned)}
                  isCollapsed={isNetWorthCollapsed}
                  onToggleCollapse={() => setIsNetWorthCollapsed(!isNetWorthCollapsed)}
                />
              </TabsContent>
              <TabsContent value="todos" className="mt-0">
                <CollapsibleTodos 
                  isPinned={isTodosPinned}
                  onTogglePin={() => setIsTodosPinned(!isTodosPinned)}
                  isCollapsed={isTodosCollapsed}
                  onToggleCollapse={() => setIsTodosCollapsed(!isTodosCollapsed)}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <FloatingQuickAction />
        <ChronyxBot />
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;
