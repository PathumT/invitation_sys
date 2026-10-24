import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Mail,
  Users,
  Check,
  X,
  Clock,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Palette,
  Share2,
  ChartNoAxesColumnIncreasing,
  Settings,
  Sparkles,
  CalendarDays,
  Eye,
  Leaf,
} from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { useTemplates } from "../hooks/useTemplates";
import { useAuth } from "../contexts/AuthContext";
import { DesignPreview } from "../components/invitations/DesignPreview";
import { InvitationSharePanel } from "../components/invitations/InvitationSharePanel";
import { InvitationActions } from "../components/dashboard/InvitationActions";
import { Modal } from "../components/ui/Modal";
import {
  dashboardSummary,
  responseActivity,
  eventDate,
  activityDate,
} from "../utils/dashboard";
import { deleteInvitation } from "../services/invitationService";
import { errorMessage } from "../utils";
import type { Invitation } from "../types";
import { toast } from "sonner";
const templateOccasions = [
  "Wedding",
  "Birthday",
  "Baby Shower",
  "Engagement",
  "Housewarming",
  "Party Celebrations",
];
export default function Dashboard() {
  const { events, guests, loading, error, retry } = useWorkspace();
  const { user } = useAuth();
  const templates = useTemplates();
  const reduced = useReducedMotion();
  const summary = useMemo(
    () => dashboardSummary(events, guests),
    [events, guests],
  );
  const activity = useMemo(
    () => responseActivity(guests).slice(0, 5),
    [guests],
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [shareId, setShareId] = useState("");
  const [remove, setRemove] = useState<Invitation | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewId, setPreviewId] = useState("");
  const [previewOccasion, setPreviewOccasion] = useState("");
  const shareEvent = events.find((event) => event.id === shareId);
  const preview = templates.find((template) => template.id === previewId);
  function share(event?: Invitation) {
    setShareId(
      event?.id ||
        events.find((item) => item.status === "published")?.id ||
        events[0]?.id ||
        "",
    );
    setShareOpen(true);
  }
  const gallery = templateOccasions.map((occasion) => ({
    occasion,
    template:
      templates.find((template) => template.category === occasion) ||
      templates.find(
        (template) =>
          template.category ===
          (occasion === "Party Celebrations"
            ? "Birthday"
            : "General Invitation"),
      ) ||
      templates[0],
  }));
  const example = {
    title: "A special celebration",
    hostName: "your favorite people",
    eventDate: "A day to remember",
    eventTime: "5:00 PM",
    venueName: "Somewhere wonderful",
    venueAddress: "A place to come together",
    message: "Join us for a beautiful celebration.",
  };
  return (
    <div className="premium-dashboard">
      <div className="page-heading dashboard-page-heading">
        <div>
          <span className="eyebrow">YOUR INVITATION WORKSPACE</span>
          <h1>
            Hello, {user?.displayName?.trim().split(/\s+/)[0] || "there"}!
          </h1>
          <p>A little inspiration for your next great gathering.</p>
        </div>
        <span className="dashboard-today">
          <CalendarDays size={16} />
          {new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date())}
        </span>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <span>We couldn't load your workspace. {error}</span>
          <button className="button outline small" onClick={retry}>
            Try again
          </button>
        </div>
      )}
      <motion.section
        className="premium-welcome"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="premium-welcome-copy">
          <span className="welcome-kicker">
            <Sparkles size={13} />
            LITTLE INVITATIONS. BEAUTIFUL POSSIBILITIES.
          </span>
          <h2>
            Create beautiful invitations
            <br className="desktop-line" /> for life's special moments.
          </h2>
          <p>
            Design, personalize and share stunning invitations with the people
            who matter most &mdash; all in one place.
          </p>
          <div className="welcome-actions">
            <Link className="button primary" to="/invitations/new">
              <Plus size={16} />
              Create New Invitation
            </Link>
            <Link className="button welcome-secondary" to="/templates">
              Explore Templates
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="premium-welcome-art" aria-hidden="true">
          <span className="hero-orbit" />
          <div className="hero-envelope">
            <Leaf size={35} />
            <span>
              A little joy,
              <br />
              on its way.
            </span>
          </div>
          <div className="hero-invitation">
            <Leaf size={24} />
            <small>YOU ARE INVITED</small>
            <strong>
              A moment
              <br />
              to remember.
            </strong>
            <span className="gold-line" />
            <em>Let's celebrate together</em>
          </div>
          <span className="hero-star one">&#10023;</span>
          <span className="hero-star two">&#10023;</span>
        </div>
      </motion.section>
      <section
        className="premium-stats"
        aria-label="Workspace statistics"
        aria-busy={loading}
      >
        {[
          {
            Icon: Mail,
            label: "Total Invitations",
            value: summary.invitations,
            description: "Every occasion you've created",
            color: "forest",
          },
          {
            Icon: Users,
            label: "Total Guests",
            value: summary.total,
            description: "Across all your invitations",
            color: "sage",
          },
          {
            Icon: Check,
            label: "Accepted RSVPs",
            value: summary.accepted,
            description: "Ready to celebrate with you",
            color: "green",
          },
          {
            Icon: X,
            label: "Declined RSVPs",
            value: summary.declined,
            description: "Until the next lovely occasion",
            color: "rose",
          },
          {
            Icon: Clock,
            label: "Pending RSVPs",
            value: summary.pending,
            description: "Still waiting for a response",
            color: "gold",
          },
        ].map(({ Icon, label, value, description, color }) => (
          <article className="stat-card premium-stat" key={label}>
            <div className="premium-stat-label">
              <span className={`premium-stat-icon ${color}`}>
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </div>
            {loading ? (
              <span
                className="stat-placeholder"
                aria-label="Loading statistic"
              />
            ) : (
              <strong>{error ? "—" : value}</strong>
            )}
            <small>{description}</small>
          </article>
        ))}
      </section>
      <div className="premium-dashboard-columns">
        <section className="premium-panel recent-invitations">
          <div className="premium-panel-heading">
            <div>
              <h2>Recent invitations</h2>
              <p>Small beginnings. Unforgettable occasions.</p>
            </div>
            <Link to="/invitations" className="text-link">
              View All
              <ArrowUpRight size={15} />
            </Link>
          </div>
          {loading ? (
            <div
              className="invitation-skeletons"
              aria-label="Loading invitations"
            >
              {[0, 1, 2].map((item) => (
                <div className="invitation-skeleton" key={item} />
              ))}
            </div>
          ) : error ? (
            <div className="dashboard-empty">
              <Mail size={25} />
              <h3>Workspace unavailable</h3>
              <p>We couldn't load your invitations. Please try again.</p>
              <button className="button outline" onClick={retry}>
                Try again
              </button>
            </div>
          ) : events.length ? (
            <div className="recent-invitation-list">
              {events.slice(0, 4).map((event) => {
                const eventGuests = guests.filter(
                  (guest) => guest.invitationId === event.id,
                );
                const eventSummary = dashboardSummary([event], eventGuests);
                return (
                  <article className="recent-invitation" key={event.id}>
                    <Link
                      className="recent-invitation-art"
                      to={`/invitations/${event.id}/preview`}
                      aria-label={`Preview ${event.title}`}
                    >
                      <DesignPreview design={event.design} event={event} mini />
                    </Link>
                    <div className="recent-invitation-info">
                      <div className="recent-event-meta">
                        <span>{event.eventType}</span>
                        <span className={`badge ${event.status}`}>
                          {event.status}
                        </span>
                      </div>
                      <Link to={`/invitations/${event.id}/edit`}>
                        <h3>{event.title}</h3>
                      </Link>
                      <p>
                        <CalendarDays size={13} />
                        {eventDate(event.eventDate)}
                        <span>&middot;</span>
                        <Users size={13} />
                        {eventGuests.length} guests
                      </p>
                      <div className="event-response-line">
                        <span>
                          {eventSummary.responded} of {eventGuests.length}{" "}
                          responded
                        </span>
                        <b>{eventSummary.responseRate}%</b>
                      </div>
                      <progress
                        value={eventSummary.responded}
                        max={Math.max(1, eventGuests.length)}
                        aria-label={`Response progress for ${event.title}`}
                      />
                    </div>
                    <InvitationActions
                      event={event}
                      onShare={share}
                      onDelete={setRemove}
                    />
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty">
              <span className="dashboard-empty-icon">
                <Mail size={27} />
              </span>
              <h3>Your next memory starts here</h3>
              <p>
                Create your first invitation and bring your people together.
              </p>
              <Link className="button primary" to="/invitations/new">
                <Plus size={15} />
                Create your first invitation
              </Link>
            </div>
          )}
        </section>
        <aside className="dashboard-insights">
          <section className="premium-panel rsvp-overview">
            <div className="premium-panel-heading">
              <div>
                <h2>Who's joining you?</h2>
                <p>Every reply, in one place.</p>
              </div>
              <Link
                to="/analytics"
                aria-label="View RSVP analytics"
                className="icon-button"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="response-rate">
              <strong>
                {loading || error ? "—" : `${summary.responseRate}%`}
              </strong>
              <span>of your guests have responded</span>
            </div>
            <div className="rsvp-stacked-bar" aria-label="RSVP distribution">
              {[
                { key: "accepted", value: summary.accepted },
                { key: "declined", value: summary.declined },
                { key: "maybe", value: summary.maybe },
                { key: "pending", value: summary.pending },
              ].map((item) => (
                <span
                  key={item.key}
                  className={item.key}
                  style={{
                    width: `${summary.total ? (item.value / summary.total) * 100 : item.key === "pending" ? 100 : 0}%`,
                  }}
                />
              ))}
            </div>
            <div className="rsvp-mini-legend">
              {[
                { label: "Accepted", value: summary.accepted, key: "accepted" },
                { label: "Declined", value: summary.declined, key: "declined" },
                { label: "Maybe", value: summary.maybe, key: "maybe" },
                { label: "Pending", value: summary.pending, key: "pending" },
              ].map((item) => (
                <span key={item.key}>
                  <i className={item.key} />
                  {item.label}
                  <b>{loading || error ? "—" : item.value}</b>
                </span>
              ))}
            </div>
          </section>
          <section className="premium-panel premium-activity">
            <div className="premium-panel-heading">
              <div>
                <h2>Recent activity</h2>
                <p>Good news from your guests.</p>
              </div>
              <span className="activity-live">
                <span />
                Live
              </span>
            </div>
            {loading ? (
              <div className="activity-loading" aria-label="Loading activity">
                <span />
                <span />
                <span />
              </div>
            ) : error ? (
              <div className="activity-quiet">
                <p>
                  Activity couldn't be loaded. Try again from the workspace
                  error message.
                </p>
              </div>
            ) : activity.length ? (
              <div className="premium-activity-list">
                {activity.map((guest) => (
                  <Link
                    key={`${guest.invitationId}-${guest.id}`}
                    to={`/invitations/${guest.invitationId}/guests`}
                  >
                    <span className={`response-avatar ${guest.rsvpStatus}`}>
                      {(guest.respondentName || guest.name || "G")[0]}
                    </span>
                    <span>
                      <strong>{guest.respondentName || guest.name}</strong>
                      <p>
                        <span className={`status-text ${guest.rsvpStatus}`}>
                          {guest.rsvpStatus}
                        </span>{" "}
                        &middot;{" "}
                        {
                          events.find(
                            (event) => event.id === guest.invitationId,
                          )?.title
                        }
                      </p>
                      <small>{activityDate(guest.respondedAt)}</small>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="activity-quiet">
                <Clock size={23} />
                <strong>A little quiet, for now</strong>
                <p>Responses will appear here as your guests reply.</p>
              </div>
            )}
            <Link to="/guests" className="premium-panel-footer">
              View guest list
              <ArrowRight size={14} />
            </Link>
          </section>
        </aside>
      </div>
      <section className="dashboard-quick-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">MAKE SOMETHING MEANINGFUL</span>
            <h2>A little shortcut to your next step</h2>
          </div>
        </div>
        <div className="premium-quick-grid">
          {[
            {
              Icon: Plus,
              title: "Create Invitation",
              text: "Start a beautiful new occasion",
              to: "/invitations/new",
              color: "sage",
            },
            {
              Icon: Palette,
              title: "Browse Templates",
              text: "Find your perfect starting point",
              to: "/templates",
              color: "rose",
            },
            {
              Icon: Users,
              title: "Manage Guests",
              text: "Keep your favorite people close",
              to: "/guests",
              color: "lavender",
            },
            {
              Icon: Share2,
              title: "Share Invitation",
              text: "Send a little joy their way",
              to: "",
              color: "gold",
            },
            {
              Icon: ChartNoAxesColumnIncreasing,
              title: "View Analytics",
              text: "See who's joining the celebration",
              to: "/analytics",
              color: "sage",
            },
            {
              Icon: Settings,
              title: "Workspace Settings",
              text: "Make your workspace your own",
              to: "/settings",
              color: "cream",
            },
          ].map(({ Icon, title, text, to, color }) => {
            const content = (
              <>
                <span className={`quick-action-icon ${color}`}>
                  <Icon size={21} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
                <ArrowUpRight size={16} />
              </>
            );
            return to ? (
              <Link
                className="premium-quick-card"
                aria-label={title}
                to={to}
                key={title}
              >
                {content}
              </Link>
            ) : (
              <button
                className="premium-quick-card"
                aria-label={title}
                key={title}
                onClick={() => share()}
              >
                {content}
              </button>
            );
          })}
        </div>
      </section>
      <section className="dashboard-template-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">A DESIGN FOR EVERY OCCASION</span>
            <h2>Find a little inspiration</h2>
            <p>Thoughtful templates, ready for your personal touch.</p>
          </div>
          <Link className="text-link" to="/templates">
            Explore all templates
            <ArrowRight size={15} />
          </Link>
        </div>
        <div
          className="premium-template-gallery"
          aria-label="Invitation template inspiration"
          tabIndex={0}
        >
          {gallery.map(({ occasion, template }) => (
            <article className="premium-template-card" key={occasion}>
              <button
                className="premium-template-art"
                onClick={() => {
                  setPreviewId(template.id);
                  setPreviewOccasion(occasion);
                }}
                aria-label={`Preview ${occasion} template`}
              >
                <DesignPreview
                  design={template.design}
                  event={{ ...example, eventType: occasion }}
                  mini
                />
                <span>
                  <Eye size={16} />
                  Preview design
                </span>
              </button>
              <div className="premium-template-info">
                <span>{occasion}</span>
                <h3>{template.name}</h3>
                <Link
                  className="text-link"
                  to={`/invitations/new?template=${encodeURIComponent(template.id)}&occasion=${encodeURIComponent(occasion)}`}
                >
                  Use Template
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      {shareOpen && (
        <Modal
          title="Share a little joy"
          onClose={() => setShareOpen(false)}
          className="dashboard-share-dialog"
        >
          {events.length ? (
            <>
              <label>
                Choose an invitation
                <select
                  value={shareId}
                  onChange={(e) => setShareId(e.target.value)}
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} &middot; {event.status}
                    </option>
                  ))}
                </select>
              </label>
              {shareEvent && (
                <>
                  <InvitationSharePanel event={shareEvent} />
                  <Link
                    className="text-link"
                    to={`/invitations/${shareEvent.id}/edit`}
                  >
                    Edit or publish this invitation
                    <ArrowRight size={15} />
                  </Link>
                </>
              )}
            </>
          ) : (
            <div className="dashboard-empty">
              <Share2 size={27} />
              <h3>A beautiful invitation comes first</h3>
              <p>
                Create and publish an invitation, then share it with your
                guests.
              </p>
              <Link className="button primary" to="/invitations/new">
                Create invitation
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </Modal>
      )}
      {remove && (
        <Modal
          title="Delete this invitation?"
          onClose={() => {
            if (!busy) setRemove(null);
          }}
        >
          <p>
            Delete <strong>{remove.title}</strong>? This revokes public links
            and permanently removes the invitation and its guest list.
          </p>
          <div className="modal-actions">
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setRemove(null)}
            >
              Keep invitation
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteInvitation(remove.id);
                  setRemove(null);
                  toast.success("Invitation deleted.");
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting..." : "Delete invitation"}
            </button>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal
          title={preview.name}
          onClose={() => setPreviewId("")}
          className="template-preview-dialog"
        >
          <DesignPreview design={preview.design} event={example} />
          <Link
            className="button primary full"
            to={`/invitations/new?template=${encodeURIComponent(preview.id)}&occasion=${encodeURIComponent(previewOccasion)}`}
          >
            Use Template
            <ArrowRight size={15} />
          </Link>
        </Modal>
      )}
    </div>
  );
}
