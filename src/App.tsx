import { Brand } from "./components/Brand";
import { lazyRoute } from "./utils/lazyRoute";
import { useEffect, useState, Suspense } from "react";
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
const Login = lazyRoute(() => import("./pages/Login"), "Login");
const Register = lazyRoute(() => import("./pages/Register"), "Register");
const Dashboard = lazyRoute(() => import("./pages/Dashboard"), "Dashboard");
const Invitations = lazyRoute(
  () => import("./pages/Invitations"),
  "Invitations",
);
const CreateInvitation = lazyRoute(
  () => import("./pages/CreateInvitation"),
  "CreateInvitation",
);
const EditInvitation = lazyRoute(
  () => import("./pages/EditInvitation"),
  "EditInvitation",
);
const InvitationPreview = lazyRoute(
  () => import("./pages/InvitationPreview"),
  "InvitationPreview",
);
const GuestManagement = lazyRoute(
  () => import("./pages/GuestManagement"),
  "GuestManagement",
);
const Templates = lazyRoute(() => import("./pages/Templates"), "Templates");
const Analytics = lazyRoute(() => import("./pages/Analytics"), "Analytics");
const Settings = lazyRoute(() => import("./pages/Settings"), "Settings");
const PublicInvitation = lazyRoute(
  () => import("./pages/PublicInvitation"),
  "PublicInvitation",
);
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
        <Brand />
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
          Evently Invitations is ready for your Firebase project. Add your
          client configuration to <code>.env</code> to connect your private
          workspace.
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
                <Route
                  path="/i/:shareId/:hostName?"
                  element={<PublicInvitation />}
                />
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
