import { uiText } from "../../../i18n/uiText";
import { motion } from "framer-motion";
import type { OpeningAnimationProps } from "./openingStyles";
export default function ClassicEnvelopeAnimation({
  title,
  hostName,
  running,
}: OpeningAnimationProps) {
  return (
    <div className="classic-scene" aria-hidden="true">
      <motion.div
        className="classic-envelope"
        animate={
          running ? { y: [0, 0, 170], opacity: [1, 1, 0] } : { y: [0, -9, 0] }
        }
        transition={
          running
            ? { duration: 3.2, times: [0, 0.72, 1] }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <div className="envelope-back" />
        <motion.div
          className="envelope-letter"
          animate={
            running ? { y: [0, 0, -175, -195], scale: [1, 1, 1, 1.16] } : {}
          }
          transition={{ duration: 2.7, times: [0, 0.36, 0.78, 1] }}
        >
          <span>{uiText("ui.cfe1b4640f0e")}</span>
          <strong>{title}</strong>
          <i>{hostName}</i>
        </motion.div>
        <motion.div
          className="envelope-flap"
          animate={running ? { rotateX: 180, zIndex: 0 } : { rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <div className="envelope-pocket" />
        <motion.div
          className="wax-seal"
          animate={
            running
              ? {
                  scale: [1, 1.16, 0.6],
                  rotate: [0, -12, 18],
                  opacity: [1, 1, 0],
                }
              : {}
          }
          transition={{ duration: 0.55 }}
        >
          <span>{uiText("ui.3f79bb7b435b")}</span>
        </motion.div>
      </motion.div>
      <motion.div
        className="envelope-arrival"
        initial={{ opacity: 0, scale: 0.78 }}
        animate={running ? { opacity: [0, 0, 1], scale: [0.78, 0.78, 1] } : {}}
        transition={{ duration: 3.35, times: [0, 0.78, 1] }}
      >
        <span>{uiText("ui.39245a48b5ab")}</span>
        <h2>{title}</h2>
      </motion.div>
    </div>
  );
}
