import { uiText } from "../../../i18n/uiText";
import { motion } from "framer-motion";
import type { OpeningAnimationProps } from "./openingStyles";
export default function LuxuryGoldenAnimation({
  title,
  hostName,
  running,
}: OpeningAnimationProps) {
  return (
    <div className="golden-scene" aria-hidden="true">
      <svg className="golden-frame" viewBox="0 0 400 480" fill="none">
        <motion.path
          d="M200 12H20V180 M20 300V468H180 M220 468H380V300 M380 180V12H220"
          stroke="currentColor"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: running ? 1 : 0.12 }}
          transition={{ duration: 1.5 }}
        />
        <motion.path
          d="M200 27H35V165 M35 315V453H180 M220 453H365V315 M365 165V27H220"
          stroke="currentColor"
          strokeWidth=".5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: running ? 1 : 0 }}
          transition={{ duration: 1.6, delay: 0.25 }}
        />
        <path
          d="M200 0l10 12-10 12-10-12z M200 456l10 12-10 12-10-12z"
          fill="currentColor"
        />
      </svg>
      {Array.from({ length: 18 }, (_, i) => (
        <motion.span
          key={i}
          className="golden-spark"
          style={{
            left: `${7 + ((i * 29) % 86)}%`,
            top: `${8 + ((i * 17) % 83)}%`,
          }}
          animate={
            running
              ? { y: [20, -28, -65], opacity: [0, 1, 0], scale: [0.2, 1, 0.3] }
              : { opacity: 0.25 }
          }
          transition={{ duration: 2.3, delay: (i % 6) * 0.13 }}
        />
      ))}
      <motion.div
        className="golden-light"
        initial={{ opacity: 0, scale: 0.15 }}
        animate={
          running ? { opacity: [0, 0.9, 0.1], scale: [0.15, 1.5, 2] } : {}
        }
        transition={{ duration: 2.8 }}
      />
      <motion.div
        className="golden-card"
        initial={{ opacity: 0, scale: 0.82, y: 20 }}
        animate={running ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ delay: 1.35, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <span>{uiText("ui.eeca151716fd")}</span>
        <div className="golden-diamond">&#10022;</div>
        <h2>{title}</h2>
        <div className="golden-rule" />
        <i>{hostName}</i>
      </motion.div>
    </div>
  );
}
