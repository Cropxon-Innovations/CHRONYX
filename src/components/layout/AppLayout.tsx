import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const AppLayout = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
          <div className="p-6 lg:p-8 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;
