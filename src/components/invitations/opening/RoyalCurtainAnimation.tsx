import { uiText } from "../../../i18n/uiText";
import { motion } from "framer-motion";
import type { OpeningAnimationProps } from "./openingStyles";
export default function RoyalCurtainAnimation({
  title,
  hostName,
  running,
}: OpeningAnimationProps) {
  return (
    <div className="royal-scene" aria-hidden="true">
      <motion.div
        className="royal-spotlight"
        initial={{ opacity: 0 }}
        animate={{ opacity: running ? [0, 0.65, 1] : 0.12 }}
        transition={{ duration: 2.5 }}
      />
      <motion.div
        className="royal-card"
        initial={{ scale: 0.86, opacity: 0.25 }}
        animate={running ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 1.9 }}
      >
        <span>{uiText("ui.8c0443cae24b")}</span>
        <div className="royal-crest">&#9819;</div>
        <h2>{title}</h2>
        <i>{hostName}</i>
        <div className="royal-card-rule" />
      </motion.div>
      {[-1, 1].map((side) => (
        <motion.div
          key={side}
          className={`velvet-panel ${side < 0 ? "curtain-left" : "curtain-right"}`}
          initial={{ x: 0 }}
          animate={
            running ? { x: side < 0 ? "-108%" : "108%", skewY: side * 3 } : {}
          }
          transition={{ delay: 0.8, duration: 2.4, ease: [0.65, 0, 0.2, 1] }}
        >
          <div className="curtain-folds" />
          <motion.div
            className="curtain-shimmer"
            initial={{ x: "-120%", opacity: 0 }}
            animate={running ? { x: "120%", opacity: [0, 0.5, 0] } : {}}
            transition={{ duration: 1.4 }}
          />
          <div className="curtain-fringe" />
        </motion.div>
      ))}
      <div className="royal-valance" />
    </div>
  );
}
