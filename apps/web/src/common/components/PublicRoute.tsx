import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
