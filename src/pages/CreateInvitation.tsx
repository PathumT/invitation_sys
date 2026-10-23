import { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import { useEditorStore } from "../hooks/editorStore";
import { useTemplates } from "../hooks/useTemplates";
import { starterTemplates, categories } from "../services/templateService";
import {
  saveInvitation,
  refreshPublished,
} from "../services/invitationService";
import { tenantDocument } from "../firebase/firestore";
import { CardEditor } from "../components/editor/CardEditor";
import { DesignPreview } from "../components/invitations/DesignPreview";
import { mapsUrl, errorMessage } from "../utils";
import { toast } from "sonner";
import type { Invitation } from "../types";
import { GuestExperience, ownerPreviewData } from "./PublicInvitation";
import { InvitationSharePanel } from "../components/invitations/InvitationSharePanel";
const initial: Invitation = {
  id: "",
  title: "",
  hostName: "",
  eventType: "Wedding",
  message: "We would love for you to join us for a special celebration.",
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
  const [step, setStep] = useState(params.get("step") === "share" ? 3 : id ? 1 : 0);
  const [loaded, setLoaded] = useState(!id);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState("Not saved yet");
  const [loadError, setLoadError] = useState("");
  const lastSaved = useRef("");
  const lock = useRef(false);
  useEffect(() => {
    if (id) {
      getDoc(tenantDocument("invitations", id))
        .then((d) => {
          if (!d.exists()) throw new Error("This invitation no longer exists.");
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
      setEvent({ ...initial, design: t.design, eventType: t.category });
    }
  }, [id, reset, params]);
  useEffect(() => {
    if (id || !params.get("template")) return;
    const t = templates.find((t) => t.id === params.get("template"));
    if (t) {
      reset(t.design);
      setEvent((e) => ({ ...e, design: t.design, eventType: t.category }));
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
    if (lock.current) {
      toast.info("Autosave is finishing. Please try again in a moment.");
      return;
    }
    setBusy(true);
    lock.current = true;
    setSaveState("Saving…");
    try {
      if (!event.title.trim())
        throw new Error("Give your event a title first.");
      if (!event.timezone.trim()) throw new Error("Enter the event timezone.");
      try {
        new Intl.DateTimeFormat("en", { timeZone: event.timezone });
      } catch {
        throw new Error("Use a valid timezone, such as Asia/Colombo.");
      }
      if (
        publish &&
        (!event.eventDate ||
          !event.eventTime ||
          !event.venueName ||
          !event.hostName)
      )
        throw new Error("Add a host, date, time and venue before publishing.");
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
        navigate(`/invitations/${savedId}/edit${publish ? "?step=share" : ""}`, {
          replace: true,
        });
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
        <h1>We couldn’t open this invitation.</h1>
        <p>{loadError}</p>
        <Link to="/invitations" className="button primary">
          Back to invitations
        </Link>
      </div>
    );
  if (!loaded) return <div className="skeleton">Opening your invitation…</div>;
  return (
    <>
      <div className="page-heading">
        <div>
          <Link className="back-link" to="/invitations">
            <ArrowLeft size={14} />
            My invitations
          </Link>
          <h1>{id ? "Make it yours." : "Let’s make an occasion."}</h1>
          <p>
            Thoughtful details. A little creativity. A beautiful invitation.
          </p>
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
            Save draft
          </button>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => save(true)}
          >
            <Send size={16} />
            {busy
              ? "Saving…"
              : event.status === "published"
                ? "Republish"
                : "Publish"}
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
            onClick={() => setStep(i)}
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
            <h2>Find your starting point.</h2>
            <Link className="text-link" to="/templates">
              Browse & upload designs <ArrowRight size={15} />
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
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
          >
            <div className="panel-heading">
              <div>
                <h2>The details make the day.</h2>
                <p>Tell your guests what’s in store.</p>
              </div>
            </div>
            <div className="form-content">
              {design.presentation === "grand-opening" && (
                <div className="template-field-guide">
                  <strong>Grand Opening · Hardware</strong>
                  <p>
                    Event title = your business or store name. Hosted by = your
                    company or organizer. Your message, date, time, venue and
                    address update the card automatically.
                  </p>
                </div>
              )}
              <div className="form-row">
                <label>
                  Event title *
                  <input
                    required
                    value={event.title}
                    onChange={(e) => change("title", e.target.value)}
                    placeholder="A day to remember"
                    maxLength={160}
                  />
                </label>
                <label>
                  Occasion
                  <select
                    value={event.eventType}
                    onChange={(e) => change("eventType", e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Hosted by *
                <input
                  value={event.hostName}
                  onChange={(e) => change("hostName", e.target.value)}
                  placeholder="Your names"
                  required
                  maxLength={160}
                />
              </label>
              <label>
                A message for your guests
                <textarea
                  value={event.message}
                  onChange={(e) => change("message", e.target.value)}
                  maxLength={2000}
                />
              </label>
              <div className="form-row">
                <label>
                  Event date *
                  <input
                    type="date"
                    value={event.eventDate}
                    onChange={(e) => change("eventDate", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Start time *
                  <input
                    type="time"
                    value={event.eventTime}
                    onChange={(e) => change("eventTime", e.target.value)}
                    required
                  />
                </label>
                <label>
                  End time
                  <input
                    type="time"
                    value={event.endTime}
                    onChange={(e) => change("endTime", e.target.value)}
                  />
                </label>
              </div>
              <label>
                Timezone *
                <input
                  value={event.timezone}
                  onChange={(e) => change("timezone", e.target.value)}
                  required
                  placeholder="Asia/Colombo"
                />
              </label>
              <hr />
              <h3>A place to come together</h3>
              <label>
                Venue name *
                <input
                  value={event.venueName}
                  onChange={(e) => change("venueName", e.target.value)}
                  required
                />
              </label>
              <label>
                Venue address
                <input
                  value={event.venueAddress}
                  onChange={(e) => change("venueAddress", e.target.value)}
                />
              </label>
              <label>
                Google Maps link
                <input
                  type="url"
                  value={event.googleMapsUrl}
                  onChange={(e) => change("googleMapsUrl", e.target.value)}
                  placeholder="https://maps.app.goo.gl/…"
                />
              </label>
              <div className="form-row">
                <label>
                  Latitude (optional)
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={event.latitude}
                    onChange={(e) => change("latitude", e.target.value)}
                  />
                </label>
                <label>
                  Longitude (optional)
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={event.longitude}
                    onChange={(e) => change("longitude", e.target.value)}
                  />
                </label>
              </div>
              <label>
                Contact number
                <input
                  type="tel"
                  value={event.contactNumber}
                  onChange={(e) => change("contactNumber", e.target.value)}
                />
              </label>
              <label>
                Additional notes
                <textarea
                  value={event.notes}
                  onChange={(e) => change("notes", e.target.value)}
                  maxLength={2000}
                />
              </label>
              <label>
                Event status
                <select
                  value={event.status}
                  onChange={(e) => change("status", e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option
                    value="published"
                    disabled={event.status !== "published"}
                  >
                    Published
                  </option>
                  <option value="archived">
                    Archived — revoke guest access when saved
                  </option>
                </select>
              </label>
              <button className="button primary" type="submit">
                Customize invitation <ArrowRight size={16} />
              </button>
            </div>
          </form>
          <div className="details-preview">
            <span className="eyebrow">YOUR INVITATION, COMING TO LIFE</span>
            <DesignPreview design={design} event={current} />
            <p>Change a detail. Watch your design follow along.</p>
          </div>
        </div>
      )}
      {step === 2 && <CardEditor event={current} />}{" "}
      {step === 3 && (
        <section className="studio-invitation-preview">
          <div className="preview-publish-bar">
            <div>
              <h2>Your complete invitation</h2>
              <p>
                The design, event details, location and RSVP — all in one card.
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="button primary"
                disabled={busy}
                onClick={() => save(true)}
              >
                <Send size={16} />
                Publish invitation
              </button>
              {event.id && (
                <>
                  <Link
                    className="button outline"
                    to={`/invitations/${event.id}/guests`}
                  >
                    <Users size={16} />
                    Add guests & share
                  </Link>
                  <Link
                    className="button outline"
                    to={`/invitations/${event.id}/preview`}
                  >
                    <Eye size={16} />
                    Open full preview
                  </Link>
                </>
              )}
            </div>
          </div>
          <InvitationSharePanel event={current} />
          <GuestExperience data={ownerPreviewData(current)} preview embedded />
        </section>
      )}
      <div className="wizard-footer">
        <button
          className="button outline"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <ArrowLeft size={16} />
          Previous
        </button>
        <span>Step {step + 1} of 4</span>
        <button
          className="button primary"
          disabled={step === 3}
          onClick={() => setStep(step + 1)}
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
