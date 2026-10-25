import { uiText } from "../i18n/uiText";
import { formatCalendarDate, formatClockTime } from "../i18n/format";
import { useTranslation } from "react-i18next";
import { EventMiniSite } from "../components/invitations/EventMiniSite";
import { RSVPFields } from "../components/invitations/RSVPFields";
import { answerErrors } from "../utils/rsvpQuestions";
import type { RSVPAnswers } from "../types";
import { deadlineInstant } from "../utils/publishedSnapshot";
import {
  InvitationPresentation,
  EventCountdown,
  InvitationMusic,
} from "../components/invitations/InvitationPresentation";
import { Brand } from "../components/Brand";
import { useEffect, useState, type CSSProperties } from "react";
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
import { mapsUrl, errorMessage, interpolate } from "../utils";
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
  const { t } = useTranslation();
  const e = data.publishedSnapshot;
  const deadline = deadlineInstant(e);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (deadline === null || !Number.isFinite(deadline)) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  const deadlinePassed =
    deadline !== null && (!Number.isFinite(deadline) || now > deadline);
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
      (!el.text.includes("{{") ||
        ![
          "title",
          "host",
          "date",
          "time",
          "venue",
          "address",
          "guest",
        ].includes(el.id)) &&
      !["eyebrow", "intro", "closing", "date-label", "opening-word"].includes(
        el.id,
      ),
  );
  const dayLabel = formatCalendarDate(e.eventDate, true);
  const timeLabel = formatClockTime;
  const [name, setName] = useState(data.guestDisplayName);
  const [answers, setAnswers] = useState<RSVPAnswers>({});
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>(
    {},
  );
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
          setAnswers(r.data().answers || {});
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
    if (deadlinePassed) {
      toast.error(uiText("rsvp.closed"));
      return;
    }
    if (!name.trim() || name.trim().length > 160) {
      setNameError(uiText("ui.a7b3b8ed3836"));
      return;
    }
    if (status !== "pending" && e.allowResponseChanges === false) return;
    const issues = answerErrors(e.rsvpQuestions, answers, s === "accepted");
    setQuestionErrors(issues);
    if (Object.keys(issues).length) return;
    setNameError("");
    setBusy(true);
    try {
      const target = preview ? await ensurePublicLink(e) : shareId;
      const key =
        preview && responseId === "current"
          ? responseToken(target)
          : responseId;
      await respond(target, s, name, key, answers);
      setActiveShareId(target);
      setResponseId(key);
      setStatus(s);
      toast.success(
        e.confirmationMessage || "Thank you. Your response has been saved.",
      );
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  const rsvp = (
    <div className="rsvp-section">
      <h2>{t("rsvp.heading")}</h2>
      {deadlinePassed && <p role="status">{t("rsvp.closed")}</p>}
      {status !== "pending" && (
        <div role="status" className="response-confirmation">
          <Check size={16} />
          {uiText("ui.180b0a7bd92f")}
          {status}.{" "}
          {e.allowResponseChanges === false
            ? uiText("ui.744ecc29ef3c")
            : uiText("ui.21bf31a235da")}
        </div>
      )}
      {responseError && (
        <p className="error">
          {uiText("ui.56af5fc2531a")}
          {responseError}
        </p>
      )}
      <label>
        {t("rsvp.name")}
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
      <RSVPFields
        questions={e.rsvpQuestions}
        answers={answers}
        errors={questionErrors}
        disabled={
          busy ||
          deadlinePassed ||
          (status !== "pending" && e.allowResponseChanges === false)
        }
        onChange={setAnswers}
      />
      <div className="compact-rsvp-actions">
        <button
          className="button primary full"
          disabled={
            busy ||
            (status !== "pending" && e.allowResponseChanges === false) ||
            deadlinePassed ||
            (preview && e.status !== "published")
          }
          onClick={() => submit("accepted")}
        >
          <Heart size={16} />
          {busy ? uiText("ui.23e39291d613") : t("rsvp.accept")}
        </button>
        <button
          className="button outline"
          disabled={
            busy ||
            (status !== "pending" && e.allowResponseChanges === false) ||
            deadlinePassed ||
            (preview && e.status !== "published")
          }
          onClick={() => submit("declined")}
        >
          {t("rsvp.decline")}
        </button>
      </div>
      <small>{uiText("ui.c49a77c43418")}</small>
      {preview && e.status !== "published" && (
        <p className="helper">{uiText("ui.f4701b4c5b92")}</p>
      )}
      {open && status !== "pending" && (
        <button
          className="text-button"
          style={{ marginTop: 10 }}
          onClick={() => {
            setResponseId(responseToken(activeShareId, true));
            setName("");
            setAnswers({});
            setQuestionErrors({});
            setStatus("pending");
          }}
        >
          {uiText("ui.a49a3e4ff70d")}
        </button>
      )}
    </div>
  );
  if (e.site?.enabled)
    return (
      <div className="guest-page mini-site-page">
        {preview && !embedded && (
          <Link to={`/invitations/${e.id}/edit`}>
            {uiText("ui.dde9b4683a75")}
          </Link>
        )}
        <InvitationPresentation event={e}>
          <EventMiniSite event={e} rsvp={rsvp} />
        </InvitationPresentation>
      </div>
    );
  return (
    <div
      className={`guest-page unified-invitation ${grandOpening ? "grand-opening-invitation" : ""}`}
      style={invitationTheme(e.design) as CSSProperties}
    >
      {preview && !embedded && (
        <div className="preview-notice">
          {uiText("ui.b16e88de0aa6")}{" "}
          <Link to={`/invitations/${e.id}/edit`}>
            {uiText("ui.dde9b4683a75")}
          </Link>
        </div>
      )}
      <InvitationPresentation event={e}>
        <article
          className="invitation-sheet"
          aria-label={uiText("ui.a8dd6a7adcfd", {
            value0: String(e.title || "Your event"),
          })}
        >
          {(customArtwork || grandOpening) && (
            <div
              className="invitation-artwork-first"
              aria-label={uiText("ui.3827fd19fcb9")}
            >
              <DesignPreview
                design={e.design}
                event={e}
                guest={data.guestDisplayName}
              />
            </div>
          )}
          {!(customArtwork || grandOpening) && (
            <header className="compact-card-header">
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
                {e.eventType || "A special occasion"}
                {uiText("ui.7dcbea837b63")}
              </span>
              {grandOpening && (
                <div
                  className="opening-headline"
                  aria-label={uiText("ui.94ffac13278f")}
                >
                  <span>{uiText("ui.4321bb63c0d1")}</span>
                  <span>{uiText("ui.3f65664dc577")}</span>
                </div>
              )}
              <h1>{e.title || "A special celebration"}</h1>
              {e.hostName && (
                <p className="compact-host">
                  {uiText("ui.d04444a24aef")}
                  <strong>{e.hostName}</strong>
                </p>
              )}
              <h2 className="compact-guest">
                {data.guestDisplayName
                  ? uiText("ui.9431b4421b09", {
                      value0: String(data.guestDisplayName),
                    })
                  : uiText("ui.7527077cb347")}
              </h2>
              {customText.map((el) => (
                <p className="compact-custom-text" key={el.id}>
                  {interpolate(el.text || "", e, data.guestDisplayName)}
                </p>
              ))}
            </header>
          )}
          <div className="guest-content">
            <EventCountdown event={e} />
            <InvitationMusic event={e} />
            {!(customArtwork || grandOpening) && (
              <>
                <p className="guest-message">{e.message}</p>
                <div className="guest-details">
                  <div>
                    <CalendarDays />
                    <p>
                      <small>{uiText("ui.25f6dd852c2c")}</small>
                      <strong>{dayLabel || "Date to be confirmed"}</strong>
                    </p>
                  </div>
                  <div>
                    <Clock />
                    <p>
                      <small>{uiText("ui.47859b095a11")}</small>
                      <strong>
                        {timeLabel(e.eventTime)}
                        {e.endTime
                          ? uiText("ui.e0631ad696a8", {
                              value0: String(timeLabel(e.endTime)),
                            })
                          : ""}
                      </strong>
                      <span>{e.timezone}</span>
                    </p>
                  </div>
                  <div>
                    <MapPin />
                    <p>
                      <small>{uiText("ui.49754f6ee80c")}</small>
                      <strong>{e.venueName}</strong>
                      <span>{e.venueAddress}</span>
                    </p>
                  </div>
                </div>
              </>
            )}
            {location ? (
              <a
                className="button outline full"
                href={location}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={16} />
                {uiText("ui.aa64a202ce1d")}
              </a>
            ) : (
              <p className="helper">{uiText("ui.e9b1856058e1")}</p>
            )}
            {e.dressCode && (
              <p>
                <strong>{uiText("ui.49a631aea3c8")}</strong> {e.dressCode}
              </p>
            )}
            {e.eventWebsite?.startsWith("https://") && (
              <a
                className="button outline"
                href={e.eventWebsite}
                target="_blank"
                rel="noopener noreferrer"
              >
                {uiText("ui.58b2eeb7fffa")}
              </a>
            )}
            {e.notes && (
              <details className="compact-extra">
                <summary>{uiText("ui.d1d73014ee7d")}</summary>
                <p className="guest-notes">{e.notes}</p>
              </details>
            )}
            {e.contactNumber && (
              <a
                className="compact-contact"
                href={`tel:${e.contactNumber.replace(/[^+\d]/g, "")}`}
              >
                {uiText("ui.78ba2a6d9b97")}
                {e.contactNumber}
              </a>
            )}
            {rsvp}
          </div>
          <footer className="guest-footer">
            <Brand compact />
          </footer>
        </article>
      </InvitationPresentation>
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
      setError(uiText("ui.7e869557e2a2"));
      setLoading(false);
      return;
    }
    return onSnapshot(
      doc(db, "publicInvitations", shareId),
      (s) => {
        if (!s.exists() || s.data().status !== "active") {
          setError(uiText("ui.c8a5f20a78f9"));
          setData(null);
        } else {
          setData(s.data() as PublicData);
          setError("");
        }
        setLoading(false);
      },
      () => {
        setError(uiText("ui.6ffacac95f03"));
        setLoading(false);
      },
    );
  }, [shareId]);
  if (loading)
    return (
      <div className="full-state">
        <Flower2 className="spin" />
        <h2>{uiText("ui.a338c3447dff")}</h2>
      </div>
    );
  if (error || !data)
    return (
      <div className="full-state">
        <Flower2 size={45} />
        <h1>{uiText("ui.0026c1ff7f41")}</h1>
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
