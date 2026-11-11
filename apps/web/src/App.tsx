import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Loader from "@/common/components/ui/Loader/Loader";
import PublicRoute from "@/common/components/PublicRoute";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import ProtectedRoute from "@/common/components/ProtectedRoute";
import AppLayout from "@/common/components/layout/AppLayout";

const AuthPage = lazy(() => import("@/modules/auth/pages/AuthPage"));
const Landing = lazy(() => import("@/modules/landing/pages/Landing"));

const Home = lazy(() => import("@/modules/home/Pages/Home"));
const Mail = lazy(() => import("@/modules/mail/pages/Mail"));

const Profile = lazy(() => import("@/modules/profile/pages/Profile"));

const App = () => {
  const { hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />

        {/* Guest-only routes (redirects to / if authenticated) */}
        <Route element={<PublicRoute />}>
          <Route path="/authenticate" element={<AuthPage />} />
        </Route>

        {/* Protected routes (redirects to /authenticate if not authenticated) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/mail" element={<Mail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
