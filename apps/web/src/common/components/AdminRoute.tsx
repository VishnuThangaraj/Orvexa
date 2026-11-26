import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export const AdminRoute = () => {
  const { user } = useAuthStore();

  if (user?.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
