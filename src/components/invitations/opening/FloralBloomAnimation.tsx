import { uiText } from "../../../i18n/uiText";
import { motion } from "framer-motion";
import type { OpeningAnimationProps } from "./openingStyles";
function Branch({ running, corner }: { running: boolean; corner: number }) {
  return (
    <svg
      className={`floral-branch corner-${corner}`}
      viewBox="0 0 220 240"
      fill="none"
    >
      <motion.path
        d="M0 0C18 74 55 64 60 120S140 136 160 222 M20 55Q78 25 100 55 M60 120Q12 145 26 177 M95 155Q149 105 184 140"
        stroke="#708765"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: running ? 1 : 0.08 }}
        transition={{ duration: 1.6, delay: corner * 0.12 }}
      />
      {[
        { x: 28, y: 50, r: 20 },
        { x: 72, y: 130, r: -30 },
        { x: 119, y: 157, r: 25 },
      ].map((leaf, i) => (
        <g
          key={i}
          transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r})`}
        >
          <motion.path
            d="M0 0Q-24-32 0-47Q24-32 0 0"
            fill="#a3b590"
            initial={{ scale: 0 }}
            animate={{ scale: running ? 1 : 0 }}
            transition={{ delay: 0.5 + i * 0.2 + corner * 0.1, duration: 0.6 }}
          />
        </g>
      ))}
      {[
        { x: 100, y: 55 },
        { x: 26, y: 177 },
        { x: 184, y: 140 },
      ].map((flower, i) => (
        <g key={i} transform={`translate(${flower.x} ${flower.y})`}>
          <motion.g
            initial={{ scale: 0, rotate: -65 }}
            animate={{ scale: running ? 1 : 0, rotate: running ? 0 : -65 }}
            transition={{
              delay: 1 + i * 0.24 + corner * 0.13,
              type: "spring",
              stiffness: 95,
              damping: 12,
            }}
          >
            {Array.from({ length: 6 }, (_, petal) => (
              <g key={petal} transform={`rotate(${petal * 60})`}>
                <motion.ellipse
                  cx="0"
                  cy="-12"
                  rx="8"
                  ry="15"
                  fill={i % 2 ? "#ecd2ce" : "#fff8f0"}
                  stroke="#dcb8ab"
                  strokeWidth=".5"
                  initial={{ scaleY: 0.1 }}
                  animate={{ scaleY: running ? 1 : 0.1 }}
                  transition={{
                    delay: 1.1 + i * 0.2 + corner * 0.12 + petal * 0.035,
                    duration: 0.6,
                  }}
                />
              </g>
            ))}
            <circle r="5" fill="#c7a661" />
          </motion.g>
        </g>
      ))}
    </svg>
  );
}
export default function FloralBloomAnimation({
  title,
  hostName,
  running,
}: OpeningAnimationProps) {
  return (
    <div className="floral-scene" aria-hidden="true">
      {[0, 1, 2, 3].map((corner) => (
        <Branch key={corner} corner={corner} running={running} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.span
          className="drifting-petal"
          key={i}
          style={{
            left: `${15 + ((i * 19) % 72)}%`,
            top: `${12 + ((i * 23) % 65)}%`,
          }}
          initial={{ opacity: 0 }}
          animate={
            running
              ? {
                  x: [0, (i % 2 ? 1 : -1) * (90 + i * 8)],
                  y: [-25, 40, 100],
                  rotate: [0, 140],
                  opacity: [0, 0.9, 0],
                }
              : {}
          }
          transition={{ duration: 3.5, delay: (i % 4) * 0.12 }}
        />
      ))}
      <motion.div
        className="floral-card"
        initial={{ opacity: 0, scale: 0.72, y: 34 }}
        animate={running ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ delay: 2, type: "spring", stiffness: 90, damping: 15 }}
      >
        <span>{uiText("ui.c230dcfd2f34")}</span>
        <h2>{title}</h2>
        <i>{hostName}</i>
        <div className="floral-card-rule" />
      </motion.div>
    </div>
  );
}
