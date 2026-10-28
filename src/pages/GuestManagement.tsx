import { uiText } from "../i18n/uiText";
import { GuestProfileFields } from "../components/invitations/GuestProfileFields";
import { InvitationQRCode } from "../components/invitations/InvitationQRCode";
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
  tagGuests,
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
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTags, setBulkTags] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<Guest> | null>(null);
  const [removing, setRemoving] = useState<Guest | null>(null);
  const [qrGuest, setQrGuest] = useState<{ url: string; name: string } | null>(
    null,
  );
  const [response, setResponse] = useState<Guest | null>(null);
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const activeId = id || eventId;
  const event = events.find((e) => e.id === activeId);
  const visible = guests.filter(
    (g) =>
      (!activeId || g.invitationId === activeId) &&
      `${g.name} ${g.firstName || ""} ${g.lastName || ""} ${g.phoneNumber} ${g.email || ""} ${g.category || ""} ${(g.tags || []).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" || g.rsvpStatus === filter) &&
      (!categoryFilter || (g.category || "Other") === categoryFilter),
  );
  const selectedGuests = guests.filter(
    (guest) =>
      guest.source !== "public" &&
      selected.includes(`${guest.invitationId}/${guest.id}`),
  );
  const visiblePersonal = visible.filter((guest) => guest.source !== "public");
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
    if (!e) throw new Error(uiText("ui.a05a7a2841f1"));
    return publishGuest(e, g);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{uiText("ui.0403c1733c43")}</span>
          <h1>
            {id ? event?.title || "Your guest list" : uiText("ui.e995e909e691")}
          </h1>
          <p>{uiText("ui.74f4dd61d2a0")}</p>
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
                  "First name",
                  "Last name",
                  "Category",
                  "Planned adults",
                  "Planned children",
                  "Meal preference",
                  "Dietary restrictions",
                  "Private notes",
                  "Tags",
                ],
                ...visible.map((g) => [
                  g.name,
                  g.phoneNumber,
                  g.email,
                  g.guestCountAllowed,
                  g.rsvpStatus,
                  g.attendeesCount,
                  g.shareStatus,
                  g.firstName,
                  g.lastName,
                  g.category,
                  g.adultCount,
                  g.childCount,
                  g.mealPreference,
                  g.dietaryRestrictions,
                  g.privateNotes,
                  (g.tags || []).join(";"),
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
            {uiText("ui.3664895579f0")}
          </button>
          <button
            className="button primary"
            onClick={() => {
              if (!activeId) {
                toast.error(uiText("ui.7de903b2a7c9"));
                return;
              }
              setEditing({ ...empty });
            }}
            disabled={!events.length}
          >
            <Plus size={17} />
            {uiText("ui.d675272d0ef6")}
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="panel guest-event-selector">
        <label>
          {uiText("ui.4a268e080c6d")}
          <select
            value={activeId}
            disabled={!!id}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">{uiText("ui.f2ffa526bb1a")}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {e.status}
              </option>
            ))}
          </select>
        </label>
        <div>
          <strong>{visible.length}</strong>
          <span>{uiText("ui.bd1e1c6c2136")}</span>
        </div>
        <button
          className="button outline small"
          disabled={!activeId || busy}
          onClick={() => importRef.current?.click()}
        >
          <Upload size={15} />
          {uiText("ui.9982ac26053c")}
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
                toast.success(uiText("ui.4e453a08e12f"));
              })
            }
          >
            {uiText("invitation.copyLink")}
          </button>
        )}
        {event && (
          <Link className="text-link" to={`/invitations/${event.id}/edit`}>
            {uiText("ui.db6f42b128ec")}
          </Link>
        )}
      </div>
      <div className="helper import-hint">{uiText("ui.94e0f23fbb60")}</div>
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
                  uiText("ui.af56f27dfc14", {
                    value0: String(count),
                    value1: String(count + 2),
                    value2: String(errorMessage(err)),
                  }),
                );
              }
            }
            toast.success(uiText("ui.77f3fde0f364", { value0: String(count) }));
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
              {s === "all" ? uiText("ui.196cbccb7182") : s}
            </button>
          ))}
        </div>
        <div className="search-input">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={uiText("ui.67db96774336")}
            aria-label={uiText("ui.03306d0ca190")}
          />
        </div>
      </div>
      <div className="upgrade-controls">
        <label>
          {uiText("ui.112c0333dc7b")}
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">{uiText("ui.9d5097a83710")}</option>
            {[...new Set(guests.map((guest) => guest.category || "Other"))]
              .sort()
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
        </label>
        <p>
          {selectedGuests.length}
          {uiText("ui.d7a3906295f0")}
        </p>
        <label>
          {uiText("ui.7cdc3ca852df")}
          <input
            value={bulkTags}
            onChange={(event) => setBulkTags(event.target.value)}
            placeholder={uiText("ui.d6a7af13b422")}
          />
        </label>
        <button
          className="button outline"
          disabled={busy || !selectedGuests.length || !bulkTags.trim()}
          onClick={() =>
            act(async () => {
              await tagGuests(selectedGuests, bulkTags.split(","));
              setBulkTags("");
              toast.success(uiText("ui.d404e3cf7a62"));
            })
          }
        >
          {uiText("ui.a0820d6a9d95")}
        </button>
        <button
          className="button outline"
          disabled={busy || !selectedGuests.length}
          onClick={() =>
            act(async () => {
              const links: string[] = [];
              for (const guest of selectedGuests) {
                const id = await link(guest);
                links.push(
                  `${guest.name}: ${shareUrl(id, events.find((event) => event.id === guest.invitationId)?.hostName)}`,
                );
              }
              download(
                "personal-invitation-links.txt",
                links.join("\n"),
                "text/plain",
              );
              toast.success(uiText("ui.7c8e3061d2fd"));
            })
          }
        >
          {uiText("ui.9393d9f46191")}
        </button>
      </div>
      <div
        className="panel table-wrap"
        role="region"
        aria-label={uiText("ui.2cccffaae528")}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label={uiText("ui.0f2668df9e96")}
                  checked={
                    !!visiblePersonal.length &&
                    visiblePersonal.every((guest) =>
                      selected.includes(`${guest.invitationId}/${guest.id}`),
                    )
                  }
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [
                            ...new Set([
                              ...selected,
                              ...visiblePersonal.map(
                                (guest) => `${guest.invitationId}/${guest.id}`,
                              ),
                            ]),
                          ]
                        : selected.filter(
                            (key) =>
                              !visiblePersonal.some(
                                (guest) =>
                                  key === `${guest.invitationId}/${guest.id}`,
                              ),
                          ),
                    )
                  }
                />
              </th>
              <th>{uiText("ui.5ed8944a85a9")}</th>
              <th>{uiText("ui.ec21453f9cd8")}</th>
              <th>{uiText("ui.bbedc70e985f")}</th>
              <th>{uiText("ui.1dfe8a8e0cb2")}</th>
              <th>{uiText("ui.e2e8d95fc673")}</th>
              <th>{uiText("ui.aab7a52cb5bc")}</th>
              <th>{uiText("ui.ff8059dc6752")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((g) => (
              <tr key={`${g.invitationId}${g.id}`}>
                <td>
                  {g.source !== "public" && (
                    <input
                      type="checkbox"
                      aria-label={uiText("ui.33de0e8b35aa", {
                        value0: String(g.name),
                      })}
                      checked={selected.includes(`${g.invitationId}/${g.id}`)}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, `${g.invitationId}/${g.id}`]
                            : selected.filter(
                                (key) => key !== `${g.invitationId}/${g.id}`,
                              ),
                        )
                      }
                    />
                  )}
                </td>
                <td>
                  <div className="table-person">
                    <span>{g.name[0]}</span>
                    <div>
                      <strong>{g.name}</strong>
                      {g.category && (
                        <small>
                          {g.category}
                          {g.tags?.length
                            ? uiText("ui.3267fe748b7b", {
                                value0: String(g.tags.join(", ")),
                              })
                            : ""}
                        </small>
                      )}
                      {g.respondentName && (
                        <small>
                          {uiText("ui.c0bf568963a3")}
                          {g.respondentName}
                        </small>
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
                      ? uiText("ui.d773727fff8a")
                      : g.source === "public"
                        ? uiText("ui.178b790b1cb2")
                        : uiText("ui.f8a76298d2e8")}
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
                        aria-label={uiText("ui.ee8d94b3fb47", {
                          value0: String(g.name),
                        })}
                        onClick={() => setResponse(g)}
                      >
                        <Eye size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          className="icon-button"
                          aria-label={uiText("ui.f150cd1e7a51", {
                            value0: String(g.name),
                          })}
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              const id = await link(g);
                              setQrGuest({
                                url: shareUrl(
                                  id,
                                  events.find(
                                    (event) => event.id === g.invitationId,
                                  )?.hostName,
                                ),
                                name: g.name,
                              });
                            })
                          }
                        >
                          {uiText("ui.a439fba430a3")}
                        </button>
                        <button
                          className="icon-button"
                          title={uiText("ui.1906197e58ac")}
                          aria-label={uiText("ui.305264e2bb42", {
                            value0: String(g.name),
                          })}
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              const share = await link(g);
                              await navigator.clipboard.writeText(
                                shareUrl(share, event?.hostName),
                              );
                              toast.success(uiText("ui.cbf5b377e319"));
                            })
                          }
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="icon-button whatsapp"
                          title={uiText("ui.a16f49488c59")}
                          aria-label={uiText("ui.0c4a806209e2", {
                            value0: String(g.name),
                          })}
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
                                  throw new Error(uiText("ui.412b1cf6058f"));
                                popup.location.href = url;
                                await markShared(g.invitationId, g.id);
                                toast.success(uiText("ui.d92421816079"));
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
                          title={uiText("ui.d64914064077")}
                          aria-label={uiText("ui.ee8d94b3fb47", {
                            value0: String(g.name),
                          })}
                          onClick={() => setResponse(g)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="icon-button"
                          title={uiText("ui.57438897845a")}
                          aria-label={uiText("ui.6ec4b47d02bf", {
                            value0: String(g.name),
                          })}
                          onClick={() => {
                            setEventId(g.invitationId);
                            setEditing(g);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button"
                          title={uiText("ui.ef798c0bff00")}
                          aria-label={uiText("ui.7b6f27d0c5ed", {
                            value0: String(g.name),
                          })}
                          disabled={busy || !g.shareId}
                          onClick={() =>
                            act(async () => {
                              await revokeGuest(g.invitationId, g);
                              toast.success(uiText("ui.6fb71cd5dc5f"));
                            })
                          }
                        >
                          <RotateCw size={15} />
                        </button>
                        <button
                          className="icon-button danger-text"
                          title={uiText("ui.587fcf1aa63c")}
                          aria-label={uiText("ui.e224cf245aad", {
                            value0: String(g.name),
                          })}
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
                ? uiText("ui.2c5996f6e19b")
                : guests.length
                  ? uiText("ui.89000e966aaf")
                  : uiText("ui.2158a8b16b00")}
            </h3>
            <p>
              {events.length
                ? uiText("ui.30b72e91c10f")
                : uiText("ui.987ef813533d")}
            </p>
            {!events.length && (
              <Link className="button primary" to="/invitations/new">
                {uiText("invitation.create")}
              </Link>
            )}
          </div>
        )}
      </div>
      <p className="helper">{uiText("ui.ea9483458cd8")}</p>
      {editing && (
        <Modal
          title={
            editing.id ? uiText("ui.88449e4dc66b") : uiText("ui.23cf9046ead3")
          }
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                await saveGuest(editing.invitationId || activeId, editing);
                setEditing(null);
                toast.success(uiText("ui.0773b9418fc1"));
              });
            }}
          >
            <label>
              {uiText("ui.e34006b5ed3b")}
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
              {uiText("ui.ec21453f9cd8")}
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
              {uiText("ui.6eea8608c452")}
              <input
                type="email"
                value={editing.email || ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </label>
            <label>
              {uiText("ui.6fc7fcbcf19b")}
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
            <GuestProfileFields guest={editing} onChange={setEditing} />
            <div className="modal-actions">
              <button
                type="button"
                className="button outline"
                onClick={() => setEditing(null)}
              >
                {uiText("common.cancel")}
              </button>
              <button disabled={busy} className="button primary">
                {busy ? uiText("ui.23e39291d613") : uiText("ui.4bed077d55db")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal
          title={uiText("ui.d69641b09ea9", { value0: String(removing.name) })}
          onClose={() => setRemoving(null)}
        >
          <p>{uiText("ui.6ae34961983a")}</p>
          <div className="modal-actions">
            <button
              className="button outline"
              onClick={() => setRemoving(null)}
            >
              {uiText("ui.f715fb35ba36")}
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  await revokeGuest(removing.invitationId, removing, true);
                  setRemoving(null);
                  toast.success(uiText("ui.a80b98375bcf"));
                })
              }
            >
              {uiText("ui.587fcf1aa63c")}
            </button>
          </div>
        </Modal>
      )}
      {qrGuest && (
        <InvitationQRCode
          url={qrGuest.url}
          title={qrGuest.name}
          onClose={() => setQrGuest(null)}
        />
      )}
      {response && (
        <Modal
          title={uiText("ui.6eae5c7bd1c2", { value0: String(response.name) })}
          onClose={() => setResponse(null)}
        >
          <p>
            {uiText("ui.29e8a4686393")}{" "}
            <span className={`badge ${response.rsvpStatus}`}>
              {response.rsvpStatus}
            </span>
          </p>
          <p>
            {uiText("ui.0a2ad02934b8")}
            {response.respondentName || response.name}
          </p>
          <p>
            {uiText("ui.32b7e7bdf05b")}
            {response.attendeesCount || 0}
            {uiText("ui.88eb5a7ed273")} {response.guestCountAllowed}
            {uiText("ui.f03ea87fed05")}
          </p>
          <p>
            {uiText("ui.fb33f0fc987c")}{" "}
            {response.respondedAt?.toDate?.().toLocaleString() ||
              "Awaiting a response"}
          </p>
          {response.answers && (
            <dl className="rsvp-answer-list">
              {Object.entries(response.answers).map(([key, value]) => (
                <div key={key}>
                  <dt>
                    {events.find((event) => event.id === response.invitationId)
                      ?.rsvpQuestions?.[key]?.label || "Earlier question"}
                  </dt>
                  <dd>
                    {Array.isArray(value)
                      ? value.join(", ")
                      : typeof value === "boolean"
                        ? value
                          ? uiText("ui.85a39ab345d6")
                          : uiText("ui.1ea442a134b2")
                        : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p className="helper">{uiText("ui.543c90eef979")}</p>
        </Modal>
      )}
    </>
  );
}
