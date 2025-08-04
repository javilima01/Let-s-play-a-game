import { useState, useEffect, useCallback } from "react";
import styles from "../css/GamePage.module.css";
import { getStep, startGame } from "../services/endpoints";
import Question from "../components/Question";
import QuestionSkeleton from "../components/QuestionSkeleton";
import ResultPopup from "../components/ResultPopup";
import StatsSheet from "../components/StatsSheet";
import Challenge from "../components/Challenge";

export default function GamePage({ gameId }) {
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalSteps, setTotalSteps] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState(null); // { correct:boolean, message:string }
  const [sheetOpen, setSheetOpen] = useState(false);

  /* —— fetch total questions —— */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { total } = await startGame(gameId);
        if (active) setTotalSteps(total);
      } catch (err) {
        console.error("startGame failed", err);
        if (active) setTotalSteps(25);
      }
    })();
    return () => (active = false);
  }, [gameId]);

  /* —— load current step —— */
  const fetchStep = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStep(gameId, step);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch step", err);
    } finally {
      setLoading(false);
    }
  }, [gameId, step]);

  useEffect(() => {
    fetchStep();
  }, [step, attempt, fetchStep]);

  /* —— handlers —— */
  const handleQuestionAnswered = ({ correct, message }) => {
    setResult({ correct, message });
  };

  const proceedFromPopup = () => {
    if (result?.correct) {
      setCorrectCount((c) => c + 1);
      setStep((s) => s + 1);
    } else {
      setAttempt((a) => a + 1); // retry current step
    }
    setResult(null);
  };

  return (
    <div className={styles.root}>
      {/* floating action button */}
      <button
        className={styles.fab}
        onClick={() => setSheetOpen((o) => !o)}
        aria-label="Game info"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* stats bottom‑sheet */}
      <StatsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        correct={correctCount}
        total={totalSteps}
        step={step + 1}
      />

      {/* game stage */}
      <div
        className={`${styles.stage} ${data?.type === "challenge" ? styles.stageWide : ""}`}>
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
            onComplete={() => setStep(s => s + 1)}
          />
        )}
      </div>

      {/* result modal */}
      <ResultPopup
        open={Boolean(result)}
        correct={result?.correct}
        message={result?.message}
        onNext={proceedFromPopup}
      />
    </div>
  );
}
