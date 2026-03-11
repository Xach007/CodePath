import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CODE_LINES = [
  `def start_learning():`,
  `    print("Welcome to the future of programming")`,
  ``,
  `for lesson in range(1, 6):`,
  `    print("Loading lesson", lesson)`,
  ``,
  `start_learning()`,
];

const TERMINAL_LINES = [
  "$ python main.py",
  "Welcome to the future of programming",
  "Loading lesson 1",
  "Loading lesson 2",
  "Loading lesson 3",
  "Loading lesson 4",
  "Loading lesson 5",
  "",
  "✓ All lessons loaded successfully",
  "→ Launching CodePath...",
];

const CHAR_DELAY = 28;
const LINE_PAUSE = 180;
const TERMINAL_LINE_DELAY = 220;

type Phase = "editor" | "terminal" | "morph" | "reveal" | "done";

interface Token {
  text: string;
  color: string;
}

const colors = {
  keyword: "#c678dd",
  string: "#98c379",
  function: "#61afef",
  number: "#d19a66",
  builtin: "#e5c07b",
  punctuation: "#abb2bf",
  default: "#abb2bf",
  comment: "#5c6370",
};

function tokenizeLine(line: string): Token[] {
  if (line.trim() === "") return [{ text: " ", color: colors.default }];

  const tokens: Token[] = [];
  let remaining = line;

  const patterns: [RegExp, string][] = [
    [/^(def|for|in|import|from|return|class|if|else|elif|while|try|except|with|as|pass|break|continue|yield|lambda|and|or|not|is|True|False|None)\b/, colors.keyword],
    [/^(print|range|len|str|int|float|list|dict|set|tuple|type|input|open|map|filter|sorted|enumerate|zip)\b/, colors.builtin],
    [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/, colors.string],
    [/^(\d+\.?\d*)/, colors.number],
    [/^(start_learning|load_module)\b/, colors.function],
    [/^([()[\]{},.:=+\-*/<>!])/, colors.punctuation],
    [/^(#.*)$/, colors.comment],
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const [regex, color] of patterns) {
      const match = remaining.match(regex);
      if (match) {
        tokens.push({ text: match[0], color });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const next = remaining.slice(1).search(
        /(?:def|for|in|import|from|return|print|range|start_learning|["'0-9()[\]{},.:=+\-*/<>!#])/
      );
      const end = next === -1 ? remaining.length : next + 1;
      tokens.push({ text: remaining.slice(0, end), color: colors.default });
      remaining = remaining.slice(end);
    }
  }

  return tokens;
}

function TokenizedLine({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: t.color }}>{t.text}</span>
      ))}
    </>
  );
}

function BlinkingCursor({ color = "#528bff" }: { color?: string }) {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.53, repeat: Infinity, repeatType: "reverse" }}
      style={{
        display: "inline-block",
        width: "8px",
        height: "17px",
        backgroundColor: color,
        marginLeft: "2px",
        verticalAlign: "text-bottom",
        borderRadius: "1px",
        boxShadow: `0 0 8px ${color}80`,
      }}
    />
  );
}

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>("editor");
  const [typedChars, setTypedChars] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const completedRef = useRef(false);
  const skipRef = useRef(false);

  const fullText = CODE_LINES.join("\n");
  const totalChars = fullText.length;

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
    if (phase !== "editor" || skipRef.current) return;

    if (typedChars < totalChars) {
      const nextChar = fullText[typedChars];
      const delay = nextChar === "\n" ? LINE_PAUSE : CHAR_DELAY;
      const timer = setTimeout(() => {
        setTypedChars((p) => p + 1);
        if (nextChar === "\n") setCurrentLine((p) => p + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowTerminal(true);
        setPhase("terminal");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, typedChars, totalChars, fullText]);

  useEffect(() => {
    if (phase !== "terminal" || skipRef.current) return;

    const lineIdx = terminalLines.length;
    if (lineIdx < TERMINAL_LINES.length) {
      const delay = lineIdx === 0 ? 500 : TERMINAL_LINE_DELAY;
      const timer = setTimeout(() => {
        setTerminalLines((p) => [...p, TERMINAL_LINES[lineIdx]]);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setPhase("morph"), 800);
      return () => clearTimeout(timer);
    }
  }, [phase, terminalLines]);

  useEffect(() => {
    if (phase !== "morph" || skipRef.current) return;
    const timer = setTimeout(() => setPhase("reveal"), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "reveal" || skipRef.current) return;
    const timer = setTimeout(finish, 1200);
    return () => clearTimeout(timer);
  }, [phase, finish]);

  const visibleText = fullText.slice(0, typedChars);
  const visibleLines = visibleText.split("\n");
  const totalLines = CODE_LINES.length;

  const isMorphingOrRevealing = phase === "morph" || phase === "reveal";

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="intro-root"
          initial={{ opacity: 1 }}
          animate={phase === "reveal" ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => {
            if (phase === "reveal") {
              setPhase("done");
              finish();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 30%, #16213e 60%, #0f0f1a 100%)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "15%",
              left: "10%",
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "15%",
              width: "250px",
              height: "250px",
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(50px)",
              pointerEvents: "none",
            }}
          />

          <button
            onClick={handleSkip}
            style={{
              position: "absolute",
              bottom: "32px",
              right: "32px",
              zIndex: 10001,
              padding: "8px 20px",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.5)",
              fontSize: "13px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s ease",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.8)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
          >
            Skip Intro
          </button>

          <motion.div
            animate={
              isMorphingOrRevealing
                ? { scale: 1.15, opacity: 0, y: -30 }
                : { scale: 1, opacity: 1, y: 0 }
            }
            transition={{
              duration: isMorphingOrRevealing ? 1.2 : 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              width: "min(92vw, 720px)",
              display: "flex",
              flexDirection: "column",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 25px 80px -12px rgba(0, 0, 0, 0.7), 0 0 60px -10px rgba(99, 102, 241, 0.15)",
              position: "relative",
            }}
          >
            <div
              style={{
                background: "linear-gradient(180deg, #2d2d3f 0%, #282a36 100%)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ display: "flex", gap: "7px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56", boxShadow: "0 0 6px #ff5f5640" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e", boxShadow: "0 0 6px #ffbd2e40" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f", boxShadow: "0 0 6px #27c93f40" }} />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  letterSpacing: "0.3px",
                }}
              >
                main.py — CodePath Editor
              </div>
              <div style={{ width: 56 }} />
            </div>

            <div
              style={{
                background: "#1e1e2e",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div
                style={{
                  padding: "20px 0",
                  minHeight: showTerminal ? "200px" : "280px",
                  transition: "min-height 0.5s ease",
                  display: "flex",
                  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', monospace",
                  fontSize: "14px",
                  lineHeight: 1.8,
                }}
              >
                <div
                  style={{
                    width: "50px",
                    textAlign: "right",
                    paddingRight: "16px",
                    userSelect: "none",
                    flexShrink: 0,
                  }}
                >
                  {Array.from({ length: totalLines }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        color: i <= currentLine ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                        fontSize: "13px",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    borderLeft: "1px solid rgba(255,255,255,0.06)",
                    paddingLeft: "16px",
                    paddingRight: "20px",
                    flex: 1,
                    position: "relative",
                  }}
                >
                  {visibleLines.map((line, i) => {
                    const isLastLine = i === visibleLines.length - 1;
                    const showCursor = isLastLine && phase === "editor";
                    const tokens = tokenizeLine(line);

                    return (
                      <div key={i} style={{ position: "relative" }}>
                        {i === currentLine && phase === "editor" && (
                          <div
                            style={{
                              position: "absolute",
                              left: "-16px",
                              right: "-20px",
                              top: 0,
                              bottom: 0,
                              background: "rgba(255,255,255,0.02)",
                              borderLeft: "2px solid rgba(99, 102, 241, 0.5)",
                            }}
                          />
                        )}
                        <span style={{ position: "relative", zIndex: 1 }}>
                          <TokenizedLine tokens={tokens} />
                          {showCursor && <BlinkingCursor />}
                        </span>
                      </div>
                    );
                  })}

                  {phase !== "editor" && typedChars >= totalChars && (
                    <div style={{ marginTop: "4px", opacity: 0.5 }}>
                      <BlinkingCursor color="#27c93f" />
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {showTerminal && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        background: "linear-gradient(180deg, #191927 0%, #1a1a2a 100%)",
                        padding: "16px 20px",
                        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', monospace",
                        fontSize: "13px",
                        lineHeight: 1.8,
                        minHeight: "160px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "12px",
                          paddingBottom: "8px",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <span style={{ color: "#27c93f", fontSize: "11px" }}>●</span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                          Terminal
                        </span>
                      </div>

                      {terminalLines.map((line, i) => {
                        const isCommand = line.startsWith("$");
                        const isSuccess = line.startsWith("✓");
                        const isAction = line.startsWith("→");

                        let textColor = "rgba(255,255,255,0.7)";
                        if (isCommand) textColor = "#61afef";
                        if (isSuccess) textColor = "#27c93f";
                        if (isAction) textColor = "#c678dd";

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{
                              color: textColor,
                              textShadow: (isSuccess || isAction) ? `0 0 10px ${textColor}40` : "none",
                            }}
                          >
                            {line || "\u00A0"}
                          </motion.div>
                        );
                      })}

                      {phase === "terminal" && terminalLines.length < TERMINAL_LINES.length && (
                        <BlinkingCursor color="#27c93f" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {isMorphingOrRevealing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 60px rgba(99, 102, 241, 0.4), 0 0 120px rgba(139, 92, 246, 0.2)",
                  marginBottom: "24px",
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{
                  fontSize: "clamp(28px, 5vw, 48px)",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                CodePath
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "15px",
                  marginTop: "8px",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                Learn to code
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: "120px",
                  height: "2px",
                  background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.6), transparent)",
                  marginTop: "20px",
                  borderRadius: "1px",
                }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
