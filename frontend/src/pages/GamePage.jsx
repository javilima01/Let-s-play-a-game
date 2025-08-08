// src/pages/GamePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import Confetti from 'react-confetti';
import styles from "../css/GamePage.module.css";
import { getStep, startGame } from "../services/endpoints";
import Question from "../components/Question";
import QuestionSkeleton from "../components/QuestionSkeleton";
import ResultPopup from "../components/ResultPopup";
import StatsSheet from "../components/StatsSheet";
import Challenge from "../components/Challenge";
import { Button } from '@mui/material';
import { useNavigate } from "react-router-dom";
export default function GamePage({ gameId }) {
  const STORAGE_KEY = `quizduel_${gameId}`;

  // Lazy initialize from localStorage (client-only)
  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return saved.step ?? 0;
  });

  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalSteps, setTotalSteps] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return saved.total ?? null;
  });
  const [correctCount, setCorrectCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return saved.correct ?? 0;
  });

  const [result, setResult] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [finished, setFinished] = useState(false);

  // Fetch total steps on mount
  useEffect(() => {
    if (totalSteps !== null) return;
    let alive = true;
    (async () => {
      try {
        const { total } = await startGame(gameId);
        if (alive) setTotalSteps(total);
      } catch (err) {
        console.error("startGame failed", err);
      }
    })();
    return () => { alive = false; };
  }, [gameId, totalSteps]);

  // Fetch current step data
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

  // Persist progress
  useEffect(() => {
    if (finished) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload = { step, total: totalSteps, correct: correctCount };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [step, totalSteps, correctCount, finished]);

  // Handlers
  const handleQuestionAnswered = ({ correct, message }) => {
    setResult({ correct, message });
  };

  const proceedFromPopup = () => {
    if (result?.correct) {
      setCorrectCount((c) => c + 1);
      setStep((s) => s + 1);
    } else {
      setAttempt((a) => a + 1);
    }
    setResult(null);
  };

  const handleChallengeDone = ({ correct, message }) => {
    setResult({ correct, message });
  };

  // Restart handler
  const restartGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = `/g/${gameId}`;
  };

  // Render
  if (finished) {
    return (
      <div className={styles.finishedWrapper}>
        <Confetti recycle={false} numberOfPieces={500} />
        {/* <h2 className={styles.completed}>Congratulations!!!</h2> */}
        <Button variant="contained" size="large" onClick={restartGame} className={styles.primaryBtn}>
          Restart Game
        </Button>
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
        step={step + 1}
      />

      {/* Stage */}
      <div className={`${styles.stage} ${
        data?.type === "challenge" ? styles.stageWide : ""
      }`}
      >
        {loading && <QuestionSkeleton />}

        {!loading && data?.type === "question" && (
          <Question
            key={`${step}-${attempt}`}
            data={data}
            onAnswered={handleQuestionAnswered}
          />
        )}

        {!loading && data?.type === "challenge" && data && (
          <Challenge
            key={`challenge-${step}`}
            player={data.player}
            opponents={data.opponents}
            clue={data.clue}
            challengeAction={data.challenge_action}
            gameId={gameId}
            onComplete={handleChallengeDone}
            stepId={data?.stepId}
          />
        )}
      </div>

      {/* Result modal */}
      <ResultPopup
        open={Boolean(result)}
        correct={result?.correct}
        message={result?.message}
        onNext={proceedFromPopup}
        gameId={gameId}
        stepId={data?.stepId}
      />
    </div>
  );
}
