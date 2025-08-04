import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import styles from "../css/ResultPopup.module.css";

export default function ResultPopup({ open, correct, message, onNext }) {
  const { width, height } = useWindowSize();

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {correct && <Confetti width={width} height={height} />}
          <motion.div className={styles.popup} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
            <h3>{correct ? "🎉 Good job!" : "⏱ Time's up!"}</h3>
            <p>{message}</p>
            <button className={styles.primaryBtn} onClick={onNext}>
              {correct ? "Next Question" : "Try Again"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
