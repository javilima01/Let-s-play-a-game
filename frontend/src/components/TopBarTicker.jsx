import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRotatingMessages } from "../services/endpoints";

export default function TopBarTicker({
  fetchMessages = getRotatingMessages,
  rotationInterval = 5000,
  animationDuration = 0.8
}) {
  const [messages, setMessages] = useState([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await fetchMessages();
        if (active && Array.isArray(data) && data.length) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    })();

    return () => {
      active = false;
      clearInterval(timerRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    if (!messages.length) return;

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, rotationInterval);

    return () => clearInterval(timerRef.current);
  }, [messages, rotationInterval]);

  if (!messages.length) return null;

  return (
    <header style={styles.header}>
      <div 
        ref={containerRef}
        style={styles.tickerContainer}
      >
        {/* Textured background */}
        <div style={styles.textureBackground}></div>
        
        {/* Animated gradient overlay */}
        <div style={styles.gradientOverlay}></div>
        
        {/* Floating particles */}
        <div style={styles.particlesContainer}>
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              style={{
                ...styles.particle,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                transform: `scale(${0.2 + Math.random() * 0.8})`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
        
        {/* Inner glow effect */}
        <div style={styles.innerGlow}></div>
        
        {/* Gradient edge accents */}
        <div style={styles.leftAccent}></div>
        <div style={styles.rightAccent}></div>
        
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={index}
            initial={{ x: "100%", opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ 
              x: 0, 
              opacity: 1, 
              scale: 1,
              filter: "blur(0px)",
              transition: { 
                type: "spring", 
                damping: 15, 
                stiffness: 200 
              }
            }}
            exit={{ 
              x: "-100%", 
              opacity: 0, 
              scale: 0.95,
              filter: "blur(4px)",
              transition: { 
                duration: animationDuration * 0.7, 
                ease: "easeIn" 
              }
            }}
            style={styles.messageContainer}
          >
            <div style={styles.messageContent}>
              <span style={styles.decorative}>✦</span>
              <span style={styles.messageText}>
                {messages[index]}
              </span>
              <span style={styles.decorative}>✦</span>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Floating reflection dots */}
        <div style={styles.reflectionDot1}></div>
        <div style={styles.reflectionDot2}></div>
      </div>
      
      {/* Deep shadow under the bar */}
      <div style={styles.bottomShadow}></div>
    </header>
  );
}

// CSS-in-JS styles
const styles = {
  header: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 50,
    pointerEvents: 'none'
  },
  tickerContainer: {
    pointerEvents: 'auto',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '56px',
    minHeight: '56px',
    display: 'flex',
    alignItems: 'center',
    background: '#1E90FF',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
    padding: '12px 0',
  },
  textureBackground: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cpattern id='pattern' width='50' height='50' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'%3E%3Crect width='1' height='50' fill='rgba(255,255,255,0.1)'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23pattern)' opacity='0.3'/%3E%3C/svg%3E")`,
    opacity: 0.3
  },
  gradientOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
    opacity: 0.15,
    animation: 'pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  particlesContainer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden'
  },
  particle: {
    position: 'absolute',
    top: 0,
    width: '2px',
    height: '2px',
    backgroundColor: 'white',
    borderRadius: '50%',
    opacity: 0.1,
    animation: 'floatUp 5s infinite ease-in-out'
  },
  innerGlow: {
    position: 'absolute',
    inset: 0,
    boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none'
  },
  messageContainer: {
    width: '100%',
    padding: '0 32px',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  messageContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: '100%',
  },
  messageText: {
    whiteSpace: 'normal',
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.025em',
    color: 'white',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: '100%',
    wordBreak: 'break-word',
    flexShrink: 1,
  },
  decorative: {
    display: 'inline-block',
    color: '#fcd34d',
    animation: 'pulse 2s infinite',
    flexShrink: 0,
  },
  reflectionDot1: {
    position: 'absolute',
    bottom: '4px',
    left: '25%',
    width: '8px',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    animation: 'pulse-slow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  reflectionDot2: {
    position: 'absolute',
    bottom: '8px',
    right: '33%',
    width: '6px',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    animation: 'pulse-slower 7s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  // bottomShadow: {
  //   position: 'absolute',
  //   top: '100%',
  //   left: 0,
  //   right: 0,
  //   height: '16px',
  //   background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent)',
  //   pointerEvents: 'none'
  // }
};

// Add this to your global CSS
const globalStyles = `
@keyframes floatUp {
  0% { transform: translateY(0) scale(0.8); opacity: 0; }
  50% { opacity: 0.15; }
  100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@keyframes pulse-slow {
  0% { opacity: 0.3; }
  50% { opacity: 0.7; }
  100% { opacity: 0.3; }
}

@keyframes pulse-slower {
  0% { opacity: 0.1; }
  50% { opacity: 0.3; }
  100% { opacity: 0.1; }
}
`;

// Inject global styles
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = globalStyles;
  document.head.appendChild(styleTag);
}