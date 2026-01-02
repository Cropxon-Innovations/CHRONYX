import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import NetWorthSidebar from "./NetWorthSidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const AppLayout = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
          <div className="p-6 lg:p-8 max-w-6xl">
            <div className="flex gap-6">
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <Outlet />
              </div>
              
              {/* Net Worth Sidebar - Always Visible */}
              <div className="hidden xl:block w-64 flex-shrink-0">
                <div className="sticky top-6">
                  <NetWorthSidebar />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;
