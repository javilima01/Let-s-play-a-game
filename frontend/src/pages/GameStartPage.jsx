import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "../css/GameStartPage.module.css";
import { getDescription } from "../services/endpoints";
import GamePage from "./GamePage";

export default function GameStartPage({
  fetchDescription = getDescription,
}) {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [gameId, setGameId] = useState(null);
  const [started, setStarted] = useState(false);

  /* -------------------- fetch description -------------------- */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const gameData = await fetchDescription();
        if (active) {
          setDescription(gameData.description);
          setTitle(gameData.title);
          setGameId(gameData.gameId);
        }
      } catch (err) {
        console.error("Failed to fetch description", err);
      }
    })();
    return () => (active = false);
  }, [fetchDescription]);

  /* -------------------- guard against autostart -------------------- */
  // Ensure we *only* render GamePage after explicit click.
  if (started && gameId) {
    return <GamePage key={gameId} gameId={gameId} />;
  }

  return (
    <div className={styles.root}>
      {/* decorative particles omitted for brevity – same as before */}

      <div className={styles.container}>
        <motion.div className={styles.card} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <motion.h1 className={styles.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
            {title}
          </motion.h1>
          <motion.p className={styles.description} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}>
            {description || "Loading game description..."}
          </motion.p>

          <motion.button
            onClick={() => setStarted(true)}
            className={styles.startButton}
            disabled={!gameId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            START GAME
            <span className={styles.shine} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}