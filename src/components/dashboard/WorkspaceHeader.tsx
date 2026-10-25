import { uiText } from "../../i18n/uiText";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  Settings,
  LogOut,
  Mail,
  Users,
  ArrowUpRight,
  CheckCheck,
} from "lucide-react";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../contexts/AuthContext";
import {
  searchWorkspace,
  responseActivity,
  activityDate,
} from "../../utils/dashboard";
import { logout } from "../../services/authService";
import { Modal } from "../ui/Modal";
import { toast } from "sonner";
export function WorkspaceHeader({ workspaceName }: { workspaceName: string }) {
  const { events, guests, loading, error } = useWorkspace();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(false);
  const profile = useRef<HTMLDetailsElement>(null);
  const results = useMemo(
    () => searchWorkspace(query, events, guests),
    [query, events, guests],
  );
  const activity = useMemo(
    () => responseActivity(guests).slice(0, 5),
    [guests],
  );
  useEffect(() => {
    setSearch(false);
    setNotifications(false);
    if (profile.current) profile.current.open = false;
  }, [location.pathname]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !target.closest("input, textarea, select, [contenteditable=true]")
      ) {
        event.preventDefault();
        setSearch(true);
      }
    };
    const outside = (event: PointerEvent) => {
      if (profile.current && !profile.current.contains(event.target as Node))
        profile.current.open = false;
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  async function signOut() {
    try {
      await logout();
      navigate("/login");
    } catch {
      toast.error(uiText("ui.27ae196c23b9"));
    }
  }
  return (
    <>
      <div className="workspace-heading-name">
        <span className="workspace-dot" />
        {workspaceName}
      </div>
      <button
        className="workspace-search"
        onClick={() => setSearch(true)}
        aria-label={uiText("ui.0abaf4b082be")}
      >
        <Search size={17} />
        <span>{uiText("ui.d737fc9a4dc4")}</span>
        <kbd>/</kbd>
      </button>
      <div className="topbar-right premium-topbar-actions">
        <button
          className="icon-button response-bell"
          aria-label={uiText("ui.37ebf6da5f78")}
          onClick={() => setNotifications(true)}
        >
          <Bell size={19} />
          {activity.length > 0 && !loading && (
            <span className="notification-dot" />
          )}
        </button>
        <Link
          className="button primary small topbar-create"
          aria-label={uiText("invitation.create")}
          to="/invitations/new"
        >
          <Plus size={16} />
          <span>{uiText("invitation.create")}</span>
        </Link>
        <details
          className="profile-menu"
          ref={profile}
          onKeyDown={(event) => {
            if (event.key === "Escape" && profile.current) {
              profile.current.open = false;
              profile.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label={uiText("ui.2ec58b2ddd56")}>
            <span className="header-avatar">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </span>
            <ChevronDown size={13} />
          </summary>
          <div className="profile-dropdown">
            <strong>{user?.displayName || "Your account"}</strong>
            <small>{user?.email}</small>
            <Link to="/settings">
              <Settings size={16} />
              {uiText("ui.5ebc59145b59")}
            </Link>
            <button onClick={signOut}>
              <LogOut size={16} />
              {uiText("nav.signOut")}
            </button>
          </div>
        </details>
      </div>
      {search && (
        <Modal
          title={uiText("ui.5f2442e2d735")}
          onClose={() => setSearch(false)}
          className="workspace-search-dialog"
        >
          <label className="global-search-label">
            {uiText("ui.84917b36f495")}
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={uiText("ui.76d59b99d0f0")}
            />
          </label>
          <div className="search-results" aria-live="polite">
            {loading ? (
              <p>{uiText("ui.9d5a187298ae")}</p>
            ) : error ? (
              <p className="error">{uiText("ui.ea5ab5394d0d")}</p>
            ) : !query.trim() ? (
              <p className="muted">{uiText("ui.da38fec2cd6f")}</p>
            ) : (
              <>
                <p className="search-result-count">
                  {results.events.length + results.guests.length}
                  {uiText("ui.e38b815e21f2")}
                </p>
                {results.events.length > 0 && (
                  <>
                    <h3>{uiText("ui.14210e691c87")}</h3>
                    {results.events.slice(0, 6).map((event) => (
                      <Link
                        key={event.id}
                        to={`/invitations/${event.id}/edit`}
                        onClick={() => setSearch(false)}
                      >
                        <span className="search-type-icon">
                          <Mail size={17} />
                        </span>
                        <span>
                          <strong>{event.title}</strong>
                          <small>
                            {event.eventType} &middot; {event.status}
                          </small>
                        </span>
                        <ArrowUpRight size={15} />
                      </Link>
                    ))}
                  </>
                )}
                {results.guests.length > 0 && (
                  <>
                    <h3>{uiText("ui.3c8e0fde6fcc")}</h3>
                    {results.guests.slice(0, 6).map((guest) => (
                      <Link
                        key={`${guest.invitationId}-${guest.id}`}
                        to={`/invitations/${guest.invitationId}/guests`}
                        onClick={() => setSearch(false)}
                      >
                        <span className="search-type-icon">
                          <Users size={17} />
                        </span>
                        <span>
                          <strong>{guest.respondentName || guest.name}</strong>
                          <small>
                            {
                              events.find(
                                (event) => event.id === guest.invitationId,
                              )?.title
                            }{" "}
                            &middot; {guest.rsvpStatus}
                          </small>
                        </span>
                        <ArrowUpRight size={15} />
                      </Link>
                    ))}
                  </>
                )}
                {!results.events.length && !results.guests.length && (
                  <div className="dashboard-empty">
                    <Search size={25} />
                    <h3>{uiText("ui.417b217a64c2")}</h3>
                    <p>{uiText("ui.0dbaa1d91ee2")}</p>
                  </div>
                )}
                {(results.events.length > 6 || results.guests.length > 6) && (
                  <p className="muted">{uiText("ui.b4dc80ed654d")}</p>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
      {notifications && (
        <Modal
          title={uiText("ui.43bb0f0d1960")}
          onClose={() => setNotifications(false)}
        >
          <p className="muted">{uiText("ui.a6d5dfcb427e")}</p>
          {loading ? (
            <p>{uiText("ui.d75626ec1460")}</p>
          ) : error ? (
            <p className="error">{uiText("ui.69e0e14634f0")}</p>
          ) : activity.length ? (
            <div className="notification-list">
              {activity.map((guest) => (
                <Link
                  key={`${guest.invitationId}-${guest.id}`}
                  to={`/invitations/${guest.invitationId}/guests`}
                  onClick={() => setNotifications(false)}
                >
                  <span className={`response-avatar ${guest.rsvpStatus}`}>
                    <CheckCheck size={18} />
                  </span>
                  <span>
                    <strong>{guest.respondentName || guest.name}</strong>
                    <p>
                      {guest.rsvpStatus} &middot;{" "}
                      {
                        events.find((event) => event.id === guest.invitationId)
                          ?.title
                      }
                    </p>
                    <small>{activityDate(guest.respondedAt)}</small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              <Bell size={25} />
              <h3>{uiText("ui.db15713586d8")}</h3>
              <p>{uiText("ui.a253bfc49053")}</p>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
