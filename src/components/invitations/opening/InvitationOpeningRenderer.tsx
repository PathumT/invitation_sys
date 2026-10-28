import { uiText } from "../../../i18n/uiText";
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  openingStyles,
  type OpeningStyle,
  type OpeningAnimationProps,
} from "./openingStyles";
import "./opening.css";
const animations = {
  "classic-envelope": lazy(() => import("./ClassicEnvelopeAnimation")),
  "luxury-golden": lazy(() => import("./LuxuryGoldenAnimation")),
  "floral-bloom": lazy(() => import("./FloralBloomAnimation")),
  "royal-curtain": lazy(() => import("./RoyalCurtainAnimation")),
  "modern-minimal": lazy(() => import("./MinimalRevealAnimation")),
};
class OpeningBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function ReadyScene({
  style,
  onReady,
  ...props
}: OpeningAnimationProps & { style: OpeningStyle; onReady: () => void }) {
  useEffect(onReady, [onReady]);
  const Animation = animations[style];
  return <Animation {...props} />;
}
export function InvitationOpeningRenderer({
  style,
  title,
  hostName,
  children,
  preview = false,
  autoPlay = false,
}: {
  style: OpeningStyle;
  title: string;
  hostName?: string;
  children: ReactNode;
  preview?: boolean;
  autoPlay?: boolean;
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "running" | "complete">(
    autoPlay ? "running" : "idle",
  );
  const [ready, setReady] = useState(false);
  const locked = useRef(autoPlay);
  const content = useRef<HTMLDivElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const definition = openingStyles.find((item) => item.key === style)!;
  const complete = useCallback(() => setPhase("complete"), []);
  const onReady = useCallback(() => setReady(true), []);
  const done = phase === "complete" || !!reduced;
  useEffect(() => {
    if (phase !== "running" || !ready || reduced) return;
    const timer = window.setTimeout(complete, definition.duration);
    return () => window.clearTimeout(timer);
  }, [phase, ready, reduced, complete, definition.duration]);
  useEffect(() => {
    if (phase !== "running" || reduced) return;
    const fallback = window.setTimeout(complete, 12000);
    return () => window.clearTimeout(fallback);
  }, [phase, reduced, complete]);
  useEffect(() => {
    if (done || preview) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    startButton.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = before;
    };
  }, [done, preview]);
  useEffect(() => {
    if (phase === "complete") content.current?.focus({ preventScroll: true });
  }, [phase]);
  if (done)
    return (
      <motion.div
        ref={content}
        tabIndex={-1}
        className="opening-content"
        initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        {children}
      </motion.div>
    );
  return (
    <section
      className={`invitation-opening opening-${style} ${preview ? "opening-preview" : "opening-public"}`}
      aria-label={uiText("ui.a6951e289896", {
        value0: String(definition.name),
      })}
      data-phase={phase}
    >
      <OpeningBoundary onFailure={complete}>
        <Suspense
          fallback={
            <div className="opening-loading" role="status">
              {uiText("ui.3bc88da65178")}
            </div>
          }
        >
          <ReadyScene
            style={style}
            title={title}
            hostName={hostName}
            running={phase === "running" && ready}
            onReady={onReady}
          />
        </Suspense>
      </OpeningBoundary>
      <div className="opening-controls">
        <p className="opening-kicker">{uiText("ui.3e3d2fa22c49")}</p>
        <h1>{title || "A special celebration"}</h1>
        {phase === "idle" ? (
          <>
            <p>{definition.description}</p>
            <button
              ref={startButton}
              type="button"
              className="opening-start"
              disabled={!ready}
              onClick={() => {
                if (locked.current) return;
                locked.current = true;
                setPhase("running");
              }}
              aria-label={uiText("ui.1648332824af")}
            >
              {definition.action}
              <span aria-hidden="true"> &#8594;</span>
            </button>
          </>
        ) : (
          <p role="status" aria-live="polite">
            {uiText("ui.c10f12735084")}
          </p>
        )}
        <button type="button" className="opening-skip" onClick={complete}>
          {uiText("ui.944211b3200c")}
        </button>
      </div>
    </section>
  );
}
