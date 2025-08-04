import { motion, AnimatePresence } from "framer-motion";
import styles from "../css/StatsSheet.module.css";

export default function StatsSheet({ open, onClose, correct, total, step }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.sheet}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <div className={styles.dragHandle} onClick={onClose} />
          <h3>Status</h3>
          {total && (
            <>
              <p>
                Question {step}/{total}
              </p>
              <progress value={correct} max={total} />
              <p>
                Correct answers: {correct}/{total}
              </p>
            </>
          )}

          {/* Placeholder area for future widgets */}
          <div className={styles.placeholder}>
            <p>More info coming soon…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}