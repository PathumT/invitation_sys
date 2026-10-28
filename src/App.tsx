import { uiText } from "./i18n/uiText";
import { useTranslation } from "react-i18next";
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
const Plans = lazyRoute(() => import("./pages/Plans"), "Plans");
const Reminders = lazyRoute(() => import("./pages/Reminders"), "Reminders");
const CheckIn = lazyRoute(() => import("./pages/CheckIn"), "CheckIn");
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
        <p>{uiText("ui.bed9096c411e")}</p>
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
      {uiText("ui.5bd760695ab2")}
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
        <span className="eyebrow">{uiText("ui.9b3b45f8bbcd")}</span>
        <h1>
          {uiText("ui.fe090af694af")}
          <br />
          {uiText("ui.152bb14213c9")}
        </h1>
        <p>
          {uiText("ui.88d6d139d8fb")}
          <code>{uiText("ui.e9cbb0224c4a")}</code>
          {uiText("ui.a609caee52ca")}
        </p>
        <div className="setup-steps">
          <p>
            <b>01</b>
            {uiText("ui.97ed92bb8ab0")}
          </p>
          <p>
            <b>02</b>
            {uiText("ui.7cfaa14553d1")}
            <code>{uiText("ui.e9cbb0224c4a")}</code>.
          </p>
          <p>
            <b>03</b>
            {uiText("ui.fe066194d126")} <code>{uiText("ui.21f1677c8f4f")}</code>
            .
          </p>
        </div>
        <details>
          <summary>
            {uiText("ui.f2d53ec77d69")}
            {configurationErrors.length}
            {uiText("ui.d0b1c3baa24a")}
          </summary>
          <ul>
            {configurationErrors.map((e) => (
              <li key={e}>
                <code>{e}</code>
              </li>
            ))}
          </ul>
        </details>
        <p className="helper">{uiText("ui.e84756e4488e")}</p>
      </div>
      <span className="setup-footer">{uiText("ui.df06f57c5956")}</span>
    </div>
  );
}
export default function App() {
  // Re-render route elements when a reviewed language changes, retaining page state.
  useTranslation();
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
                <div className="full-state">{uiText("ui.17923c287ecf")}</div>
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
                    <Route path="check-in" element={<CheckIn />} />
                    <Route path="reminders" element={<Reminders />} />
                    <Route path="plans" element={<Plans />} />
                    <Route
                      path="*"
                      element={
                        <div className="empty-state">
                          <h1>{uiText("ui.126b5b20d2cd")}</h1>
                          <Link to="/">{uiText("ui.47d32925dd1f")}</Link>
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
