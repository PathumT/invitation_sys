import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Plus,
  Search,
  Upload,
  Download,
  Copy,
  MessageCircle,
  Pencil,
  Trash2,
  RotateCw,
  Link2,
  Eye,
} from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { ensurePublicLink } from "../services/publicLinkService";
import { Modal } from "../components/ui/Modal";
import {
  saveGuest,
  publishGuest,
  revokeGuest,
  markShared,
} from "../services/guestService";
import { shareUrl, whatsappUrl, errorMessage, download } from "../utils";
import { toast } from "sonner";
import type { Guest, Invitation } from "../types";
const empty = { name: "", phoneNumber: "", email: "", guestCountAllowed: 1 };
export default function GuestManagement() {
  const { id } = useParams();
  const { events, guests, loading, error } = useWorkspace();
  const [eventId, setEventId] = useState(id || "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<Guest> | null>(null);
  const [removing, setRemoving] = useState<Guest | null>(null);
  const [response, setResponse] = useState<Guest | null>(null);
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const activeId = id || eventId;
  const event = events.find((e) => e.id === activeId);
  const visible = guests.filter(
    (g) =>
      (!activeId || g.invitationId === activeId) &&
      `${g.name} ${g.phoneNumber}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" || g.rsvpStatus === filter),
  );
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function link(g: Guest) {
    const e = events.find((e) => e.id === g.invitationId);
    if (!e) throw new Error("Event not found.");
    return publishGuest(e, g);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE PEOPLE MAKE THE OCCASION</span>
          <h1>
            {id
              ? event?.title || "Your guest list"
              : "Your people, all together."}
          </h1>
          <p>
            Personal invitations. Real responses. A little less to keep track
            of.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button outline"
            disabled={busy}
            onClick={() => {
              const csv = [
                [
                  "Name",
                  "Phone",
                  "Email",
                  "Allowed attendees",
                  "RSVP",
                  "Attendees",
                  "Sharing",
                ],
                ...visible.map((g) => [
                  g.name,
                  g.phoneNumber,
                  g.email,
                  g.guestCountAllowed,
                  g.rsvpStatus,
                  g.attendeesCount,
                  g.shareStatus,
                ]),
              ]
                .map((row) =>
                  row
                    .map(
                      (v) =>
                        `"${String(v ?? "")
                          .replace(/^[=+@-]/, "'$&")
                          .replace(/"/g, '""')}"`,
                    )
                    .join(","),
                )
                .join("\r\n");
              download("evently-invitations-guests.csv", csv);
            }}
          >
            <Download size={16} />
            Export
          </button>
          <button
            className="button primary"
            onClick={() => {
              if (!activeId) {
                toast.error("Choose an event before adding guests.");
                return;
              }
              setEditing({ ...empty });
            }}
            disabled={!events.length}
          >
            <Plus size={17} />
            Add guest
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="panel guest-event-selector">
        <label>
          Choose an occasion
          <select
            value={activeId}
            disabled={!!id}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">All occasions</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {e.status}
              </option>
            ))}
          </select>
        </label>
        <div>
          <strong>{visible.length}</strong>
          <span> guests in this view</span>
        </div>
        <button
          className="button outline small"
          disabled={!activeId || busy}
          onClick={() => importRef.current?.click()}
        >
          <Upload size={15} />
          Import CSV
        </button>
        {event?.status === "published" && (
          <button
            className="button primary small"
            disabled={busy}
            onClick={() =>
              act(async () => {
                const id = await ensurePublicLink(event);
                await navigator.clipboard.writeText(
                  shareUrl(id, event.hostName),
                );
                toast.success(
                  "Public invitation link copied. Anyone can respond.",
                );
              })
            }
          >
            Copy public link
          </button>
        )}
        {event && (
          <Link className="text-link" to={`/invitations/${event.id}/edit`}>
            Edit invitation →
          </Link>
        )}
      </div>
      <div className="helper import-hint">
        CSV columns: name, phone, email, allowed attendees. Use international
        phone numbers. Sharing opens WhatsApp for you to send manually; delivery
        is not tracked.
      </div>
      <input
        ref={importRef}
        hidden
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          void act(async () => {
            const { parseGuestCSV } = await import("../utils/csv");
            const rows = parseGuestCSV(await file.text());
            let count = 0;
            for (const row of rows) {
              try {
                await saveGuest(activeId, row);
                count++;
              } catch (err) {
                throw new Error(
                  `Imported ${count} guests. Row ${count + 2}: ${errorMessage(err)}`,
                );
              }
            }
            toast.success(`Imported ${count} guests.`);
          });
          e.target.value = "";
        }}
      />
      <div className="filter-bar">
        <div className="tabs">
          {["all", "accepted", "declined", "maybe", "pending"].map((s) => (
            <button
              key={s}
              className={filter === s ? "active" : ""}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "All guests" : s}
            </button>
          ))}
        </div>
        <div className="search-input">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a guest…"
            aria-label="Search guests"
          />
        </div>
      </div>
      <div
        className="panel table-wrap"
        role="region"
        aria-label="Guest list table, scroll horizontally for more details and actions"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>Guest</th>
              <th>WhatsApp number</th>
              <th>Sharing</th>
              <th>RSVP</th>
              <th>Attendees</th>
              <th>Response date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((g) => (
              <tr key={`${g.invitationId}${g.id}`}>
                <td>
                  <div className="table-person">
                    <span>{g.name[0]}</span>
                    <div>
                      <strong>{g.name}</strong>
                      {g.respondentName && (
                        <small>RSVP name: {g.respondentName}</small>
                      )}
                      <small>
                        {events.find((e) => e.id === g.invitationId)?.title}
                      </small>
                    </div>
                  </div>
                </td>
                <td>{g.phoneNumber || "—"}</td>
                <td>
                  <span
                    className={`badge ${g.shareStatus === "initiated" ? "published" : "draft"}`}
                  >
                    {g.shareStatus === "initiated"
                      ? "Sharing initiated"
                      : g.source === "public"
                        ? "Public link"
                        : "Not shared"}
                  </span>
                </td>
                <td>
                  <span className={`badge ${g.rsvpStatus}`}>
                    {g.rsvpStatus}
                  </span>
                </td>
                <td>
                  {g.rsvpStatus === "accepted" ? g.attendeesCount : "—"}{" "}
                  <small className="muted">/ {g.guestCountAllowed}</small>
                </td>
                <td>{g.respondedAt?.toDate?.().toLocaleString() || "—"}</td>
                <td>
                  <div className="table-actions">
                    {g.source === "public" ? (
                      <button
                        className="icon-button"
                        aria-label={`View response from ${g.name}`}
                        onClick={() => setResponse(g)}
                      >
                        <Eye size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          className="icon-button"
                          title="Copy personalized link"
                          aria-label={`Copy link for ${g.name}`}
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              const share = await link(g);
                              await navigator.clipboard.writeText(
                                shareUrl(share, event?.hostName),
                              );
                              toast.success("Personal invitation link copied.");
                            })
                          }
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="icon-button whatsapp"
                          title="Share / resend via WhatsApp"
                          aria-label={`Share with ${g.name}`}
                          disabled={busy}
                          onClick={() => {
                            const popup = window.open("about:blank", "_blank");
                            if (popup) popup.opener = null;
                            void act(async () => {
                              try {
                                const share = await link(g);
                                const url = whatsappUrl(
                                  g.phoneNumber,
                                  g.name,
                                  events.find(
                                    (e) => e.id === g.invitationId,
                                  ) as Invitation,
                                  share,
                                );
                                if (!popup)
                                  throw new Error(
                                    "Allow popups to open WhatsApp.",
                                  );
                                popup.location.href = url;
                                await markShared(g.invitationId, g.id);
                                toast.success(
                                  "WhatsApp opened. Send the message to complete sharing.",
                                );
                              } catch (err) {
                                popup?.close();
                                throw err;
                              }
                            });
                          }}
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          className="icon-button"
                          title="View response"
                          aria-label={`View response from ${g.name}`}
                          onClick={() => setResponse(g)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="icon-button"
                          title="Edit guest"
                          aria-label={`Edit ${g.name}`}
                          onClick={() => {
                            setEventId(g.invitationId);
                            setEditing(g);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button"
                          title="Revoke current link"
                          aria-label={`Revoke link for ${g.name}`}
                          disabled={busy || !g.shareId}
                          onClick={() =>
                            act(async () => {
                              await revokeGuest(g.invitationId, g);
                              toast.success(
                                "Link revoked. Copy or share to generate a new link.",
                              );
                            })
                          }
                        >
                          <RotateCw size={15} />
                        </button>
                        <button
                          className="icon-button danger-text"
                          title="Remove guest"
                          aria-label={`Remove ${g.name}`}
                          onClick={() => setRemoving(g)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="quiet-empty">
            <span className="empty-icon">
              <Link2 size={26} />
            </span>
            <h3>
              {loading
                ? "Loading your guests…"
                : guests.length
                  ? "No guests match this view."
                  : "Every gathering starts with someone."}
            </h3>
            <p>
              {events.length
                ? "Choose an occasion and add your first guest."
                : "Create an invitation to start building your guest list."}
            </p>
            {!events.length && (
              <Link className="button primary" to="/invitations/new">
                Create invitation
              </Link>
            )}
          </div>
        )}
      </div>
      <p className="helper">
        Page opens are omitted because client-only tracking cannot reliably
        identify human views. RSVPs are recorded independently in real time.
      </p>
      {editing && (
        <Modal
          title={
            editing.id ? "A little guest update" : "Someone to celebrate with"
          }
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                await saveGuest(editing.invitationId || activeId, editing);
                setEditing(null);
                toast.success("Guest saved.");
              });
            }}
          >
            <label>
              Guest name
              <input
                required
                value={editing.name || ""}
                maxLength={160}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label>
              WhatsApp number
              <input
                type="tel"
                required
                placeholder="+94 77 123 4567"
                value={editing.phoneNumber || ""}
                onChange={(e) =>
                  setEditing({ ...editing, phoneNumber: e.target.value })
                }
              />
            </label>
            <label>
              Email (optional)
              <input
                type="email"
                value={editing.email || ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </label>
            <label>
              Allowed attendees
              <input
                type="number"
                min="1"
                max="20"
                required
                value={editing.guestCountAllowed}
                onChange={(e) =>
                  setEditing({ ...editing, guestCountAllowed: +e.target.value })
                }
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button disabled={busy} className="button primary">
                {busy ? "Saving…" : "Save guest"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal
          title={`Remove ${removing.name}?`}
          onClose={() => setRemoving(null)}
        >
          <p>Their personal invitation link will also be revoked.</p>
          <div className="modal-actions">
            <button
              className="button outline"
              onClick={() => setRemoving(null)}
            >
              Keep guest
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  await revokeGuest(removing.invitationId, removing, true);
                  setRemoving(null);
                  toast.success("Guest removed.");
                })
              }
            >
              Remove guest
            </button>
          </div>
        </Modal>
      )}
      {response && (
        <Modal
          title={`${response.name}’s response`}
          onClose={() => setResponse(null)}
        >
          <p>
            RSVP:{" "}
            <span className={`badge ${response.rsvpStatus}`}>
              {response.rsvpStatus}
            </span>
          </p>
          <p>Responded as: {response.respondentName || response.name}</p>
          <p>
            Attendees: {response.attendeesCount || 0} of{" "}
            {response.guestCountAllowed} allowed
          </p>
          <p>
            Responded:{" "}
            {response.respondedAt?.toDate?.().toLocaleString() ||
              "Awaiting a response"}
          </p>
          <p className="helper">
            This is the latest response received when you opened this dialog.
          </p>
        </Modal>
      )}
    </>
  );
}
