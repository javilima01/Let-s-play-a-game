import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "../css/GameStartPage.module.css";
import { getDescription } from "../services/endpoints";
import GamePage from "./GamePage";

export default function GameStartPage() {
  const { gameId: urlGameId } = useParams();   // ✅ read from /g/:gameId
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gameId, setGameId] = useState(urlGameId || null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── 1.  Fetch per-game banner if URL already has an ID ──────────────
  useEffect(() => {
    if (!urlGameId) return;
    let alive = true;
    (async () => {
      try {
        const data = await getDescription(urlGameId);
        if (!alive) return;
        setTitle(data.title);
        setDescription(data.description);
      } catch (e) {
        console.error("Invalid gameId in URL", e);
        // optional: redirect to "/" or show 404 splash
      }
    })();
    return () => (alive = false);
  }, [urlGameId]);

  // ── 2.  Start / continue button ─────────────────────────────────────
  const handleStart = async () => {
    if (gameId) {                 // a) QR / reload case → just continue
      setStarted(true);
      return;
    }

    setError("Necesitas un enlace de juego. Pide a un organizador.");
    return;
  };

  // ── 3.  After click, render <GamePage> ──────────────────────────────
  if (started && gameId) {
    return <GamePage key={gameId} gameId={gameId} />;
  }

  // ── UI (unchanged apart from button handler) ────────────────────────
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <motion.div /* … animations as before … */ className={styles.card}>
          <motion.h1 className={styles.title}>{title}</motion.h1>
          <motion.p className={styles.description}>
            {description || "Loading game description…"}
          </motion.p>

          <motion.button
            onClick={handleStart}
            className={styles.startButton}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? "STARTING…" : gameId ? "CONTINUE" : "START GAME"}
            <span className={styles.shine} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
