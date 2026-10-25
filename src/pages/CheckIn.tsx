import { uiText } from "../i18n/uiText";
import { Modal } from "../components/ui/Modal";
import type { Guest } from "../types";
import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { useWorkspace } from "../hooks/useWorkspace";
import {
  manualCheckInGuest,
  checkInGuest,
  checkInInvitation,
} from "../services/checkInService";
import { errorMessage } from "../utils";
export default function CheckIn() {
  const { events, guests, loading, error } = useWorkspace();
  const [override, setOverride] = useState<Guest | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [arrivalCount, setArrivalCount] = useState(1);
  const [eventId, setEventId] = useState("");
  const [search, setSearch] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const cameraRun = useRef(0);
  const cameraPending = useRef(false);
  function stop() {
    cameraRun.current++;
    cameraPending.current = false;
    controls.current?.stop();
    controls.current = null;
    setScanning(false);
  }
  useEffect(
    () => () => {
      cameraRun.current++;
      controls.current?.stop();
    },
    [],
  );
  async function start() {
    if (cameraPending.current) return;
    cameraPending.current = true;
    setFailure("");
    setScanning(true);
    const run = ++cameraRun.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(uiText("ui.02cb61a030e2"));
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (run !== cameraRun.current || !video.current) return;
      const scanner = new BrowserQRCodeReader();
      const camera = await scanner.decodeFromVideoDevice(
        undefined,
        video.current,
        (result, _error, active) => {
          if (result && run === cameraRun.current) {
            setValue(result.getText());
            setMessage("QR code ready. Confirm check-in below.");
            active.stop();
            stop();
          }
        },
      );
      cameraPending.current = false;
      if (run !== cameraRun.current) camera.stop();
      else controls.current = camera;
    } catch (err) {
      if (run === cameraRun.current) {
        stop();
        setFailure(errorMessage(err));
      }
    }
  }
  async function check(
    action: () => ReturnType<typeof checkInGuest>,
    onSuccess?: () => void,
  ) {
    if (busy) return;
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      const result = await action();
      setMessage(
        `${result.name}: ${result.duplicate ? "already checked in" : "checked in successfully"}.`,
      );
      onSuccess?.();
    } catch (err) {
      setFailure(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  const visible = guests.filter(
    (guest) =>
      guest.source !== "public" &&
      (!eventId || guest.invitationId === eventId) &&
      guest.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{uiText("ui.1a99fc81dec7")}</span>
          <h1>{uiText("nav.checkIn")}</h1>
          <p>{uiText("ui.a41d1eef1250")}</p>
        </div>
      </div>
      <section className="panel check-in-panel">
        <h2>{uiText("ui.d8863dd335d8")}</h2>
        <div className="heading-actions">
          <button
            className="button outline"
            disabled={scanning}
            onClick={start}
          >
            {uiText("ui.a69bc55cbe58")}
          </button>
          {scanning && (
            <button className="button outline" onClick={stop}>
              {uiText("ui.c2e8e6cf5611")}
            </button>
          )}
        </div>
        <video
          ref={video}
          hidden={!scanning}
          className="check-in-video"
          muted
          playsInline
          aria-label={uiText("ui.3a0f74040bc7")}
        />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void check(() => checkInInvitation(value));
          }}
        >
          <label>
            {uiText("ui.51558292de9f")}
            <input
              required
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={uiText("ui.c5cc3477fbbe")}
            />
          </label>
          <button className="button primary" disabled={busy || !value.trim()}>
            {uiText("ui.a4fd253dd6e3")}
          </button>
        </form>
        {message && <p role="status">{message}</p>}
        {failure && (
          <p className="error" role="alert">
            {failure}
          </p>
        )}
      </section>
      <section className="panel check-in-panel">
        <h2>{uiText("ui.05e816178a7d")}</h2>
        <div className="upgrade-controls">
          <label>
            {uiText("ui.4e1f49a9c8ae")}
            <select
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
            >
              <option value="">{uiText("ui.20b8487b3804")}</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {uiText("ui.912ea0d26482")}
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <p>{uiText("ui.9c99b81763a8")}</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : visible.length === 0 ? (
          <p>{uiText("ui.fa8d38d012a4")}</p>
        ) : (
          <ul className="check-in-list">
            {visible.map((guest) => (
              <li key={`${guest.invitationId}-${guest.id}`}>
                <div>
                  <strong>{guest.name}</strong>
                  <small>
                    {
                      events.find((event) => event.id === guest.invitationId)
                        ?.title
                    }{" "}
                    - {guest.rsvpStatus}
                    {guest.checkedInAt ? uiText("ui.99c750e77435") : ""}
                  </small>
                </div>
                <button
                  className="button outline"
                  disabled={
                    busy ||
                    !!guest.checkedInAt ||
                    guest.rsvpStatus !== "accepted"
                  }
                  onClick={() =>
                    check(() => checkInGuest(guest.invitationId, guest.id))
                  }
                >
                  {guest.checkedInAt
                    ? uiText("ui.66477affd24a")
                    : uiText("ui.20e82b4d236a")}
                </button>
                {!guest.checkedInAt && (
                  <button
                    className="button outline"
                    aria-label={uiText("ui.6899abdf1320", {
                      value0: String(guest.name),
                    })}
                    disabled={
                      busy ||
                      events.find((event) => event.id === guest.invitationId)
                        ?.status !== "published"
                    }
                    onClick={() => {
                      stop();
                      setOverride(guest);
                      setOverrideReason("");
                      setArrivalCount(1);
                      setFailure("");
                    }}
                  >
                    {uiText("ui.723c2826018e")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {override && (
        <Modal
          title={uiText("ui.33d05aa048df")}
          onClose={() => setOverride(null)}
        >
          <p>
            {uiText("ui.deac50ef2eac")}
            {override.name}
            {uiText("ui.2282297528cc")}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void check(
                () =>
                  manualCheckInGuest(
                    override.invitationId,
                    override.id,
                    overrideReason,
                    arrivalCount,
                  ),
                () => setOverride(null),
              );
            }}
          >
            <label>
              {uiText("ui.8e2e32d28654")}
              <textarea
                required
                maxLength={300}
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
              />
            </label>
            <label>
              {uiText("ui.42f11bf0c318")}
              <input
                type="number"
                min={1}
                max={override.guestCountAllowed}
                required
                value={arrivalCount}
                onChange={(event) => setArrivalCount(+event.target.value)}
              />
            </label>
            {failure && (
              <p role="alert" className="error">
                {failure}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {uiText("ui.70030648aeee")}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
