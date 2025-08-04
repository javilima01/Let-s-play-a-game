import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../css/Challenge.module.css";
import { confirmChallenge, getInfoPlayer } from "../services/endpoints";

export default function Challenge({ data, gameId, onComplete }) {
    /*  data shape (from getStep):
        {
          type: "challenge",
          step: 5,
          player: { id, name, photo },
          opponents: [ { id, name, photo, stats:{ wins, losses, rating } }, … ]
        }
    */
    const { player, opponents, step } = data;

    const [selected, setSelected] = useState(null);    // Opponent object
    const [confirming, setConfirm] = useState(false);   // waiting referee
    const [result, setResult] = useState(null);    // { ok, message }

    /* ——— call referee ——— */
    const startRefereeCheck = async () => {
        setConfirm(true);
        const res = await confirmChallenge(gameId, step, selected.id);
        setResult(res);
        setConfirm(false);

        if (res.ok) {
            // little pause so the player sees the OK
            setTimeout(onComplete, 1200);
        } else {
            // allow a new pick
            setTimeout(() => {
                setSelected(null);
                setResult(null);
            }, 1600);
        }
    };

    /* ——— variants ——— */
    const gridV = {
        hidden: { opacity: 0, y: 40 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: .05 } },
    };
    const cardV = {
        hidden: { opacity: 0, scale: .8 },
        show: { opacity: 1, scale: 1 },
    };

    return (
        <div className={styles.root}>

            {/* 1 ▸ Opponent list */}
            <AnimatePresence>
                {!selected && (
                    <motion.div
                        className={styles.grid}
                        variants={gridV}
                        initial="hidden" animate="show" exit="hidden"
                    >
                        {opponents.map(op => (
                            <motion.button
                                key={op.id}
                                variants={cardV}
                                className={styles.card}
                                onClick={() => setSelected(op)}
                            >
                                <img src={op.photo} alt="" />
                                <span>{op.name}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2 ▸ Stats popup */}
            <AnimatePresence>
                {selected && !confirming && !result && (
                    <OpponentModal
                        key="modal"
                        opponent={selected}
                        onBack={() => setSelected(null)}
                        onChallenge={startRefereeCheck}
                    />
                )}
            </AnimatePresence>

            {/* 3 ▸ VS screen + referee result */}
            <AnimatePresence>
                {(confirming || result) && (
                    <VersusScreen
                        key="vs"
                        player={player}
                        opponent={selected}
                        confirming={confirming}
                        result={result}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------- tiny helpers inside the same file for brevity ---------- */

function OpponentModal({ opponent, onBack, onChallenge }) {
    const [stats, setStats] = useState(null);
    /* fetch RPG stats */
    useEffect(() => {
        let live = true;
        (async () => {
            const res = await getInfoPlayer(opponent.id);
            if (live) setStats(res);
        })();
        return () => (live = false);
    }, [opponent.id]);

    /* tiny animation helpers */
    const float = {
        animate: {
            y: [-4, 4],
            transition: { duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
        },
    };

    const barColor = (val) =>
        `hsl(${Math.round(val * 1.2)}, 70%, 45%)`;

    return (
        <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            {/* Decorative looping background swirl */}
            {/* <img
                src="/assets/falling-triangles.svg"
                alt=""
                aria-hidden
                className={styles.bg}
            /> */}

            {/* Fighter silhouette floats gently */}
            {/* <motion.img
                src="/assets/fighter-silhouette.svg"
                alt=""
                className={styles.fighter}
                initial={{ y: 0, scale: 1, rotate: 0 }}
                animate={{
                    y: [0, -22, 0, -8, 0],            // higher jump → mini‑hop
                    scale: [1, 1.14, 1, 1.05, 1],     // stronger stretch
                    rotate: [0, 0, -8, 0, 0],         // bigger punch twist
                    transition: {
                        duration: 2.3,
                        times: [0, 0.28, 0.56, 0.72, 1],
                        ease: "easeInOut",
                        repeat: Infinity,
                    },
                }}
            /> */}

            {/* Avatar & name overlay */}
            <div className={styles.header}>
                <img src={opponent.photo} alt="" className={styles.avatar} />
                <h2>{opponent.name}</h2>
            </div>

            {/* Stat bars */}
            {!stats && <div className={styles.loaderMini} />}
            {stats && (
                <ul className={styles.stats}>
                    {Object.entries(stats).map(([k, v]) => (
                        <li key={k}>
                            <span className={styles.label}>{k}</span>
                            <div className={styles.barOuter}>
                                <div
                                    className={styles.barInner}
                                    style={{
                                        width: `${v}%`,
                                        backgroundColor: barColor(v),
                                    }}
                                />
                                <span className={styles.value}>{v}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* CTA buttons */}
            <footer>
                <button onClick={onBack} className={styles.back}>
                    Back
                </button>
                <button
                    onClick={onChallenge}
                    className={styles.play}
                    disabled={!stats}
                >
                    Challenge
                </button>
            </footer>
        </motion.div>
    );
}
function VersusScreen({ player, opponent, confirming, result }) {
    /* slide‑in avatars */
    const avatarV = side => ({
        hidden: { x: side === "left" ? "-100%" : "100%", rotate: -15, opacity: 0 },
        show: {
            x: 0, rotate: 0, opacity: 1,
            transition: { type: "spring", stiffness: 140, damping: 12 }
        },
    });

    return (
        <motion.div
            className={styles.vs}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.img
                className={styles.av}
                src={player.photo}
                alt={player.name}
                variants={avatarV("left")}
                initial="hidden" animate="show"
            />
            <span className={styles.vsLabel}>VS</span>
            <motion.img
                className={styles.av}
                src={opponent.photo}
                alt={opponent.name}
                variants={avatarV("right")}
                initial="hidden" animate="show"
            />

            <motion.div
                className={styles.ref}
                initial={{ scale: .8, opacity: 0 }}
                animate={{
                    scale: 1, opacity: 1,
                    transition: { delay: .6 }
                }}
            >
                {confirming && "Referee is checking…"}
                {result && result.message}
            </motion.div>
        </motion.div>
    );
}
