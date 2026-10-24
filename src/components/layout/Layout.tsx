import { WorkspaceProvider } from "../../hooks/useWorkspace";
import { WorkspaceHeader } from "../dashboard/WorkspaceHeader";
import { starterTemplates } from "../../services/templateService";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import "../../styles/dashboard.css";
import { Brand } from "../Brand";
import {
  NavLink,
  Outlet,
  useLocation,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Mail,
  Palette,
  Users,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  Heart,
  Cake,
  Baby,
  House,
  Sparkles,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { logout } from "../../services/authService";
import { toast } from "sonner";
const links = [
  ["/", "Overview", LayoutDashboard],
  ["/invitations", "My invitations", Mail],
  ["/templates", "Template library", Palette],
  ["/guests", "Guest list", Users],
  ["/analytics", "Analytics", ChartNoAxesCombined],
] as const;
export function Layout() {
  return (
    <WorkspaceProvider>
      <MotionConfig reducedMotion="user">
        <WorkspaceLayout />
      </MotionConfig>
    </WorkspaceProvider>
  );
}
function WorkspaceLayout() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 1100px)").matches,
  );
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuClose = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const update = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    if (open) menuClose.current?.focus();
    else if (wasOpen.current) menuTrigger.current?.focus();
    wasOpen.current = open;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mobile]);
  const { user } = useAuth();
  const [workspaceName, setWorkspaceName] = useState("My workspace");
  useEffect(
    () =>
      user
        ? onSnapshot(
            doc(db, "tenants", user.uid),
            (snapshot) =>
              setWorkspaceName(snapshot.data()?.name || "My workspace"),
            (error) => toast.error(error.message),
          )
        : undefined,
    [user],
  );
  const location = useLocation();
  const navigate = useNavigate();
  const label =
    [...links, ["/settings", "Settings", Settings] as const].find(
      ([url]) => url === location.pathname,
    )?.[1] || "Invitation studio";
  return (
    <div className="app-shell evently-workspace">
      <aside
        id="workspace-navigation"
        className={`sidebar ${open ? "is-open" : ""}`}
        inert={mobile && !open}
        aria-hidden={mobile && !open}
      >
        <Link to="/" className="brand">
          <Brand />
        </Link>
        <button
          className="mobile close-sidebar icon-button"
          ref={menuClose}
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X />
        </button>
        <Link
          to="/settings"
          className="workspace-selector"
          onClick={() => setOpen(false)}
        >
          <span className="workspace-avatar">
            {(user?.displayName || "M")[0]}
          </span>
          <div>
            <strong>{workspaceName}</strong>
            <small>Personal workspace</small>
          </div>
          <ArrowUpRight size={15} />
        </Link>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {links.map(([url, title, Icon]) => (
            <NavLink
              end={url === "/"}
              to={url}
              key={url}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {title}
              {url === "/templates" && <span className="nav-new">NEW</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-quick-create">
          <p className="nav-label">QUICK CREATE</p>
          {[
            { title: "Wedding", category: "Wedding", Icon: Heart },
            { title: "Birthday", category: "Birthday", Icon: Cake },
            { title: "Baby Shower", category: "Baby Shower", Icon: Baby },
            { title: "Housewarming", category: "Housewarming", Icon: House },
            {
              title: "Custom Invitation",
              category: "General Invitation",
              Icon: Sparkles,
            },
          ].map(({ title, category, Icon }) => {
            const template =
              starterTemplates.find((item) => item.category === category) ||
              starterTemplates.find(
                (item) => item.category === "General Invitation",
              )!;
            return (
              <Link
                key={title}
                to={`/invitations/new?template=${encodeURIComponent(template.id)}&occasion=${encodeURIComponent(category)}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={15} />
                <span>{title}</span>
                <span className="quick-create-plus">+</span>
              </Link>
            );
          })}
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/settings" onClick={() => setOpen(false)}>
            <Settings size={19} />
            Settings
          </NavLink>
          <button
            className="logout"
            onClick={async () => {
              try {
                await logout();
                navigate("/login");
              } catch {
                toast.error("Could not sign out. Try again.");
              }
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
          <div className="user-profile">
            <span className="user-avatar">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </span>
            <div>
              <strong>{user?.displayName || "Your account"}</strong>
              <small>{user?.email}</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      {mobile && open && (
        <div className="sidebar-scrim" onClick={() => setOpen(false)} />
      )}
      <div className="main-shell" inert={mobile && open}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              aria-label="Open menu"
              ref={menuTrigger}
              aria-expanded={open}
              aria-controls="workspace-navigation"
              className="mobile icon-button"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{label}</strong>
          </div>
          <WorkspaceHeader workspaceName={workspaceName} />
        </header>
        <motion.main
          key={location.pathname}
          initial={reduced ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Outlet />
        </motion.main>
        <footer className="app-footer">
          <span>Made for moments that matter.</span>
          <span>Evently Invitations © {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
