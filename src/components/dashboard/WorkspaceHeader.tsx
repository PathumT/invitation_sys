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
      toast.error("Could not sign out. Please try again.");
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
        aria-label="Search invitations and guests"
      >
        <Search size={17} />
        <span>Search invitations, guests...</span>
        <kbd>/</kbd>
      </button>
      <div className="topbar-right premium-topbar-actions">
        <button
          className="icon-button response-bell"
          aria-label="Recent RSVP notifications"
          onClick={() => setNotifications(true)}
        >
          <Bell size={19} />
          {activity.length > 0 && !loading && (
            <span className="notification-dot" />
          )}
        </button>
        <Link
          className="button primary small topbar-create"
          aria-label="Create invitation"
          to="/invitations/new"
        >
          <Plus size={16} />
          <span>Create invitation</span>
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
          <summary aria-label="Your profile menu">
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
              Workspace settings
            </Link>
            <button onClick={signOut}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </details>
      </div>
      {search && (
        <Modal
          title="Find something lovely"
          onClose={() => setSearch(false)}
          className="workspace-search-dialog"
        >
          <label className="global-search-label">
            Search your workspace
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="An invitation, host, guest or venue..."
            />
          </label>
          <div className="search-results" aria-live="polite">
            {loading ? (
              <p>Loading your workspace...</p>
            ) : error ? (
              <p className="error">
                Search is unavailable while workspace data cannot be loaded.
              </p>
            ) : !query.trim() ? (
              <p className="muted">
                Search invitations by title, host, venue or occasion, and guests
                by name, email or phone.
              </p>
            ) : (
              <>
                <p className="search-result-count">
                  {results.events.length + results.guests.length} results in
                  your workspace
                </p>
                {results.events.length > 0 && (
                  <>
                    <h3>Invitations</h3>
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
                    <h3>Guests</h3>
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
                    <h3>No matches yet</h3>
                    <p>Try another name, occasion or venue.</p>
                  </div>
                )}
                {(results.events.length > 6 || results.guests.length > 6) && (
                  <p className="muted">
                    Showing the first six results in each group. Refine your
                    search to find a specific record.
                  </p>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
      {notifications && (
        <Modal
          title="Recent RSVP responses"
          onClose={() => setNotifications(false)}
        >
          <p className="muted">
            The latest responses from your guests. These update as your guests
            reply.
          </p>
          {loading ? (
            <p>Loading responses...</p>
          ) : error ? (
            <p className="error">
              Responses could not be loaded. Please try again from your
              dashboard.
            </p>
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
              <h3>All quiet for now</h3>
              <p>
                Real RSVP updates will appear here after your guests respond.
              </p>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
