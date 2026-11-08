import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/authenticate" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
