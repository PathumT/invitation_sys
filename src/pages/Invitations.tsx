import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  CalendarDays,
  Users,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { DesignPreview } from "../components/invitations/DesignPreview";
import { deleteInvitation } from "../services/invitationService";
import { Modal } from "../components/ui/Modal";
import { toast } from "sonner";
import { errorMessage } from "../utils";
export default function Invitations() {
  const { events, guests, loading, error } = useWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [remove, setRemove] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || e.status === status),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">BIG DAYS & LITTLE GATHERINGS</span>
          <h1>My invitations</h1>
          <p>A home for every occasion you’re bringing to life.</p>
        </div>
        <Link to="/invitations/new" className="button primary">
          <Plus size={17} />
          Create invitation
        </Link>
      </div>
      <div className="filter-bar">
        <div className="tabs">
          {["all", "published", "draft", "archived"].map((s) => (
            <button
              className={status === s ? "active" : ""}
              key={s}
              onClick={() => setStatus(s)}
            >
              {s === "all" ? "All invitations" : s}
            </button>
          ))}
        </div>
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search invitations"
            placeholder="Find an occasion…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="error-banner">{error}</p>}
      {loading ? (
        <div className="skeleton">Loading your occasions…</div>
      ) : (
        <div className="event-grid library-grid">
          {filtered.map((e) => (
            <article className="event-card" key={e.id}>
              <Link to={`/invitations/${e.id}/edit`} className="event-art">
                <DesignPreview design={e.design} event={e} mini />
                <span className={`badge ${e.status}`}>{e.status}</span>
              </Link>
              <div className="event-card-body">
                <span className="eyebrow">{e.eventType}</span>
                <h3>{e.title}</h3>
                <p>
                  <CalendarDays size={14} />
                  {e.eventDate || "Date to be decided"}
                </p>
                <p>
                  <Users size={14} />
                  {guests.filter((g) => g.invitationId === e.id).length} guests
                </p>
                <div className="card-actions">
                  <Link
                    to={`/invitations/${e.id}/guests`}
                    className="text-link"
                  >
                    Manage guests <ArrowUpRight size={15} />
                  </Link>
                  <button
                    aria-label={`Delete ${e.title}`}
                    className="icon-button danger-text"
                    onClick={() => setRemove(e.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          <Link to="/invitations/new" className="create-event-card">
            <span>
              <Plus size={26} />
            </span>
            <h3>
              {events.length
                ? "Make another memory."
                : "Your first occasion awaits."}
            </h3>
            <p>
              Choose a design, add your details,
              <br />
              and make it yours.
            </p>
            <b>
              Create invitation <ArrowUpRight size={15} />
            </b>
          </Link>
        </div>
      )}
      {remove && (
        <Modal title="Delete this invitation?" onClose={() => setRemove("")}>
          <p>
            This revokes its public guest links and removes the event and guest
            list. This cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="button outline" onClick={() => setRemove("")}>
              Keep invitation
            </button>
            <button
              disabled={busy}
              className="button danger"
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteInvitation(remove);
                  setRemove("");
                  toast.success("Invitation deleted.");
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting…" : "Delete invitation"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
