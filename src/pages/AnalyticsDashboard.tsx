import { uiText } from "../i18n/uiText";
import type { Invitation, Guest } from "../types";
import { Link } from "react-router-dom";
import {
  Users,
  Check,
  Clock,
  ArrowUpRight,
  Plus,
  ArrowRight,
  CalendarDays,
  Mail,
  X,
  Leaf,
  MapPin,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useWorkspace } from "../hooks/useWorkspace";
import { useAuth } from "../contexts/AuthContext";
import { DesignPreview } from "../components/invitations/DesignPreview";
import { format } from "date-fns";
export default function Dashboard({
  analytics = false,
  filtered,
}: {
  analytics?: boolean;
  filtered?: { events: Invitation[]; guests: Guest[] };
}) {
  const {
    events: allEvents,
    guests: allGuests,
    loading,
    error,
  } = useWorkspace();
  const events = filtered?.events || allEvents,
    guests = filtered?.guests || allGuests;
  const { user } = useAuth();
  const accepted = guests.filter((g) => g.rsvpStatus === "accepted").length,
    declined = guests.filter((g) => g.rsvpStatus === "declined").length,
    maybe = guests.filter((g) => g.rsvpStatus === "maybe").length,
    pending = guests.length - accepted - declined - maybe;
  const data = [
    { name: "Accepted", value: accepted, color: "#236b5c" },
    { name: "Declined", value: declined, color: "#d69589" },
    { name: "Maybe", value: maybe, color: "#d6b771" },
    { name: "Pending", value: pending, color: "#e5e8e3" },
  ];
  const upcoming = events
    .filter(
      (e) =>
        e.status !== "archived" &&
        e.eventDate >= format(new Date(), "yyyy-MM-dd"),
    )
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const activity = guests
    .filter((g) => g.respondedAt)
    .sort(
      (a, b) => (b.respondedAt?.seconds || 0) - (a.respondedAt?.seconds || 0),
    )
    .slice(0, 5);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{uiText("ui.8a5b4209c438")}</div>
          <h1>
            {analytics
              ? uiText("ui.00a21c8c1cde")
              : uiText("ui.2b4d21337d47", {
                  value0: String(user?.displayName?.split(" ")[0] || "there"),
                })}
            {!analytics && <span className="greeting-flower">✳</span>}
          </h1>
          <p>{uiText("ui.ef129578aa8f")}</p>
        </div>
        <div className="date-label">
          <CalendarDays size={16} />
          {format(new Date(), "EEEE, MMM d, yyyy")}
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <section className="welcome-banner">
        <div>
          <span className="banner-label">
            <span />
            {uiText("ui.09a1d802befa")}
          </span>
          <h2>
            {uiText("ui.3e18b6c9cda2")}
            <br />
            {uiText("ui.019a8f62d6fd")}
          </h2>
          <p>{uiText("ui.ebe3ceb3ed62")}</p>
          <Link className="button primary" to="/invitations/new">
            <Plus size={17} />
            {uiText("ui.1495a0b48d52")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-card back">
            <Leaf size={38} />
            <span>
              {uiText("ui.b4c524d6e692")}
              <br />
              {uiText("ui.975e61675e17")}
            </span>
          </div>
          <div className="art-card front">
            <span className="art-star">✳</span>
            <small>{uiText("ui.de3ae44c6da1")}</small>
            <span>
              {uiText("ui.6d4d224c45f7")}
              <br />
              <em>{uiText("ui.b573e44bda25")}</em>
            </span>
            <div className="art-line" />
            <small>{uiText("ui.a16f1dcf6a6b")}</small>
          </div>
          <span className="art-spark">✧</span>
        </div>
      </section>
      <div className="section-title">
        <h2>{uiText("ui.6a1c7bdd1527")}</h2>
        <span className="subtle">{uiText("ui.d5cb1473ca4a")}</span>
      </div>
      <div className="stats-grid">
        {[
          [
            Users,
            "Total guests",
            guests.length,
            "Your guest list, all together",
            "teal",
          ],
          [Check, "Accepted", accepted, "Good company on the way", "green"],
          [X, "Declined", declined, "Until the next occasion", "rose"],
          [Clock, "Pending", pending, "A little anticipation", "gold"],
        ].map(([Icon, label, value, caption, color]) => {
          const I = Icon as typeof Users;
          return (
            <div className="stat-card" key={String(label)}>
              <div className="stat-top">
                <span>{String(label)}</span>
                <span className={`stat-icon ${color}`}>
                  <I size={18} />
                </span>
              </div>
              <strong>{loading ? "—" : String(value)}</strong>
              <small>{String(caption)}</small>
            </div>
          );
        })}
      </div>
      {analytics && (
        <div className="metrics-strip">
          <span>
            <b>{events.length}</b>
            {uiText("ui.d319e5fa46b0")}
          </span>
          <span>
            <b>{guests.filter((g) => g.shareId).length}</b>
            {uiText("ui.991633af6993")}
          </span>
          <span>
            <b>{guests.filter((g) => g.shareStatus === "initiated").length}</b>{" "}
            {uiText("ui.cd3587a5501a")}
          </span>
          <span>
            <b>
              {guests.reduce(
                (n, g) =>
                  n + (g.rsvpStatus === "accepted" ? g.attendeesCount : 0),
                0,
              )}
            </b>{" "}
            {uiText("ui.4c2a8db78120")}
          </span>
        </div>
      )}
      <div className="dashboard-columns">
        <section className="panel response-panel">
          <div className="panel-heading">
            <div>
              <h2>{uiText("ui.60ab32671df4")}</h2>
              <p>{uiText("ui.fd31db0b8dd8")}</p>
            </div>
            <span className="live-badge">
              <span />
              {uiText("ui.b64ac05f17e6")}
            </span>
          </div>
          <div className="chart-layout">
            <div className="donut">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={
                      guests.length
                        ? data
                        : [
                            {
                              name: "No responses yet",
                              value: 1,
                              color: "#edf0eb",
                            },
                          ]
                    }
                    dataKey="value"
                    innerRadius={65}
                    outerRadius={83}
                    strokeWidth={0}
                    paddingAngle={guests.length ? 3 : 0}
                  >
                    {(guests.length ? data : [{ color: "#edf0eb" }]).map(
                      (v, i) => (
                        <Cell key={i} fill={v.color} />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <strong>
                  {guests.length
                    ? Math.round(
                        ((accepted + declined + maybe) / guests.length) * 100,
                      )
                    : 0}
                  %
                </strong>
                <span>{uiText("ui.42d72995406e")}</span>
              </div>
            </div>
            <div className="chart-legend">
              {data.map((d) => (
                <div key={d.name}>
                  <span>
                    <i style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <strong>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="panel-bottom">
            <Mail size={15} />
            {guests.length
              ? uiText("ui.b4627de88259", { value0: String(pending) })
              : uiText("ui.e752ec30b28d")}
          </div>
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>{uiText("ui.5a2e23e80637")}</h2>
              <p>{uiText("ui.693d4fd0ec4d")}</p>
            </div>
            <span className="activity-symbol">↗</span>
          </div>
          {activity.length ? (
            <div className="activity-list">
              {activity.map((g) => (
                <div className="activity-item" key={`${g.invitationId}${g.id}`}>
                  <span className={`activity-avatar ${g.rsvpStatus}`}>
                    {g.name[0]}
                  </span>
                  <div>
                    <strong>{g.name}</strong>
                    <p>
                      <span className={`status-text ${g.rsvpStatus}`}>
                        {g.rsvpStatus}
                      </span>{" "}
                      · {events.find((e) => e.id === g.invitationId)?.title}
                    </p>
                  </div>
                  <small>
                    {g.respondedAt?.toDate
                      ? format(g.respondedAt.toDate(), "MMM d, h:mm a")
                      : ""}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <div className="quiet-empty">
              <span className="empty-icon">
                <Mail size={25} />
              </span>
              <h3>{uiText("ui.da6aa9e55105")}</h3>
              <p>
                {uiText("ui.7754ff39f3fb")}
                <br />
                {uiText("ui.2ce7b9f14516")}
              </p>
            </div>
          )}
          <Link className="panel-bottom link-bottom" to="/guests">
            {uiText("ui.9d2d2eb013c7")}
            <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="section-title">
        <div>
          <h2>
            {analytics ? uiText("ui.df9110b56fb1") : uiText("ui.bd926c3a16c2")}
          </h2>
          <p>{uiText("ui.77a710ba9923")}</p>
        </div>
        <Link className="text-link" to="/invitations">
          {uiText("ui.9b66b1fae3ba")}
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="event-grid">
        {(analytics ? upcoming : events).slice(0, 3).map((e) => (
          <Link
            className="event-card"
            key={e.id}
            to={`/invitations/${e.id}/edit`}
          >
            <div className="event-art">
              <DesignPreview design={e.design} event={e} mini />
              <span className={`badge ${e.status}`}>{e.status}</span>
            </div>
            <div className="event-card-body">
              <span className="eyebrow">{e.eventType}</span>
              <h3>{e.title}</h3>
              <p>
                <CalendarDays size={14} />
                {e.eventDate || "Date to be decided"}
                <span>·</span>
                {guests.filter((g) => g.invitationId === e.id).length}
                {uiText("ui.d68761f770a1")}
              </p>
              <p>
                <MapPin size={14} />
                {e.venueName || "Venue to be decided"}
              </p>
            </div>
          </Link>
        ))}
        <Link to="/invitations/new" className="create-event-card">
          <span>
            <Plus size={26} />
          </span>
          <h3>{uiText("ui.959c90b93aa6")}</h3>
          <p>
            {uiText("ui.c7b3d900714f")}
            <br />
            {uiText("ui.0f6a87303e7e")}
          </p>
          <b>
            {uiText("ui.f063f6bf7add")}
            <ArrowRight size={15} />
          </b>
        </Link>
      </div>
      <div className="footnote">
        <Leaf size={16} />
        <p>{uiText("ui.3a2b54636008")}</p>
      </div>
    </>
  );
}
