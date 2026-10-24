import { useEffect, useState, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { Flower2, Settings2, WifiOff } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { configured, configurationErrors } from "./firebase/config";
import { Layout } from "./components/layout/Layout";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Invitations = lazy(() => import("./pages/Invitations"));
const CreateInvitation = lazy(() => import("./pages/CreateInvitation"));
const EditInvitation = lazy(() => import("./pages/EditInvitation"));
const InvitationPreview = lazy(() => import("./pages/InvitationPreview"));
const GuestManagement = lazy(() => import("./pages/GuestManagement"));
const Templates = lazy(() => import("./pages/Templates"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const PublicInvitation = lazy(() => import("./pages/PublicInvitation"));
function Protected() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="full-state">
        <Flower2 className="spin" />
        <p>Opening your workspace…</p>
      </div>
    );
  return user && !user.isAnonymous ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}
function Network() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true),
      off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return !online ? (
    <div className="offline-banner">
      <WifiOff size={16} />
      You’re offline. Reconnect to save changes and receive responses.
    </div>
  ) : null;
}
function Configuration() {
  return (
    <div className="setup-page">
      <div className="brand">
        <span className="brand-mark">
          <Flower2 />
        </span>
        InviteFlow.
      </div>
      <div className="setup-card">
        <span className="empty-icon">
          <Settings2 size={28} />
        </span>
        <span className="eyebrow">ONE LITTLE STEP BEFORE THE CELEBRATION</span>
        <h1>
          A home for your
          <br />
          next great gathering.
        </h1>
        <p>
          InviteFlow is ready for your Firebase project. Add your client
          configuration to <code>.env</code> to connect your private workspace.
        </p>
        <div className="setup-steps">
          <p>
            <b>01</b>Create a Firebase project and enable Email/Password
            Authentication, Firestore, and Storage.
          </p>
          <p>
            <b>02</b>Copy the web app configuration into the matching variables
            in <code>.env</code>.
          </p>
          <p>
            <b>03</b>Deploy the supplied security rules, then restart{" "}
            <code>npm run dev</code>.
          </p>
        </div>
        <details>
          <summary>
            Missing configuration ({configurationErrors.length} values)
          </summary>
          <ul>
            {configurationErrors.map((e) => (
              <li key={e}>
                <code>{e}</code>
              </li>
            ))}
          </ul>
        </details>
        <p className="helper">
          See README.md for setup, emulator testing, and Firebase Hosting
          deployment. No demo records or simulated backend are used.
        </p>
      </div>
      <span className="setup-footer">Made for moments that matter.</span>
    </div>
  );
}
export default function App() {
  return (
    <>
      <Toaster richColors position="bottom-right" />
      <Network />
      {!configured ? (
        <Configuration />
      ) : (
        <BrowserRouter>
          <AuthProvider>
            <Suspense
              fallback={
                <div className="full-state">Opening your occasion…</div>
              }
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/i/:shareId/:hostName?" element={<PublicInvitation />} />
                <Route element={<Protected />}>
                  <Route
                    path="/invitations/:id/preview"
                    element={<InvitationPreview />}
                  />
                  <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="invitations" element={<Invitations />} />
                    <Route
                      path="invitations/new"
                      element={<CreateInvitation />}
                    />
                    <Route
                      path="invitations/:id/edit"
                      element={<EditInvitation />}
                    />
                    <Route
                      path="invitations/:id/guests"
                      element={<GuestManagement />}
                    />
                    <Route path="guests" element={<GuestManagement />} />
                    <Route path="templates" element={<Templates />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<Settings />} />
                    <Route
                      path="*"
                      element={
                        <div className="empty-state">
                          <h1>This page wandered off.</h1>
                          <Link to="/">Return to your workspace</Link>
                        </div>
                      }
                    />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      )}
    </>
  );
}
