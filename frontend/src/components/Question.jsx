import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import styles from "../css/Question.module.css";

export default function Question({ data, onAnswered }) {
  const { question, options, timeLimit, messages } = data;
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedId, setSelectedId] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef();

  /* ——— start countdown ——— */
  useEffect(() => {
    intervalRef.current = setInterval(() => setTimeLeft((t) => t - 100), 100);
    return () => clearInterval(intervalRef.current);
  }, []);

  /* ——— timeout handler ——— */
  useEffect(() => {
    if (!isFinished && timeLeft <= 0) {
      clearInterval(intervalRef.current);
      setIsFinished(true);
      onAnswered({ correct: false, message: messages?.wrong || "Time's up!" });
    }
  }, [timeLeft, isFinished, messages, onAnswered]);

  const pct = Math.max(0, timeLeft) / timeLimit;
  const barColor = pct < 0.15 ? "#ef4444" : pct < 0.33 ? "#f97316" : pct < 0.66 ? "#eab308" : "#22c55e";

  const handleOption = (opt) => {
    if (isFinished) return;
    setSelectedId(opt.id);
    setIsFinished(true);
    clearInterval(intervalRef.current);

    const correct = Boolean(opt.correct);
    onAnswered({
      correct,
      message: correct ? messages?.correct || "Correct!" : messages?.wrong || "Wrong answer!",
    });
  };

  return (
    <motion.div className={styles.card} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h2 className={styles.question}>{question}</h2>

      <div className={styles.timerWrapper}>
        <motion.div
          className={styles.timerBar}
          style={{ backgroundColor: barColor, scaleX: pct }}
          initial={{ originX: 0 }}
          animate={{ scaleX: pct }}
          transition={{ ease: "linear", duration: 0.1 }}
        />
      </div>

      <ul className={styles.optionList}>
        {options.map((opt) => {
          const chosen = selectedId === opt.id;
          const statusClass =
            isFinished && chosen
              ? opt.correct
                ? styles.correct
                : styles.wrong
              : "";

          return (
            <li key={opt.id}>
              <motion.button
                className={`${styles.optionBtn} ${statusClass}`}
                onClick={() => handleOption(opt)}
                disabled={isFinished}
                whileHover={{ scale: isFinished ? 1 : 1.05 }}
                whileTap={{ scale: isFinished ? 1 : 0.95 }}
              >
                {opt.text}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}