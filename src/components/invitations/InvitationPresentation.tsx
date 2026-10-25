import { uiText } from "../../i18n/uiText";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Invitation } from "../../types";
import { eventInstant, countdownParts } from "../../utils/eventTime";
export function InvitationPresentation({
  event,
  children,
}: {
  event: Invitation;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const preset = event.design.animation || "none";
  const [opened, setOpened] = useState(false);
  if (preset === "envelope" && !opened && !reduce)
    return (
      <div className="envelope-reveal">
        <span aria-hidden="true">&#9993;</span>
        <h1>{event.title}</h1>
        <p>{uiText("ui.d6ed82a67709")}</p>
        <button className="button primary" onClick={() => setOpened(true)}>
          {uiText("ui.5aa56ab42916")}
        </button>
      </div>
    );
  if (preset === "none" || reduce) return <>{children}</>;
  return (
    <motion.div
      className={`animated-invitation animation-${preset}`}
      initial={{
        opacity: 0,
        y: preset === "slide" ? 30 : 0,
        scale: preset === "reveal" || preset === "floral" ? 0.96 : 1,
      }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55 }}
    >
      {["confetti", "particles", "floral"].includes(preset) && (
        <div className="invitation-particles" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <span
              key={i}
              style={{ left: `${i * 6.3}%`, animationDelay: `${i * 0.12}s` }}
            >
              {preset === "floral"
                ? "\u2740"
                : preset === "confetti"
                  ? "\u25C6"
                  : "\u2022"}
            </span>
          ))}
        </div>
      )}
      {children}
    </motion.div>
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
