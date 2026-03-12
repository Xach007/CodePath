import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

const CODE_FRAGMENTS = [
  { text: "import", color: "#c678dd", x: -120, y: -80 },
  { text: "{ learn }", color: "#e5c07b", x: -20, y: -80 },
  { text: "from", color: "#c678dd", x: 80, y: -80 },
  { text: '"@codepath"', color: "#98c379", x: 180, y: -80 },
  { text: "async", color: "#c678dd", x: -100, y: -40 },
  { text: "function", color: "#c678dd", x: -10, y: -40 },
  { text: "start()", color: "#61afef", x: 110, y: -40 },
  { text: "{", color: "#abb2bf", x: 190, y: -40 },
  { text: "const path", color: "#e06c75", x: -80, y: 0 },
  { text: "= await", color: "#c678dd", x: 30, y: 0 },
  { text: "learn.init()", color: "#61afef", x: 150, y: 0 },
  { text: "return", color: "#c678dd", x: -60, y: 40 },
  { text: "path.begin()", color: "#61afef", x: 60, y: 40 },
  { text: "}", color: "#abb2bf", x: -60, y: 80 },
];

const STATS = [
  { value: "7", label: "Languages" },
  { value: "121", label: "Lessons" },
  { value: "∞", label: "Practice" },
];

type Phase = "void" | "code" | "converge" | "brand" | "stats" | "exit";

function Particles({ count = 40 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.05,
    })),
  [count]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -30, 0],
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#6366f1",
          }}
        />
      ))}
    </div>
  );
}

function GradientOrb({ x, y, size, color, delay }: { x: string; y: string; size: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, delay, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(80px)",
        pointerEvents: "none",
      }}
    />
  );
}

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>("void");
  const completedRef = useRef(false);
  const skipRef = useRef(false);

  const finish = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    skipRef.current = true;
    finish();
  }, [finish]);

  useEffect(() => {
    if (skipRef.current) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => { if (!skipRef.current) setPhase("code"); }, 300));
    timers.push(setTimeout(() => { if (!skipRef.current) setPhase("converge"); }, 1600));
    timers.push(setTimeout(() => { if (!skipRef.current) setPhase("brand"); }, 2400));
    timers.push(setTimeout(() => { if (!skipRef.current) setPhase("stats"); }, 3400));
    timers.push(setTimeout(() => { if (!skipRef.current) setPhase("exit"); }, 4400));
    timers.push(setTimeout(() => { if (!skipRef.current) finish(); }, 5200));

    return () => timers.forEach(clearTimeout);
  }, [finish]);

  const codeVisible = phase !== "void";
  const converging = phase === "converge" || phase === "brand" || phase === "stats" || phase === "exit";
  const brandVisible = phase === "brand" || phase === "stats" || phase === "exit";
  const statsVisible = phase === "stats" || phase === "exit";
  const exiting = phase === "exit";

  return (
    <AnimatePresence>
      {!completedRef.current && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          animate={exiting ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => { if (exiting) finish(); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#000",
            overflow: "hidden",
            cursor: "default",
          }}
        >
          <Particles count={35} />

          <GradientOrb x="15%" y="20%" size="500px" color="rgba(99, 102, 241, 0.07)" delay={0.2} />
          <GradientOrb x="60%" y="55%" size="400px" color="rgba(139, 92, 246, 0.06)" delay={0.5} />
          <GradientOrb x="40%" y="35%" size="300px" color="rgba(59, 130, 246, 0.04)" delay={0.8} />

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ position: "relative", width: "600px", maxWidth: "90vw", height: "200px" }}>
              {CODE_FRAGMENTS.map((frag, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, x: frag.x, y: frag.y + 20, filter: "blur(8px)", scale: 1 }}
                  animate={
                    converging
                      ? { opacity: 0, x: 0, y: 0, scale: 0.3, filter: "blur(12px)" }
                      : codeVisible
                      ? { opacity: 1, x: frag.x, y: frag.y, filter: "blur(0px)", scale: 1 }
                      : {}
                  }
                  transition={{
                    duration: converging ? 0.5 : 0.5,
                    delay: converging ? i * 0.015 : i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', monospace",
                    fontSize: "clamp(11px, 1.4vw, 15px)",
                    color: frag.color,
                    whiteSpace: "nowrap",
                    textShadow: `0 0 20px ${frag.color}40`,
                    letterSpacing: "0.5px",
                  }}
                >
                  {frag.text}
                </motion.span>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <AnimatePresence>
              {brandVisible && (
                <motion.div
                  key="brand-block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0px",
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      width: "clamp(56px, 8vw, 80px)",
                      height: "clamp(56px, 8vw, 80px)",
                      borderRadius: "clamp(14px, 2vw, 22px)",
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 80px rgba(99, 102, 241, 0.4), 0 0 160px rgba(139, 92, 246, 0.15), 0 20px 60px rgba(0,0,0,0.5)",
                      marginBottom: "clamp(16px, 2vw, 28px)",
                    }}
                  >
                    <svg
                      width="clamp(28px, 4vw, 40px)"
                      height="clamp(28px, 4vw, 40px)"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </motion.div>

                  <div style={{ overflow: "hidden" }}>
                    <motion.h1
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                      style={{
                        fontSize: "clamp(36px, 7vw, 72px)",
                        fontWeight: 800,
                        margin: 0,
                        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                        letterSpacing: "-0.04em",
                        lineHeight: 1.1,
                        background: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      CodePath
                    </motion.h1>
                  </div>

                  <div style={{ overflow: "hidden", marginTop: "clamp(4px, 0.5vw, 8px)" }}>
                    <motion.p
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                      style={{
                        fontSize: "clamp(13px, 1.8vw, 18px)",
                        fontWeight: 400,
                        margin: 0,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: "clamp(3px, 0.5vw, 6px)",
                        textTransform: "uppercase",
                      }}
                    >
                      Master the code
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                    style={{
                      width: "clamp(40px, 8vw, 80px)",
                      height: "1px",
                      background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)",
                      marginTop: "clamp(16px, 2vw, 28px)",
                    }}
                  />

                  <AnimatePresence>
                    {statsVisible && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          display: "flex",
                          gap: "clamp(24px, 5vw, 56px)",
                          marginTop: "clamp(20px, 3vw, 40px)",
                        }}
                      >
                        {STATS.map((stat, i) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <StatCounter value={stat.value} delay={i * 0.1} />
                            <span
                              style={{
                                fontSize: "clamp(10px, 1.2vw, 13px)",
                                color: "rgba(255,255,255,0.3)",
                                fontFamily: "'Inter', system-ui, sans-serif",
                                letterSpacing: "1.5px",
                                textTransform: "uppercase",
                                fontWeight: 500,
                              }}
                            >
                              {stat.label}
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={converging ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "1px",
              height: "1px",
              boxShadow: brandVisible
                ? "0 0 200px 100px rgba(99, 102, 241, 0.1)"
                : "0 0 120px 60px rgba(99, 102, 241, 0.15)",
              borderRadius: "50%",
              pointerEvents: "none",
              transition: "box-shadow 0.8s ease",
            }}
          />

          <button
            onClick={handleSkip}
            style={{
              position: "absolute",
              bottom: "clamp(16px, 3vh, 32px)",
              right: "clamp(16px, 3vw, 32px)",
              zIndex: 10001,
              padding: "6px 18px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.25)",
              fontSize: "12px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              fontFamily: "'Inter', system-ui, sans-serif",
              letterSpacing: "0.5px",
              pointerEvents: "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.25)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatCounter({ value, delay }: { value: string; delay: number }) {
  const numericValue = parseInt(value);
  const isNumeric = !isNaN(numericValue);
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => Math.round(v).toString());
  const [displayText, setDisplayText] = useState(isNumeric ? "0" : value);

  useEffect(() => {
    if (!isNumeric) return;
    const controls = animate(motionVal, numericValue, {
      duration: 1,
      delay: delay + 0.2,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = display.on("change", (v) => setDisplayText(v));
    return () => { controls.stop(); unsub(); };
  }, [numericValue, isNumeric, delay, motionVal, display]);

  return (
    <span
      style={{
        fontSize: "clamp(24px, 4vw, 40px)",
        fontWeight: 700,
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        background: "linear-gradient(135deg, #fff, rgba(255,255,255,0.8))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {displayText}
    </span>
  );
}
