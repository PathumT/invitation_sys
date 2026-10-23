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
  Plus,
  LogOut,
  Menu,
  X,
  Flower2,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const [open, setOpen] = useState(false);
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
    <div className="app-shell">
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Flower2 size={25} />
          </span>
          InviteFlow<span className="brand-dot">.</span>
        </Link>
        <button
          className="mobile close-sidebar icon-button"
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
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-stars">✧</span>
            <strong>
              Good things start
              <br />
              with an invitation.
            </strong>
            <p>
              Make your next gathering
              <br />a little more special.
            </p>
            <Link to="/invitations/new">
              Create something beautiful <ArrowUpRight size={14} />
            </Link>
          </div>
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
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              aria-label="Open menu"
              className="mobile icon-button"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{label}</strong>
          </div>
          <div className="topbar-right">
            <span className="private-label">
              <span className="online-dot" />
              Private workspace
            </span>
            <Link className="button primary small" to="/invitations/new">
              <Plus size={16} />
              Create invitation
            </Link>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Made for moments that matter.</span>
          <span>InviteFlow © {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
