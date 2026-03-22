import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { hasRole } from "@/lib/roles";

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(user, "EMPLOYEE")) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
