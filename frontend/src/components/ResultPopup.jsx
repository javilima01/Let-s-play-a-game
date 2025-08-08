import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import styles from "../css/ResultPopup.module.css";
import {verifyStepPassword} from "@/services/admin";

export default function ResultPopup({ open, correct, message, onNext, gameId, stepId }) {
  const { width, height } = useWindowSize();
  const [password, setPassword] = useState("");

  const handleTryAgain = async () => {
    // only called when password is non-empty
    try {
      const { clue } = await verifyStepPassword(gameId, stepId, password, false);
      onNext(password);
      setPassword("");
    } catch (err) {
      console.error(err);
      alert("Password incorrect");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {correct && <Confetti width={width} height={height} />}

          <motion.div
            className={styles.popup}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <h3>{correct ? "🎉 Good job!" : "⏱ Time's up!"}</h3>
            <p>{message}</p>

            {/* only show password input when user needs to Try Again */}
            {!correct && (
              <div className={styles.inputWrapper}>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.passwordInput}
                />
              </div>
            )}

            <button
              className={styles.primaryBtn}
              onClick={correct ? onNext : handleTryAgain}
              disabled={!correct && password === ""}
            >
              {correct ? "Next Question" : "Try Again"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
