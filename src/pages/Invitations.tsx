import { uiText } from "../i18n/uiText";
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
          <span className="eyebrow">{uiText("ui.d046de14c639")}</span>
          <h1>{uiText("nav.invitations")}</h1>
          <p>{uiText("ui.00d82df7da24")}</p>
        </div>
        <Link to="/invitations/new" className="button primary">
          <Plus size={17} />
          {uiText("invitation.create")}
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
              {s === "all" ? uiText("ui.ef51660eb5e1") : s}
            </button>
          ))}
        </div>
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label={uiText("ui.4ae613ba820d")}
            placeholder={uiText("ui.1de712140d0b")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="error-banner">{error}</p>}
      {loading ? (
        <div className="skeleton">{uiText("ui.f36d4708595b")}</div>
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
                  {guests.filter((g) => g.invitationId === e.id).length}
                  {uiText("ui.d68761f770a1")}
                </p>
                <div className="card-actions">
                  <Link
                    to={`/invitations/${e.id}/guests`}
                    className="text-link"
                  >
                    {uiText("ui.5388f68999c8")}
                    <ArrowUpRight size={15} />
                  </Link>
                  <button
                    aria-label={uiText("ui.50256b3995d6", {
                      value0: String(e.title),
                    })}
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
                ? uiText("ui.4cf100fcd5ea")
                : uiText("ui.0cd70885132f")}
            </h3>
            <p>
              {uiText("ui.3fad2d03734e")}
              <br />
              {uiText("ui.8f7ecc2a4f3e")}
            </p>
            <b>
              {uiText("ui.f063f6bf7add")}
              <ArrowUpRight size={15} />
            </b>
          </Link>
        </div>
      )}
      {remove && (
        <Modal title={uiText("ui.0e5d7537b52a")} onClose={() => setRemove("")}>
          <p>{uiText("ui.a13604ce30a7")}</p>
          <div className="modal-actions">
            <button className="button outline" onClick={() => setRemove("")}>
              {uiText("ui.1de10d002022")}
            </button>
            <button
              disabled={busy}
              className="button danger"
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteInvitation(remove);
                  setRemove("");
                  toast.success(uiText("ui.d3169492c581"));
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? uiText("ui.43b5894c3e4e") : uiText("ui.6daff779d26e")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
