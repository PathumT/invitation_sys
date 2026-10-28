import { uiText } from "../../../i18n/uiText";
import { motion } from "framer-motion";
import type { OpeningAnimationProps } from "./openingStyles";
export default function MinimalRevealAnimation({
  title,
  hostName,
  running,
}: OpeningAnimationProps) {
  const letters = Array.from(title).slice(0, 100);
  const words = letters.join("").split(/(\s+)/);
  return (
    <div className="minimal-scene" aria-hidden="true">
      <motion.div
        className="minimal-line"
        initial={{ scaleX: 0.04, opacity: 0 }}
        animate={{ scaleX: running ? 1 : 0.12, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="minimal-card"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
        animate={running ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
        transition={{ delay: 0.45, duration: 1.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="minimal-eyebrow">{uiText("ui.ccdac2271a61")}</span>
        <h2>
          {words.map((word, wordIndex) =>
            /^\s+$/.test(word) ? (
              word
            ) : (
              <span className="minimal-word" key={wordIndex}>
                {Array.from(word).map((letter, index) => (
                  <motion.span
                    key={index}
                    className="minimal-letter"
                    initial={{ opacity: 0, y: 12 }}
                    animate={running ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      delay:
                        0.55 +
                        (Array.from(words.slice(0, wordIndex).join("")).length +
                          index) *
                          (0.75 / Math.max(letters.length, 1)),
                      duration: 0.55,
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ),
          )}
        </h2>
        <motion.i
          initial={{ opacity: 0 }}
          animate={{ opacity: running ? 1 : 0 }}
          transition={{ delay: 1.45, duration: 0.5 }}
        >
          {hostName}
        </motion.i>
      </motion.div>
    </div>
  );
}
