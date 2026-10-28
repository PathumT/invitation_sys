import { uiText } from "../i18n/uiText";
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
    message: uiText("ui.78fb6157cf22"),
  };
  return (
    <div className="premium-dashboard">
      <div className="page-heading dashboard-page-heading">
        <div>
          <span className="eyebrow">{uiText("ui.c9449e7bb51a")}</span>
          <h1>
            {uiText("ui.23429bd9ba98")}
            {user?.displayName?.trim().split(/\s+/)[0] || "there"}!
          </h1>
          <p>{uiText("ui.00fc419a0a4a")}</p>
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
          <span>
            {uiText("ui.dd383958a651")}
            {error}
          </span>
          <button className="button outline small" onClick={retry}>
            {uiText("ui.d8b8392e2c54")}
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
            {uiText("ui.7a5899afc5ad")}
          </span>
          <h2>
            {uiText("ui.1d8f5ac8bebd")}
            <br className="desktop-line" />
            {uiText("ui.891df35822f1")}
          </h2>
          <p>{uiText("ui.777275d82c9e")}</p>
          <div className="welcome-actions">
            <Link className="button primary" to="/invitations/new">
              <Plus size={16} />
              {uiText("ui.464c1232790b")}
            </Link>
            <Link className="button welcome-secondary" to="/templates">
              {uiText("ui.2488c5d85119")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="premium-welcome-art" aria-hidden="true">
          <span className="hero-orbit" />
          <div className="hero-envelope">
            <Leaf size={35} />
            <span>
              {uiText("ui.047e5fa87071")}
              <br />
              {uiText("ui.5050864fdb91")}
            </span>
          </div>
          <div className="hero-invitation">
            <Leaf size={24} />
            <small>{uiText("ui.cfe1b4640f0e")}</small>
            <strong>
              {uiText("ui.a1fc5e2c7d88")}
              <br />
              {uiText("ui.21e85d8ca2ac")}
            </strong>
            <span className="gold-line" />
            <em>{uiText("ui.95d01ea65039")}</em>
          </div>
          <span className="hero-star one">&#10023;</span>
          <span className="hero-star two">&#10023;</span>
        </div>
      </motion.section>
      <section
        className="premium-stats"
        aria-label={uiText("ui.9770f595eb7e")}
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
                aria-label={uiText("ui.dfa545c245e2")}
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
              <h2>{uiText("ui.5b16328ccefa")}</h2>
              <p>{uiText("ui.3e61a50bb6ee")}</p>
            </div>
            <Link to="/invitations" className="text-link">
              {uiText("ui.ff5573a6f287")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
          {loading ? (
            <div
              className="invitation-skeletons"
              aria-label={uiText("ui.97a042ad492a")}
            >
              {[0, 1, 2].map((item) => (
                <div className="invitation-skeleton" key={item} />
              ))}
            </div>
          ) : error ? (
            <div className="dashboard-empty">
              <Mail size={25} />
              <h3>{uiText("ui.f29d3f31dc6e")}</h3>
              <p>{uiText("ui.5c4d9b21dfc2")}</p>
              <button className="button outline" onClick={retry}>
                {uiText("ui.d8b8392e2c54")}
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
                      aria-label={uiText("ui.128b618dc412", {
                        value0: String(event.title),
                      })}
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
                        {eventGuests.length}
                        {uiText("ui.d68761f770a1")}
                      </p>
                      <div className="event-response-line">
                        <span>
                          {eventSummary.responded}
                          {uiText("ui.a4282e4b2298")}
                          {eventGuests.length} {uiText("ui.42d72995406e")}
                        </span>
                        <b>{eventSummary.responseRate}%</b>
                      </div>
                      <progress
                        value={eventSummary.responded}
                        max={Math.max(1, eventGuests.length)}
                        aria-label={uiText("ui.8fad8ca7e1b8", {
                          value0: String(event.title),
                        })}
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
              <h3>{uiText("ui.005d30268f09")}</h3>
              <p>{uiText("ui.31324866be76")}</p>
              <Link className="button primary" to="/invitations/new">
                <Plus size={15} />
                {uiText("ui.d0c6907a5067")}
              </Link>
            </div>
          )}
        </section>
        <aside className="dashboard-insights">
          <section className="premium-panel rsvp-overview">
            <div className="premium-panel-heading">
              <div>
                <h2>{uiText("ui.b4a0f6f81644")}</h2>
                <p>{uiText("ui.d29f7751fe15")}</p>
              </div>
              <Link
                to="/analytics"
                aria-label={uiText("ui.38b4054df9f8")}
                className="icon-button"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="response-rate">
              <strong>
                {loading || error
                  ? "—"
                  : uiText("ui.cdffc1a8fa98", {
                      value0: String(summary.responseRate),
                    })}
              </strong>
              <span>{uiText("ui.1b34f916afad")}</span>
            </div>
            <div
              className="rsvp-stacked-bar"
              aria-label={uiText("ui.3cfbf341915a")}
            >
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
                <h2>{uiText("ui.6cb44b56336a")}</h2>
                <p>{uiText("ui.d2444a944bff")}</p>
              </div>
              <span className="activity-live">
                <span />
                {uiText("ui.b64ac05f17e6")}
              </span>
            </div>
            {loading ? (
              <div
                className="activity-loading"
                aria-label={uiText("ui.0acd8adfdd7a")}
              >
                <span />
                <span />
                <span />
              </div>
            ) : error ? (
              <div className="activity-quiet">
                <p>{uiText("ui.2298414142f9")}</p>
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
                <strong>{uiText("ui.d96c3fd531f7")}</strong>
                <p>{uiText("ui.b9dade950d76")}</p>
              </div>
            )}
            <Link to="/guests" className="premium-panel-footer">
              {uiText("ui.9d2d2eb013c7")}
              <ArrowRight size={14} />
            </Link>
          </section>
        </aside>
      </div>
      <section className="dashboard-quick-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">{uiText("ui.541937cf38bb")}</span>
            <h2>{uiText("ui.862f429aaf60")}</h2>
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
            <span className="eyebrow">{uiText("ui.c2678f35dc46")}</span>
            <h2>{uiText("ui.a364e275bbb5")}</h2>
            <p>{uiText("ui.a79908f20576")}</p>
          </div>
          <Link className="text-link" to="/templates">
            {uiText("ui.39c2fa5cfc32")}
            <ArrowRight size={15} />
          </Link>
        </div>
        <div
          className="premium-template-gallery"
          aria-label={uiText("ui.6855cd382561")}
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
                aria-label={uiText("ui.91382b25e84a", {
                  value0: String(occasion),
                })}
              >
                <DesignPreview
                  design={template.design}
                  event={{ ...example, eventType: occasion }}
                  mini
                />
                <span>
                  <Eye size={16} />
                  {uiText("ui.e127649ca4a6")}
                </span>
              </button>
              <div className="premium-template-info">
                <span>{occasion}</span>
                <h3>{template.name}</h3>
                <Link
                  className="text-link"
                  to={`/invitations/new?template=${encodeURIComponent(template.id)}&occasion=${encodeURIComponent(occasion)}`}
                >
                  {uiText("ui.6a0418f673c8")}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      {shareOpen && (
        <Modal
          title={uiText("ui.8b49078262a7")}
          onClose={() => setShareOpen(false)}
          className="dashboard-share-dialog"
        >
          {events.length ? (
            <>
              <label>
                {uiText("ui.704e7e942736")}
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
                    {uiText("ui.f47488076591")}
                    <ArrowRight size={15} />
                  </Link>
                </>
              )}
            </>
          ) : (
            <div className="dashboard-empty">
              <Share2 size={27} />
              <h3>{uiText("ui.87855a185b2f")}</h3>
              <p>{uiText("ui.52d726cc6987")}</p>
              <Link className="button primary" to="/invitations/new">
                {uiText("invitation.create")}
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </Modal>
      )}
      {remove && (
        <Modal
          title={uiText("ui.0e5d7537b52a")}
          onClose={() => {
            if (!busy) setRemove(null);
          }}
        >
          <p>
            {uiText("ui.85941fb9c992")}
            <strong>{remove.title}</strong>
            {uiText("ui.4fd7b4e5734c")}
          </p>
          <div className="modal-actions">
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setRemove(null)}
            >
              {uiText("ui.1de10d002022")}
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteInvitation(remove.id);
                  setRemove(null);
                  toast.success(uiText("ui.d3169492c581"));
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? uiText("ui.685ecb984ac2") : uiText("ui.6daff779d26e")}
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
            {uiText("ui.6a0418f673c8")}
            <ArrowRight size={15} />
          </Link>
        </Modal>
      )}
    </div>
  );
}
