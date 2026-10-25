import { uiText } from "../i18n/uiText";
import { occasionMessage } from "../utils/designSuggestions";
import { MiniSiteBuilder } from "../components/invitations/MiniSiteBuilder";
import { RSVPQuestionBuilder } from "../components/invitations/RSVPQuestionBuilder";
import { uploadAudio } from "../services/uploadService";
import { lazy, Suspense, useEffect, useState, useRef } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import { getDoc } from "firebase/firestore";
import {
  Save,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Send,
  Users,
  MapPin,
} from "lucide-react";
import { useEditorStore } from "../hooks/editorStore";
import { useTemplates } from "../hooks/useTemplates";
import { starterTemplates, categories } from "../services/templateService";
import {
  saveInvitation,
  refreshPublished,
} from "../services/invitationService";
import { tenantDocument } from "../firebase/firestore";
import { DesignPreview } from "../components/invitations/DesignPreview";
import { mapsUrl, errorMessage } from "../utils";
import { toast } from "sonner";
import type { Invitation } from "../types";
import { GuestExperience, ownerPreviewData } from "./PublicInvitation";
import { InvitationSharePanel } from "../components/invitations/InvitationSharePanel";
import { validateInvitation } from "../utils/invitationValidation";
const CardEditor = lazy(async () => {
  const module = await import("../components/editor/CardEditor");
  await Promise.allSettled([
    document.fonts.load('16px "Noto Sans Sinhala"', "\u0d85A"),
    document.fonts.load('16px "Noto Sans Tamil"', "\u0b85A"),
  ]);
  return { default: module.CardEditor };
});
const initial: Invitation = {
  id: "",
  title: "",
  hostName: "",
  eventType: "Wedding",
  message: uiText("ui.6174ed94cfe8"),
  eventDate: "",
  eventTime: "",
  endTime: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  venueName: "",
  venueAddress: "",
  googleMapsUrl: "",
  contactNumber: "",
  notes: "",
  latitude: "",
  longitude: "",
  design: starterTemplates[0].design,
  status: "draft",
};
export default function CreateInvitation() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const templates = useTemplates();
  const { design, reset } = useEditorStore();
  const [event, setEvent] = useState<Invitation>({
    ...initial,
    design: structuredClone(initial.design),
  });
  const [step, setStep] = useState(
    params.get("step") === "share" ? 3 : id ? 1 : 0,
  );
  const [loaded, setLoaded] = useState(!id);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState("Not saved yet");
  const [loadError, setLoadError] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [audioRights, setAudioRights] = useState(false);
  const [phonePreview, setPhonePreview] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const validation = validateInvitation(event);
  const errors = showValidation ? validation : {};
  function fieldProps(key: keyof Invitation) {
    return {
      name: key,
      "aria-invalid": !!errors[key],
      "aria-describedby": errors[key] ? `event-error-${key}` : undefined,
    };
  }
  function fieldError(key: keyof Invitation) {
    return errors[key] ? (
      <small className="error" id={`event-error-${key}`}>
        {errors[key]}
      </small>
    ) : null;
  }
  function validateDetails() {
    setShowValidation(true);
    if (!Object.keys(validation).length) return true;
    setStep(1);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>("[aria-invalid='true']")
          ?.focus();
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    );
    return false;
  }
  function goToStep(next: number) {
    if (next > 1 && !validateDetails()) return;
    setStep(next);
  }
  useEffect(() => {
    if (loaded && step > 1 && Object.keys(validation).length) {
      setShowValidation(true);
      setStep(1);
    }
  }, [loaded, step, JSON.stringify(validation)]);
  const lastSaved = useRef("");
  const lock = useRef(false);
  useEffect(() => {
    if (id) {
      getDoc(tenantDocument("invitations", id))
        .then((d) => {
          if (!d.exists()) throw new Error(uiText("ui.65c9eddbab53"));
          const value = { ...d.data(), id: d.id } as Invitation;
          setEvent(value);
          reset(value.design);
          lastSaved.current = JSON.stringify(value);
          setSaveState("Saved");
          setLoaded(true);
        })
        .catch((e) => setLoadError(errorMessage(e)));
    } else {
      const t =
        starterTemplates.find((t) => t.id === params.get("template")) ||
        starterTemplates[0];
      reset(t.design);
      setEvent({
        ...initial,
        design: t.design,
        eventType: categories.includes(params.get("occasion") || "")
          ? params.get("occasion")!
          : t.category,
      });
    }
  }, [id, reset, params]);
  useEffect(() => {
    if (id || !params.get("template")) return;
    const t = templates.find((t) => t.id === params.get("template"));
    if (t) {
      reset(t.design);
      setEvent((e) => ({
        ...e,
        design: t.design,
        eventType: categories.includes(params.get("occasion") || "")
          ? params.get("occasion")!
          : t.category,
      }));
    }
  }, [templates.length, id, params, reset]);
  const current = { ...event, design };
  const serialized = JSON.stringify(current);
  useEffect(() => {
    if (!loaded || !event.id || serialized === lastSaved.current) return;
    setSaveState("Unsaved changes");
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const autosave = async () => {
      if (cancelled) return;
      if (lock.current) {
        retry = setTimeout(autosave, 300);
        return;
      }
      lock.current = true;
      setSaveState("Saving…");
      try {
        const value = JSON.parse(serialized) as Invitation;
        await saveInvitation(value);
        lastSaved.current = serialized;
        setSaveState("Saved · republish to update guest pages");
      } catch {
        setSaveState("Save failed");
      } finally {
        lock.current = false;
      }
    };
    const timer = setTimeout(autosave, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(retry);
    };
  }, [serialized, loaded, event.id]);
  async function save(publish = false) {
    if (publish && !validateDetails()) return;
    if (lock.current) {
      toast.info(uiText("ui.505c6216c79b"));
      return;
    }
    setBusy(true);
    lock.current = true;
    setSaveState("Saving…");
    try {
      if (!event.title.trim()) throw new Error(uiText("ui.b0ab622c4fdb"));
      if (!event.timezone.trim()) throw new Error(uiText("ui.dd1306f61d68"));
      try {
        new Intl.DateTimeFormat("en", { timeZone: event.timezone });
      } catch {
        throw new Error(uiText("ui.614f0ec838c4"));
      }
      if (
        publish &&
        (!event.eventDate ||
          !event.eventTime ||
          !event.venueName ||
          !event.hostName)
      )
        throw new Error(uiText("ui.30cb30e6f098"));
      const value = {
        ...current,
        googleMapsUrl: mapsUrl(
          event.googleMapsUrl,
          event.latitude,
          event.longitude,
          event.venueAddress,
        ),
        status: publish ? ("published" as const) : current.status,
      };
      const savedId = await saveInvitation(value);
      const saved = { ...value, id: savedId };
      if (publish || value.status === "archived") await refreshPublished(saved);
      lastSaved.current = JSON.stringify(saved);
      setEvent(saved);
      setSaveState("Saved");
      toast.success(
        publish
          ? "Published. Guest snapshots are up to date."
          : "Invitation saved.",
      );
      if (publish) setStep(3);
      if (!id)
        navigate(
          `/invitations/${savedId}/edit${publish ? "?step=share" : ""}`,
          {
            replace: true,
          },
        );
    } catch (e) {
      setSaveState("Save failed");
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  function change(key: keyof Invitation, value: string) {
    setEvent((e) => ({ ...e, [key]: value }));
  }
  if (loadError)
    return (
      <div className="empty-state">
        <h1>{uiText("ui.4c298b6be9c2")}</h1>
        <p>{loadError}</p>
        <Link to="/invitations" className="button primary">
          {uiText("ui.25b02faee99a")}
        </Link>
      </div>
    );
  if (!loaded)
    return <div className="skeleton">{uiText("ui.9688f2ce291d")}</div>;
  return (
    <>
      <div className="page-heading">
        <div>
          <Link className="back-link" to="/invitations">
            <ArrowLeft size={14} />
            {uiText("nav.invitations")}
          </Link>
          <h1>{id ? uiText("ui.ddd1f0a0eae4") : uiText("ui.2982c4ca102f")}</h1>
          <p>{uiText("ui.d2407b2d6699")}</p>
        </div>
        <div className="heading-actions">
          <span
            className={`save-state ${saveState.includes("failed") ? "error" : ""}`}
          >
            {saveState.startsWith("Saved") && <Check size={14} />} {saveState}
          </span>
          <button
            className="button outline"
            disabled={busy}
            onClick={() => save()}
          >
            <Save size={16} />
            {uiText("ui.3de100106dd4")}
          </button>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => save(true)}
          >
            <Send size={16} />
            {busy
              ? uiText("ui.23e39291d613")
              : event.status === "published"
                ? uiText("ui.ed09e395484e")
                : uiText("invitation.publish")}
          </button>
        </div>
      </div>
      <div className="wizard-steps">
        {[
          "Choose a design",
          "Event details",
          "Make it yours",
          "Preview & share",
        ].map((s, i) => (
          <button
            className={step === i ? "active" : step > i ? "done" : ""}
            onClick={() => goToStep(i)}
            key={s}
          >
            <span>{step > i ? <Check size={14} /> : i + 1}</span>
            {s}
          </button>
        ))}
      </div>
      {step === 0 && (
        <>
          <div className="section-title">
            <h2>{uiText("ui.7e4dec8864a6")}</h2>
            <Link className="text-link" to="/templates">
              {uiText("ui.fea442801c49")}
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="template-grid">
            {templates.map((t) => (
              <button
                className={`template-card selectable ${JSON.stringify(t.design) === JSON.stringify(design) ? "selected" : ""}`}
                key={t.id}
                onClick={() => {
                  reset(t.design);
                  change("eventType", t.category);
                }}
              >
                <DesignPreview
                  design={t.design}
                  event={{
                    title: event.title || "Your lovely occasion",
                    hostName: event.hostName || "your favorite people",
                    eventDate: event.eventDate || "December 15, 2026",
                    eventTime: event.eventTime || "5:00 PM",
                    venueName: event.venueName || "Somewhere wonderful",
                    message: event.message,
                    venueAddress:
                      event.venueAddress || "A place to come together",
                  }}
                  mini
                />
                <div className="template-info">
                  <div>
                    <h3>{t.name}</h3>
                    <p>{t.category}</p>
                  </div>
                  <span className="selection-dot" />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {step === 1 && (
        <div className="details-layout">
          <form
            className="panel event-form"
            ref={formRef}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              goToStep(2);
            }}
          >
            <div className="panel-heading">
              <div>
                <h2>{uiText("ui.10faeb656c1b")}</h2>
                <p>{uiText("ui.5e33b053cf28")}</p>
              </div>
            </div>
            <div className="form-content">
              {showValidation && Object.keys(errors).length > 0 && (
                <div className="error-banner" role="alert">
                  {uiText("ui.95d151fe8f67")}
                </div>
              )}
              {design.presentation === "grand-opening" && (
                <div className="template-field-guide">
                  <strong>{uiText("ui.03b86e29c7b5")}</strong>
                  <p>{uiText("ui.7623dcdb4510")}</p>
                </div>
              )}
              <div className="form-row">
                <label>
                  {uiText("ui.c225b0e8fef4")}
                  <input
                    {...fieldProps("title")}
                    required
                    value={event.title}
                    onChange={(e) => change("title", e.target.value)}
                    placeholder={uiText("ui.5c387ffb0ba0")}
                    maxLength={160}
                  />
                  {fieldError("title")}
                </label>
                <label>
                  {uiText("ui.f68e0b1ef126")}
                  <select
                    {...fieldProps("eventType")}
                    value={event.eventType}
                    onChange={(e) => change("eventType", e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  {fieldError("eventType")}
                </label>
              </div>
              <label>
                {uiText("ui.0e3067bb863e")}
                <input
                  {...fieldProps("hostName")}
                  value={event.hostName}
                  onChange={(e) => change("hostName", e.target.value)}
                  placeholder={uiText("ui.1a67b5de4c74")}
                  required
                  maxLength={160}
                />
                {fieldError("hostName")}
              </label>
              <label>
                {uiText("ui.b2656efdf939")}
                <textarea
                  {...fieldProps("message")}
                  value={event.message}
                  onChange={(e) => change("message", e.target.value)}
                  maxLength={2000}
                />
                {fieldError("message")}
              </label>
              <button
                type="button"
                className="button outline small"
                onClick={() => change("message", occasionMessage(event))}
              >
                {uiText("ui.5d918a4d7eab")}
              </button>
              <div className="form-row">
                <label>
                  {uiText("ui.b10e79bdcfd7")}
                  <input
                    {...fieldProps("eventDate")}
                    type="date"
                    value={event.eventDate}
                    onChange={(e) => change("eventDate", e.target.value)}
                    required
                  />
                  {fieldError("eventDate")}
                </label>
                <label>
                  {uiText("ui.9753210810cd")}
                  <input
                    {...fieldProps("eventTime")}
                    type="time"
                    value={event.eventTime}
                    onChange={(e) => change("eventTime", e.target.value)}
                    required
                  />
                  {fieldError("eventTime")}
                </label>
                <label>
                  {uiText("ui.2e46006a5eeb")}
                  <input
                    {...fieldProps("endTime")}
                    type="time"
                    value={event.endTime}
                    onChange={(e) => change("endTime", e.target.value)}
                  />
                  {fieldError("endTime")}
                </label>
              </div>
              <label>
                {uiText("ui.109c6d257c45")}
                <input
                  {...fieldProps("timezone")}
                  value={event.timezone}
                  onChange={(e) => change("timezone", e.target.value)}
                  required
                  placeholder={uiText("ui.aa94105757d7")}
                />
                {fieldError("timezone")}
              </label>
              <hr />
              <h3>{uiText("ui.50c5d0cb1800")}</h3>
              <label>
                {uiText("ui.9ba9060f4cfc")}
                <input
                  {...fieldProps("venueName")}
                  value={event.venueName}
                  onChange={(e) => change("venueName", e.target.value)}
                  required
                />
                {fieldError("venueName")}
              </label>
              <label>
                {uiText("ui.91c7abca5902")}
                <input
                  {...fieldProps("venueAddress")}
                  value={event.venueAddress}
                  onChange={(e) => change("venueAddress", e.target.value)}
                />
                {fieldError("venueAddress")}
              </label>
              <div className="maps-link-field">
                <div className="maps-link-heading">
                  <label htmlFor="event-google-maps">
                    {uiText("ui.a6ac8e35ee0c")}
                  </label>
                  <a
                    className="button outline small"
                    href={`https://www.google.com/maps${event.venueName.trim() || event.venueAddress.trim() ? `/search/?api=1&query=${encodeURIComponent([event.venueName.trim(), event.venueAddress.trim()].filter(Boolean).join(", "))}` : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={15} />
                    {uiText("ui.ba48a8678367")}
                  </a>
                </div>
                <input
                  id="event-google-maps"
                  {...fieldProps("googleMapsUrl")}
                  type="url"
                  value={event.googleMapsUrl}
                  onChange={(e) => change("googleMapsUrl", e.target.value)}
                  placeholder={uiText("ui.85a8cd275f8f")}
                  aria-describedby={
                    errors.googleMapsUrl
                      ? "event-error-googleMapsUrl event-google-maps-help"
                      : "event-google-maps-help"
                  }
                />
                {fieldError("googleMapsUrl")}
                <small className="helper" id="event-google-maps-help">
                  {uiText("ui.8f00b41be908")}
                </small>
              </div>
              <div className="form-row">
                <label>
                  {uiText("ui.fa4d92cac6bc")}
                  <input
                    {...fieldProps("latitude")}
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={event.latitude}
                    onChange={(e) => change("latitude", e.target.value)}
                  />
                  {fieldError("latitude")}
                </label>
                <label>
                  {uiText("ui.abea4a36ce57")}
                  <input
                    {...fieldProps("longitude")}
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={event.longitude}
                    onChange={(e) => change("longitude", e.target.value)}
                  />
                  {fieldError("longitude")}
                </label>
              </div>
              <label>
                {uiText("ui.2c6a40482cfb")}
                <input
                  {...fieldProps("contactNumber")}
                  type="tel"
                  value={event.contactNumber}
                  onChange={(e) => change("contactNumber", e.target.value)}
                />
                {fieldError("contactNumber")}
              </label>
              <label>
                {uiText("ui.5871e1abaa63")}
                <textarea
                  {...fieldProps("notes")}
                  value={event.notes}
                  onChange={(e) => change("notes", e.target.value)}
                  maxLength={2000}
                />
                {fieldError("notes")}
              </label>
              <label>
                {uiText("ui.a4a595f68656")}
                <select
                  {...fieldProps("status")}
                  value={event.status}
                  onChange={(e) => change("status", e.target.value)}
                >
                  <option value="draft">{uiText("ui.ebf12ef47cf5")}</option>
                  <option
                    value="published"
                    disabled={event.status !== "published"}
                  >
                    {uiText("ui.2ef42ec21d93")}
                  </option>
                  <option value="archived">{uiText("ui.739bb9ea7b87")}</option>
                </select>
                {fieldError("status")}
              </label>
              <MiniSiteBuilder
                site={event.site}
                eventId={event.id}
                onChange={(site) =>
                  setEvent((current) => ({ ...current, site }))
                }
              />
              {fieldError("site")}
              <RSVPQuestionBuilder
                questions={event.rsvpQuestions}
                onChange={(questions) =>
                  setEvent((current) => ({
                    ...current,
                    rsvpQuestions: questions,
                  }))
                }
              />
              {fieldError("rsvpQuestions")}
              <label>
                <input
                  type="checkbox"
                  checked={event.allowResponseChanges !== false}
                  onChange={(event) =>
                    setEvent((current) => ({
                      ...current,
                      allowResponseChanges: event.target.checked,
                    }))
                  }
                />
                {uiText("ui.820f88fe38c7")}
              </label>
              <label>
                {uiText("ui.b736b1be54b2")}
                <input
                  maxLength={300}
                  value={event.confirmationMessage || ""}
                  onChange={(event) =>
                    change("confirmationMessage", event.target.value)
                  }
                />
              </label>
              <fieldset className="invitation-experience-options">
                <legend>{uiText("ui.ee60422d2ddf")}</legend>
                <label>
                  {uiText("ui.5d5ee1577500")}
                  <select
                    value={design.animation || "none"}
                    onChange={(e) =>
                      reset({
                        ...design,
                        animation: e.target.value as typeof design.animation,
                      })
                    }
                  >
                    {[
                      "none",
                      "envelope",
                      "reveal",
                      "fade",
                      "slide",
                      "confetti",
                      "particles",
                      "floral",
                      "elegant",
                    ].map((mode) => (
                      <option key={mode} value={mode}>
                        {mode === "none" ? uiText("ui.e7cdf3322cf3") : mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={!!event.countdown}
                    onChange={(e) =>
                      setEvent((current) => ({
                        ...current,
                        countdown: e.target.checked,
                      }))
                    }
                  />
                  {uiText("ui.3a9de7b68026")}
                </label>
                <label>
                  {uiText("ui.4319fd07c795")}
                  <input
                    type="datetime-local"
                    {...fieldProps("rsvpDeadline")}
                    value={event.rsvpDeadline || ""}
                    onChange={(e) => change("rsvpDeadline", e.target.value)}
                  />
                  <small>
                    {uiText("ui.57e9825d6d05")}
                    {event.timezone}
                  </small>
                  {fieldError("rsvpDeadline")}
                </label>
                <label>
                  {uiText("ui.aec10bba70e3")}
                  <input
                    value={event.dressCode || ""}
                    maxLength={160}
                    onChange={(e) => change("dressCode", e.target.value)}
                  />
                </label>
                <label>
                  {uiText("ui.58b2eeb7fffa")}
                  <input
                    type="url"
                    {...fieldProps("eventWebsite")}
                    value={event.eventWebsite || ""}
                    onChange={(e) => change("eventWebsite", e.target.value)}
                  />
                  {fieldError("eventWebsite")}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={audioRights}
                    onChange={(e) => setAudioRights(e.target.checked)}
                  />
                  {uiText("ui.a771ed302d6b")}
                </label>
                <label>
                  {uiText("ui.0aa269d4cdc3")}
                  <input
                    type="file"
                    accept="audio/mpeg,audio/ogg,audio/wav"
                    disabled={!event.id || !audioRights || mediaBusy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setMediaBusy(true);
                      try {
                        const url = await uploadAudio(file, event.id);
                        setEvent((current) => ({
                          ...current,
                          music: { url, volume: 0.35 },
                        }));
                        toast.success(uiText("ui.df784050385e"));
                      } catch (error) {
                        toast.error(errorMessage(error));
                      } finally {
                        setMediaBusy(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                {!event.id && (
                  <p className="helper">{uiText("ui.bc478c32fa10")}</p>
                )}
                {event.music && (
                  <>
                    <label>
                      {uiText("ui.418d6afd0c8a")}
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={event.music.volume}
                        onChange={(e) =>
                          setEvent((current) => ({
                            ...current,
                            music: {
                              ...current.music!,
                              volume: +e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="button outline small"
                      onClick={() =>
                        setEvent((current) => {
                          const next = { ...current };
                          delete next.music;
                          return next;
                        })
                      }
                    >
                      {uiText("ui.a2b87442385c")}
                    </button>
                  </>
                )}
              </fieldset>
              <button className="button primary" type="submit">
                {uiText("ui.ee8306184fbe")}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
          <div className="details-preview">
            <span className="eyebrow">{uiText("ui.ce3a01d96f55")}</span>
            <DesignPreview design={design} event={current} />
            <p>{uiText("ui.bd1469c5beb4")}</p>
          </div>
        </div>
      )}
      {step === 2 && (
        <Suspense
          fallback={<div className="skeleton">{uiText("ui.f3454aeb69ef")}</div>}
        >
          <CardEditor event={current} />
        </Suspense>
      )}{" "}
      {step === 3 && (
        <section className="studio-invitation-preview">
          <div className="preview-publish-bar">
            <div>
              <h2>{uiText("ui.be29e3c22ec4")}</h2>
              <p>{uiText("ui.8d68027be042")}</p>
            </div>
            <div className="heading-actions">
              <button
                className="button primary"
                disabled={busy}
                onClick={() => save(true)}
              >
                <Send size={16} />
                {uiText("ui.b25616696efe")}
              </button>
              {event.id && (
                <>
                  <Link
                    className="button outline"
                    to={`/invitations/${event.id}/guests`}
                  >
                    <Users size={16} />
                    {uiText("ui.b0e834ae78ae")}
                  </Link>
                  <Link
                    className="button outline"
                    to={`/invitations/${event.id}/preview`}
                  >
                    <Eye size={16} />
                    {uiText("ui.7723e4dec204")}
                  </Link>
                </>
              )}
            </div>
          </div>
          <InvitationSharePanel event={current} />
          {current.site?.enabled && (
            <div className="heading-actions">
              <button
                className="button outline"
                aria-pressed={!phonePreview}
                onClick={() => setPhonePreview(false)}
              >
                {uiText("ui.144adf27f7f3")}
              </button>
              <button
                className="button outline"
                aria-pressed={phonePreview}
                onClick={() => setPhonePreview(true)}
              >
                {uiText("ui.f4185502ae83")}
              </button>
            </div>
          )}
          <div
            style={{ maxWidth: phonePreview ? 390 : undefined, margin: "auto" }}
          >
            <GuestExperience
              data={ownerPreviewData(current)}
              preview
              embedded
            />
          </div>
        </section>
      )}
      <div className="wizard-footer">
        <button
          className="button outline"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <ArrowLeft size={16} />
          {uiText("ui.a57b08a480b8")}
        </button>
        <span>
          {uiText("ui.474a987f3bbe")}
          {step + 1}
          {uiText("ui.723bb5b47d8f")}
        </span>
        <button
          className="button primary"
          disabled={step === 3}
          onClick={() => goToStep(step + 1)}
        >
          {uiText("ui.31fbef162594")}
          <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
