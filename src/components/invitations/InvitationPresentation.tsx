import { uiText } from "../../i18n/uiText";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { InvitationOpeningRenderer } from "./opening/InvitationOpeningRenderer";
import { resolveOpeningStyle } from "./opening/openingStyles";
import type { Invitation } from "../../types";
import { eventInstant, countdownParts } from "../../utils/eventTime";
export function InvitationPresentation({
  event,
  children,
  embedded = false,
}: {
  event: Invitation;
  children: ReactNode;
  embedded?: boolean;
}) {
  const style = resolveOpeningStyle(event.design.animation);
  if (!style || embedded) return <>{children}</>;
  return (
    <InvitationOpeningRenderer
      key={`${event.id}-${style}`}
      style={style}
      title={event.title}
      hostName={event.hostName}
    >
      {children}
    </InvitationOpeningRenderer>
  );
}

export function EventCountdown({ event }: { event: Invitation }) {
  const [now, setNow] = useState(Date.now());
  const target = eventInstant(event.eventDate, event.eventTime, event.timezone);
  useEffect(() => {
    if (!event.countdown || target === null || target <= Date.now()) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= target) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [event.countdown, target]);
  if (!event.countdown || target === null) return null;
  const parts = countdownParts(target, now);
  if (parts.ended)
    return (
      <p className="event-countdown-started">{uiText("ui.4a9573bb0885")}</p>
    );
  return (
    <div
      className="event-countdown"
      role="timer"
      aria-label={uiText("ui.35beba64146b")}
    >
      <span>
        {parts.days}
        <small>{uiText("ui.e08c0aa8f558")}</small>
      </span>
      <span>
        {parts.hours}
        <small>{uiText("ui.21e8492938ab")}</small>
      </span>
      <span>
        {parts.minutes}
        <small>{uiText("ui.4f846a84e7fc")}</small>
      </span>
      <span>
        {parts.seconds}
        <small>{uiText("ui.381a8e969905")}</small>
      </span>
    </div>
  );
}
export function InvitationMusic({ event }: { event: Invitation }) {
  const player = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!event.music?.url) return null;
  return (
    <div className="invitation-music">
      <audio
        ref={player}
        src={event.music.url}
        preload="none"
        loop
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
      />
      <button
        className="button outline small"
        onClick={async () => {
          if (!player.current) return;
          player.current.volume = event.music!.volume;
          try {
            if (playing) player.current.pause();
            else await player.current.play();
            setPlaying(!playing);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        {playing ? uiText("ui.28c7e33aa998") : uiText("ui.a8d3be414362")}
      </button>
      <label>
        {uiText("ui.d8773f37c57e")}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          defaultValue={event.music.volume}
          onChange={(e) => {
            if (player.current) player.current.volume = +e.target.value;
          }}
        />
      </label>
      {failed && <small role="status">{uiText("ui.da42f1f41f96")}</small>}
    </div>
  );
}
