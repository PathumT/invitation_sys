import { uiText } from "../i18n/uiText";
import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { useWorkspace } from "../hooks/useWorkspace";
import { tenantDocument } from "../firebase/firestore";
import { publishGuest } from "../services/guestService";
import {
  saveReminderPreference,
  recordReminderPreparation,
} from "../services/reminderService";
import {
  reminderTemplates,
  reminderText,
  manualWhatsApp,
  type ReminderKind,
} from "../utils/reminders";
import { eventInstant } from "../utils/eventTime";
import { errorMessage, shareUrl } from "../utils";
import { toast } from "sonner";
export default function Reminders() {
  const { events, guests, loading, error } = useWorkspace();
  const [eventId, setEventId] = useState("");
  const event = events.find((item) => item.id === eventId);
  const [kind, setKind] = useState<ReminderKind>("rsvp"),
    [template, setTemplate] = useState(reminderTemplates.rsvp),
    [scheduledFor, setScheduledFor] = useState("");
  const [filter, setFilter] = useState("pending"),
    [busy, setBusy] = useState(false),
    [prepared, setPrepared] = useState<{
      text: string;
      whatsapp: string;
      name: string;
    } | null>(null);
  useEffect(() => {
    setPrepared(null);
    setScheduledFor("");
    setKind("rsvp");
    setTemplate(reminderTemplates.rsvp);
    if (!eventId) return;
    return onSnapshot(
      tenantDocument("reminderPreferences", eventId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setKind(data.kind);
          setTemplate(data.template);
          setScheduledFor(data.scheduledFor || "");
        }
      },
      (err) => toast.error(errorMessage(err)),
    );
  }, [eventId]);
  const queue = guests.filter(
    (guest) =>
      guest.invitationId === eventId &&
      guest.source !== "public" &&
      !guest.reminderOptOut &&
      (filter === "all" || guest.rsvpStatus === filter),
  );
  const upcoming = events
    .filter(
      (item) =>
        item.status === "published" &&
        (eventInstant(item.eventDate, item.eventTime, item.timezone) || 0) >
          Date.now(),
    )
    .sort(
      (a, b) =>
        (eventInstant(a.eventDate, a.eventTime, a.timezone) || 0) -
        (eventInstant(b.eventDate, b.eventTime, b.timezone) || 0),
    );
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{uiText("ui.909c41a6b527")}</span>
          <h1>{uiText("nav.reminders")}</h1>
          <p>{uiText("ui.ad63e7fa9fcf")}</p>
        </div>
      </div>
      <section className="panel check-in-panel">
        <h2>{uiText("ui.29a3dfc89a43")}</h2>
        <p className="helper">{uiText("ui.8023d9509f85")}</p>
        <label>
          {uiText("ui.945f83002b2a")}
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          >
            <option value="">{uiText("ui.4349a7b25a72")}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          {uiText("ui.b2aecaeb2490")}
          <select
            value={kind}
            onChange={(event) => {
              const value = event.target.value as ReminderKind;
              setKind(value);
              setTemplate(reminderTemplates[value]);
              setPrepared(null);
            }}
          >
            <option value="invitation">{uiText("ui.998a5a462a97")}</option>
            <option value="rsvp">{uiText("ui.31ca862aa34c")}</option>
            <option value="event">{uiText("ui.94072455223d")}</option>
            <option value="venue">{uiText("ui.7c3dbeb5cae9")}</option>
            <option value="thanks">{uiText("ui.83ae8301a449")}</option>
          </select>
        </label>
        <label>
          {uiText("ui.6e7a3632dc6f")}
          <textarea
            rows={5}
            maxLength={2000}
            value={template}
            onChange={(event) => {
              setTemplate(event.target.value);
              setPrepared(null);
            }}
          />
        </label>
        <p className="helper">
          {uiText("ui.e82904cb0ce0")} {uiText("ui.d4410d72f5dc")}
        </p>
        <label>
          {uiText("ui.6e46e41095f5")}
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
          />
        </label>
        <p className="helper">
          {uiText("ui.57e9825d6d05")}
          {event?.timezone || "choose an event"}.
        </p>
        <button
          className="button primary"
          disabled={busy || !event}
          onClick={() =>
            action(async () => {
              await saveReminderPreference(
                eventId,
                kind,
                template,
                scheduledFor,
                event!.timezone,
              );
              toast.success(uiText("ui.760872b7b20a"));
            })
          }
        >
          {uiText("ui.4b5405013dc6")}
        </button>
      </section>
      <section className="panel check-in-panel">
        <h2>{uiText("ui.43a35f6bda17")}</h2>
        <label>
          {uiText("ui.842c440cc6be")}
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="pending">{uiText("ui.3b3b562d0922")}</option>
            <option value="accepted">{uiText("ui.a00fb0c50741")}</option>
            <option value="declined">{uiText("ui.dce083a2c47f")}</option>
            <option value="maybe">{uiText("ui.da318d11754e")}</option>
            <option value="all">{uiText("ui.a05e0927c985")}</option>
          </select>
        </label>
        <p className="helper">{uiText("ui.02e2af5b4e20")}</p>
        {loading ? (
          <p>{uiText("ui.9c99b81763a8")}</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : !event ? (
          <p>{uiText("ui.c8708694f10f")}</p>
        ) : !queue.length ? (
          <p>{uiText("ui.4af206fee8e3")}</p>
        ) : (
          <ul className="check-in-list">
            {queue.map((guest) => (
              <li key={guest.id}>
                <div>
                  <strong>{guest.name}</strong>
                  <small>{guest.rsvpStatus}</small>
                </div>
                <button
                  className="button outline"
                  disabled={
                    busy || event.status !== "published" || !template.trim()
                  }
                  onClick={() =>
                    action(async () => {
                      const id = await publishGuest(event, guest),
                        message = reminderText(
                          template,
                          event,
                          guest,
                          shareUrl(id, event.hostName),
                        );
                      const whatsapp = manualWhatsApp(
                        guest.phoneNumber,
                        message,
                      );
                      await recordReminderPreparation(event.id, guest.id, kind);
                      setPrepared({
                        text: message,
                        whatsapp,
                        name: guest.name,
                      });
                    })
                  }
                >
                  {uiText("ui.d1c88109df14")}
                  {guest.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {prepared && (
          <div className="prepared-message">
            <h3>
              {uiText("ui.672711b4d666")}
              {prepared.name}
            </h3>
            <label>
              {uiText("ui.4d4407e9e8ae")}
              <textarea rows={6} readOnly value={prepared.text} />
            </label>
            <div className="heading-actions">
              <button
                className="button outline"
                onClick={() =>
                  navigator.clipboard
                    .writeText(prepared.text)
                    .then(() => toast.success(uiText("ui.7bb129eab244")))
                    .catch(() => toast.info(uiText("ui.95d8a7b46908")))
                }
              >
                {uiText("ui.6147ab9beef4")}
              </button>
              <a
                className="button primary"
                href={prepared.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                {uiText("ui.5ac4b2d11037")}
              </a>
            </div>
            <p className="helper">{uiText("ui.b1fa4b5c11a4")}</p>
          </div>
        )}
      </section>
      <section className="panel check-in-panel">
        <h2>{uiText("ui.df9110b56fb1")}</h2>
        {upcoming.length ? (
          <ul>
            {upcoming.map((event) => (
              <li key={event.id}>
                {event.title} - {event.eventDate} {event.eventTime} (
                {event.timezone})
              </li>
            ))}
          </ul>
        ) : (
          <p>{uiText("ui.f5c86679c1ad")}</p>
        )}
      </section>
    </>
  );
}
