import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Loader from "@/common/components/Loader";
import PublicRoute from "@/common/components/PublicRoute";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import ProtectedRoute from "@/common/components/ProtectedRoute";

const AuthPage = lazy(() => import("@/modules/auth/pages/AuthPage"));
const Landing = lazy(() => import("@/modules/landing/pages/Landing"));

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
          <Route path="/home" element={<Loader />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
