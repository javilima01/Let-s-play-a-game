// src/pages/GamePage.jsx
import { useState, useEffect, useCallback } from "react";
import styles from "../css/GamePage.module.css";
import { getStep, startGame } from "../services/endpoints";
import Question from "../components/Question";
import QuestionSkeleton from "../components/QuestionSkeleton";
import ResultPopup from "../components/ResultPopup";
import StatsSheet from "../components/StatsSheet";
import Challenge from "../components/Challenge";

export default function GamePage({ gameId }) {
  /* ────────────────────────────────
   *  1.  Rehydrate progress
   * ──────────────────────────────── */
  const STORAGE_KEY = `quizduel_${gameId}`;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  const [step, setStep] = useState(saved.step ?? 0);            // 0-based
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalSteps, setTotalSteps] = useState(saved.total ?? null);
  const [correctCount, setCorrectCount] = useState(saved.correct ?? 0);
  const [result, setResult] = useState(null);                   // {correct,message}
  const [sheetOpen, setSheetOpen] = useState(false);
  const [finished, setFinished] = useState(false);

  /* ────────────────────────────────
   *  2.  Fetch meta → total steps
   * ──────────────────────────────── */
  useEffect(() => {
    if (totalSteps !== null) return;        // already hydrated
    let alive = true;
    (async () => {
      try {
        const { total } = await startGame(gameId); // idempotent
        if (alive) setTotalSteps(total);
      } catch (err) {
        console.error("startGame failed", err);
      }
    })();
    return () => (alive = false);
  }, [gameId, totalSteps]);

  /* ────────────────────────────────
   *  3.  Load current step data
   * ──────────────────────────────── */
  const fetchStep = useCallback(async () => {
    if (totalSteps !== null && step >= totalSteps) {
      setFinished(true);
      return;
    }
    setLoading(true);
    try {
      const res = await getStep(gameId, step);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch step", err);
    } finally {
      setLoading(false);
    }
  }, [gameId, step, totalSteps]);

  useEffect(() => {
    fetchStep();
  }, [step, attempt, fetchStep]);

  /* ────────────────────────────────
   *  4.  Persist progress
   * ──────────────────────────────── */
  useEffect(() => {
    if (finished) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload = { step, total: totalSteps, correct: correctCount };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [step, totalSteps, correctCount, finished, STORAGE_KEY]);

  /* ────────────────────────────────
   *  5.  Handlers
   * ──────────────────────────────── */
  const handleQuestionAnswered = ({ correct, message }) => {
    setResult({ correct, message });
  };

  const proceedFromPopup = () => {
    if (result?.correct) {
      setCorrectCount((c) => c + 1);
      setStep((s) => s + 1);
    } else {
      setAttempt((a) => a + 1); // retry same step
    }
    setResult(null);
  };

  const handleChallengeDone = () => {
    setStep((s) => s + 1);
  };

  /* ────────────────────────────────
   *  6.  Render
   * ──────────────────────────────── */
  if (finished) {
    return (
      <div className={styles.root}>
        <h1 className={styles.completed}>🎉 ¡Juego completado!</h1>
        <p>Respuestas correctas: {correctCount} / {totalSteps}</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* FAB */}
      <button
        className={styles.fab}
        onClick={() => setSheetOpen((o) => !o)}
        aria-label="Game info"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Bottom sheet */}
      <StatsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        correct={correctCount}
        total={totalSteps}
        step={step + 1} /* human-readable */
      />

      {/* Stage */}
      <div className={`${styles.stage} ${
        data?.type === "challenge" ? styles.stageWide : ""
      }`}>
        {loading && <QuestionSkeleton />}

        {!loading && data?.type === "question" && (
          <Question
            key={`${step}-${attempt}`}
            data={data}
            onAnswered={handleQuestionAnswered}
          />
        )}

        {!loading && data?.type === "challenge" && (
          <Challenge
            key={`challenge-${step}`}
            data={data}
            gameId={gameId}
            onComplete={handleChallengeDone}
          />
        )}
      </div>

      {/* Result modal */}
      <ResultPopup
        open={Boolean(result)}
        correct={result?.correct}
        message={result?.message}
        onNext={proceedFromPopup}
      />
    </div>
  );
}
