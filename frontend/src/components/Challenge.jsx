import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {verifyStepPassword} from "@/services/admin";
import styles from "../css/Challenge.module.css";

export default function Challenge({ clue, challengeAction, gameId, stepId, onComplete}) {
  const [password, setPassword] = useState("");
  const handleSubmit = async () => {
    try {
      const { clue } = await verifyStepPassword(gameId, stepId, password);
      onComplete({ correct: true, message: clue })
    } catch (err) {
      console.error(err);
      alert("Password incorrect");
    }
  };


  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      {/* Challenge action title */}
      <h2 className={styles.question}>{challengeAction}</h2>

      {/* Password input section */}
      <div className={styles.inputWrapper}>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.passwordInput}
        />
        <button
          onClick={handleSubmit}
          className={`${styles.optionBtn} ${!password && styles.disabled}`}
          disabled={!password}
        >
          Submit
        </button>
      </div>

    </motion.div>
  );
}