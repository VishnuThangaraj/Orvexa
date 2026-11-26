import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Loader from "@/common/components/ui/Loader/Loader";
import PublicRoute from "@/common/components/PublicRoute";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import ProtectedRoute from "@/common/components/ProtectedRoute";
import AdminRoute from "@/common/components/AdminRoute";
import AppLayout from "@/common/components/layout/AppLayout";

const AuthPage = lazy(() => import("@/modules/auth/pages/AuthPage"));
const Landing = lazy(() => import("@/modules/landing/pages/Landing"));

const Home = lazy(() => import("@/modules/home/Pages/Home"));
const Mail = lazy(() => import("@/modules/mail/pages/Mail"));
const Chat = lazy(() => import("@/modules/chat/pages/Chat"));
const Calendar = lazy(() => import("@/modules/calendar/pages/Calendar"));
const Drive = lazy(() => import("@/modules/drive/pages/DrivePage"));
const DriveRequestAccess = lazy(() => import("@/modules/drive/pages/DriveRequestAccessPage"));
const MeetLanding = lazy(() => import("@/modules/meet/pages/MeetLandingPage"));
const MeetingRoomPage = lazy(() => import("@/modules/meet/pages/MeetingRoomPage"));
const MeetingLeftPage = lazy(() => import("@/modules/meet/pages/MeetingLeftPage"));

const Profile = lazy(() => import("@/modules/profile/pages/Profile"));
const Administration = lazy(
  () => import("@/modules/admin/pages/AdministrationPage"),
);

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
            <Route path="/drive" element={<Drive />} />
            <Route path="/drive/folders/:id" element={<Drive />} />
            <Route path="/drive/shared" element={<Drive />} />
            <Route path="/drive/recent" element={<Drive />} />
            <Route path="/drive/starred" element={<Drive />} />
            <Route path="/drive/trash" element={<Drive />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/meet" element={<MeetLanding />} />
            <Route path="/profile" element={<Profile />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Administration />} />
            </Route>
          </Route>
          {/* Immersive full-screen meeting room & leave screens outside AppLayout */}
          <Route path="/meet/:code" element={<MeetingRoomPage />} />
          <Route path="/meet/:code/left" element={<MeetingLeftPage />} />

          {/* Dedicated full-screen share link and request access pages */}
          <Route path="/drive/s/:token" element={<DriveRequestAccess />} />
          <Route path="/drive/request-access" element={<DriveRequestAccess />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
