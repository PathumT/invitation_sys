import { useEffect, useState, type CSSProperties } from "react";
import { format, parseISO, isValid } from "date-fns";
import { invitationTheme } from "../utils/invitationTheme";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import {
  CalendarDays,
  MapPin,
  Clock,
  Check,
  Heart,
  Flower2,
} from "lucide-react";
import { db } from "../firebase/config";
import { respond } from "../services/rsvpService";
import { ensurePublicLink, responseToken } from "../services/publicLinkService";
import { DesignPreview } from "../components/invitations/DesignPreview";
import type {
  PublicInvitation as PublicData,
  RSVPStatus,
  Invitation,
} from "../types";
import { mapsUrl, errorMessage } from "../utils";
import { toast } from "sonner";
export function GuestExperience({
  data,
  preview = false,
  shareId = "",
  embedded = false,
}: {
  data: PublicData;
  preview?: boolean;
  shareId?: string;
  embedded?: boolean;
}) {
  const e = data.publishedSnapshot;
  const grandOpening = e.design.presentation === "grand-opening";
  const open = data.mode === "open" || preview;
  const [responseId, setResponseId] = useState(() =>
    open && shareId ? responseToken(shareId) : "current",
  );
  const [activeShareId, setActiveShareId] = useState(shareId);
  const decoration = e.design.elements.find(
    (el) => el.type === "image" && el.src?.startsWith("/templates/"),
  );
  const customArtwork = e.design.elements.some(
    (el) => el.type === "image" && !el.src?.startsWith("/templates/"),
  );
  const customText = e.design.elements.filter(
    (el) =>
      el.type === "text" &&
      el.text &&
      !el.text.includes("{{") &&
      !["eyebrow", "intro", "closing", "date-label", "opening-word"].includes(
        el.id,
      ),
  );
  const parsedDate = parseISO(e.eventDate);
  const dayLabel = isValid(parsedDate)
    ? format(parsedDate, "EEEE, d MMMM yyyy")
    : e.eventDate;
  const timeLabel = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    return Number.isFinite(h) && Number.isFinite(m)
      ? `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
      : value;
  };
  const [name, setName] = useState(data.guestDisplayName);
  const [nameError, setNameError] = useState("");
  const [status, setStatus] = useState<RSVPStatus>("pending");
  const [busy, setBusy] = useState(false);
  const [responseError, setResponseError] = useState("");
  useEffect(() => {
    if (preview) return;
    return onSnapshot(
      doc(db, "publicInvitations", shareId, "response", responseId),
      (r) => {
        if (r.exists()) {
          setStatus(r.data().rsvpStatus);
          if (r.data().respondentName) setName(r.data().respondentName);
        }
      },
      (err) => setResponseError(err.message),
    );
  }, [shareId, preview, responseId]);
  let location = "";
  try {
    location = mapsUrl(
      e.googleMapsUrl,
      e.latitude,
      e.longitude,
      e.venueAddress,
    );
  } catch {
    location = "";
  }
  async function submit(s: "accepted" | "declined") {
    if (!name.trim() || name.trim().length > 160) {
      setNameError("Please enter your name (up to 160 characters).");
      return;
    }
    setNameError("");
    setBusy(true);
    try {
      const target = preview ? await ensurePublicLink(e) : shareId;
      const key =
        preview && responseId === "current"
          ? responseToken(target)
          : responseId;
      await respond(target, s, name, key);
      setActiveShareId(target);
      setResponseId(key);
      setStatus(s);
      toast.success("Thank you. Your response has been saved.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className={`guest-page unified-invitation ${grandOpening ? "grand-opening-invitation" : ""}`}
      style={invitationTheme(e.design) as CSSProperties}
    >
      {preview && !embedded && (
        <div className="preview-notice">
          Owner preview ·{" "}
          <Link to={`/invitations/${e.id}/edit`}>Return to editor</Link>
        </div>
      )}
      <article
        className="invitation-sheet"
        aria-label={`${e.title || "Your event"} invitation card`}
      >
        {(customArtwork || grandOpening) && (
          <div className="invitation-artwork-first" aria-label="Invitation design">
            <DesignPreview
              design={e.design}
              event={e}
              guest={data.guestDisplayName}
            />
          </div>
        )}
        {!(customArtwork || grandOpening) && <header className="compact-card-header">
          {decoration && (
            <img
              className="compact-card-decoration"
              src={decoration.src}
              alt=""
              aria-hidden="true"
            />
          )}
          {!grandOpening && (
            <Flower2
              className="compact-card-flower"
              size={28}
              strokeWidth={1}
            />
          )}
          <span className="eyebrow">
            {e.eventType || "A special occasion"} · YOU’RE INVITED
          </span>
          {grandOpening && (
            <div className="opening-headline" aria-label="Grand opening">
              <span>GRAND</span>
              <span>OPENING</span>
            </div>
          )}
          <h1>{e.title || "A special celebration"}</h1>
          {e.hostName && (
            <p className="compact-host">
              Hosted by <strong>{e.hostName}</strong>
            </p>
          )}
          <h2 className="compact-guest">
            {data.guestDisplayName
              ? `For ${data.guestDisplayName}`
              : "You’re warmly invited"}
          </h2>
          {customText.map((el) => (
            <p className="compact-custom-text" key={el.id}>
              {el.text}
            </p>
          ))}
        </header>}
        <div className="guest-content">
          {!(customArtwork || grandOpening) && <>
          <p className="guest-message">{e.message}</p>
          <div className="guest-details">
            <div>
              <CalendarDays />
              <p>
                <small>THE DAY</small>
                <strong>{dayLabel || "Date to be confirmed"}</strong>
              </p>
            </div>
            <div>
              <Clock />
              <p>
                <small>THE TIME</small>
                <strong>
                  {timeLabel(e.eventTime)}
                  {e.endTime ? ` – ${timeLabel(e.endTime)}` : ""}
                </strong>
                <span>{e.timezone}</span>
              </p>
            </div>
            <div>
              <MapPin />
              <p>
                <small>THE PLACE</small>
                <strong>{e.venueName}</strong>
                <span>{e.venueAddress}</span>
              </p>
            </div>
          </div>
          </>}
          {location ? (
            <a
              className="button outline full"
              href={location}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={16} />
              View Location on Google Maps
            </a>
          ) : (
            <p className="helper">Contact your host for directions.</p>
          )}
          {e.notes && (
            <details className="compact-extra">
              <summary>Additional event details</summary>
              <p className="guest-notes">{e.notes}</p>
            </details>
          )}
          {e.contactNumber && (
            <a
              className="compact-contact"
              href={`tel:${e.contactNumber.replace(/[^+\d]/g, "")}`}
            >
              Contact host · {e.contactNumber}
            </a>
          )}
          <div className="rsvp-section">
            <h2>Will you join us?</h2>
            {status !== "pending" && (
              <div role="status" className="response-confirmation">
                <Check size={16} />
                Your response: {status}. You can change it below.
              </div>
            )}
            {responseError && (
              <p className="error">
                Could not load the previous response: {responseError}
              </p>
            )}
            <label>
              Your name
              <input
                type="text"
                autoComplete="name"
                required
                maxLength={160}
                value={name}
                disabled={busy}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "rsvp-name-error" : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
              />
              {nameError && (
                <span id="rsvp-name-error" className="error" role="alert">
                  {nameError}
                </span>
              )}
            </label>
            <div className="compact-rsvp-actions">
              <button
                className="button primary full"
                disabled={busy || (preview && e.status !== "published")}
                onClick={() => submit("accepted")}
              >
                <Heart size={16} />
                {busy ? "Saving…" : "Accept Invitation"}
              </button>
              <button
                className="button outline"
                disabled={busy || (preview && e.status !== "published")}
                onClick={() => submit("declined")}
              >
                Decline Invitation
              </button>
            </div>
            <small>Your response is shared with your host.</small>
            {preview && e.status !== "published" && (
              <p className="helper">
                Publish this invitation to enable responses.
              </p>
            )}
            {open && status !== "pending" && (
              <button
                className="text-button"
                style={{ marginTop: 10 }}
                onClick={() => {
                  setResponseId(responseToken(activeShareId, true));
                  setName("");
                  setStatus("pending");
                }}
              >
                Respond for another person
              </button>
            )}
          </div>

        </div>
        <footer className="guest-footer">
          <Flower2 size={17} />
          <span>InviteFlow</span>
        </footer>

      </article>
    </div>
  );
}
export default function PublicInvitation() {
  const { shareId } = useParams();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!shareId || !/^[a-f0-9]{48}$/.test(shareId)) {
      setError("This invitation link is invalid.");
      setLoading(false);
      return;
    }
    return onSnapshot(
      doc(db, "publicInvitations", shareId),
      (s) => {
        if (!s.exists() || s.data().status !== "active") {
          setError(
            "This invitation is no longer available. Please ask your host for a new link.",
          );
          setData(null);
        } else {
          setData(s.data() as PublicData);
          setError("");
        }
        setLoading(false);
      },
      () => {
        setError(
          "We couldn’t open this invitation. It may have been revoked, archived or removed. Please contact your host.",
        );
        setLoading(false);
      },
    );
  }, [shareId]);
  if (loading)
    return (
      <div className="full-state">
        <Flower2 className="spin" />
        <h2>Something lovely is on its way…</h2>
      </div>
    );
  if (error || !data)
    return (
      <div className="full-state">
        <Flower2 size={45} />
        <h1>An invitation needs a little help.</h1>
        <p>{error}</p>
      </div>
    );
  return <GuestExperience key={shareId} data={data} shareId={shareId} />;
}
export function ownerPreviewData(event: Invitation): PublicData {
  return {
    ownerUid: "",
    invitationId: event.id,
    guestId: "",
    mode: "open",
    guestDisplayName: "",
    guestCountAllowed: 2,
    publishedSnapshot: event,
    status: "active",
  };
}
