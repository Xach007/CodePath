import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const CODE_SNIPPET = `import { learn } from "@codepath/core";

async function start(user) {
  const path = await learn.init({
    level: user.skill,
  });
  return path.begin();
}`;

const CHAR_DELAY = 15;
const PAUSE_AFTER_TYPING = 400;
const FADE_DURATION = 0.7;

const syntaxColors: Record<string, string> = {
  keyword: "#c678dd",
  string: "#98c379",
  function: "#61afef",
  variable: "#e06c75",
  property: "#e5c07b",
  punctuation: "#abb2bf",
};

function colorizeCode(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    while (remaining.length > 0) {
      let matched = false;

      const patterns: [RegExp, string][] = [
        [/^(import|from|async|function|const|return|await)/, syntaxColors.keyword],
        [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, syntaxColors.string],
        [/^(learn|path|user)(?=\.)/, syntaxColors.variable],
        [/^\.(init|skill|begin)/, syntaxColors.property],
        [/^(start)(?=\()/, syntaxColors.function],
        [/^([{}()[\];,:.=])/, syntaxColors.punctuation],
      ];

      for (const [regex, color] of patterns) {
        const match = remaining.match(regex);
        if (match) {
          tokens.push(
            <span key={`${lineIdx}-${keyIdx++}`} style={{ color }}>
              {match[0]}
            </span>
          );
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        const nextSpecial = remaining.slice(1).search(/(?:import|from|async|function|const|return|await|["'`{}()[\];,:.=])/);
        const plainEnd = nextSpecial === -1 ? remaining.length : nextSpecial + 1;
        tokens.push(
          <span key={`${lineIdx}-${keyIdx++}`} style={{ color: syntaxColors.punctuation }}>
            {remaining.slice(0, plainEnd)}
          </span>
        );
        remaining = remaining.slice(plainEnd);
      }
    }

    return (
      <span key={lineIdx}>
        {tokens}
        {lineIdx < lines.length - 1 ? "\n" : ""}
      </span>
    );
  });
}

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const completedRef = useRef(false);

  const totalLength = CODE_SNIPPET.length;

  useEffect(() => {
    if (displayedLength < totalLength) {
      const timer = setTimeout(() => {
        setDisplayedLength((prev) => prev + 1);
      }, CHAR_DELAY);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setFadingOut(true);
      }, PAUSE_AFTER_TYPING);
      return () => clearTimeout(timer);
    }
  }, [displayedLength, totalLength]);

  useEffect(() => {
    if (!fadingOut) return;
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, FADE_DURATION * 1000 + 50);
    return () => clearTimeout(timer);
  }, [fadingOut, onComplete]);

  const visibleText = CODE_SNIPPET.slice(0, displayedLength);
  const colorized = colorizeCode(visibleText);
  const showCursor = displayedLength < totalLength;

  return (
    <motion.div
      animate={fadingOut ? { opacity: 0, scale: 1.02 } : { opacity: 1, scale: 1 }}
      transition={{ duration: FADE_DURATION, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1e1e2e",
      }}
    >
      <div
        style={{
          width: "min(90vw, 600px)",
          padding: "32px",
          borderRadius: "12px",
          backgroundColor: "#282a36",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "20px",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27c93f" }} />
        </div>
        <pre
          style={{
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            fontSize: "13px",
            lineHeight: 1.7,
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            minHeight: "180px",
          }}
        >
          {colorized}
          {showCursor && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
              style={{
                display: "inline-block",
                width: "8px",
                height: "16px",
                backgroundColor: "#61afef",
                marginLeft: "1px",
                verticalAlign: "text-bottom",
              }}
            />
          )}
        </pre>
      </div>
    </motion.div>
  );
}
