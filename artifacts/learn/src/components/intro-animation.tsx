import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FileData {
  name: string;
  icon: string;
  iconColor: string;
  lines: string[];
}

const FILES: FileData[] = [
  {
    name: "app.py",
    icon: "🐍",
    iconColor: "#3572A5",
    lines: [
      `import codepath`,
      `from codepath.engine import LearningEngine`,
      ``,
      `class CodePathApp:`,
      `    def __init__(self):`,
      `        self.engine = LearningEngine()`,
      `        self.courses = ["Python", "JavaScript", "SQL"]`,
      ``,
      `    def launch(self):`,
      `        for course in self.courses:`,
      `            self.engine.load(course)`,
      `        print("✓ Platform ready")`,
      `        return self.engine.start()`,
    ],
  },
  {
    name: "server.js",
    icon: "⚡",
    iconColor: "#f7df1e",
    lines: [
      `const express = require("express");`,
      `const { CodeRunner } = require("./runner");`,
      ``,
      `const app = express();`,
      `const runner = new CodeRunner();`,
      ``,
      `app.post("/api/run", async (req, res) => {`,
      `  const result = await runner.execute(req.body);`,
      `  res.json({ output: result, status: "ok" });`,
      `});`,
      ``,
      `app.listen(3000, () => {`,
      `  console.log("CodePath API → port 3000");`,
      `});`,
    ],
  },
  {
    name: "styles.css",
    icon: "🎨",
    iconColor: "#264de4",
    lines: [
      `:root {`,
      `  --primary: #6366f1;`,
      `  --glow: rgba(99, 102, 241, 0.4);`,
      `}`,
      ``,
      `.editor {`,
      `  background: #1e1e2e;`,
      `  border-radius: 12px;`,
      `  box-shadow: 0 0 60px var(--glow);`,
      `  font-family: "Fira Code", monospace;`,
      `}`,
      ``,
      `.btn-primary {`,
      `  background: linear-gradient(135deg, #6366f1, #8b5cf6);`,
      `  transition: all 0.2s ease;`,
      `}`,
    ],
  },
  {
    name: "query.sql",
    icon: "🗄️",
    iconColor: "#e48e00",
    lines: [
      `SELECT u.username, u.xp, u.level,`,
      `       COUNT(p.lesson_id) as completed`,
      `FROM users u`,
      `LEFT JOIN progress p ON u.id = p.user_id`,
      `WHERE u.streak > 0`,
      `GROUP BY u.id`,
      `ORDER BY u.xp DESC`,
      `LIMIT 10;`,
    ],
  },
];

const TERMINAL_LINES = [
  { text: "$ codepath build --production", delay: 0 },
  { text: "► Compiling modules...", delay: 80 },
  { text: "  ✓ Python engine loaded", delay: 60 },
  { text: "  ✓ JavaScript runtime ready", delay: 50 },
  { text: "  ✓ SQL executor initialized", delay: 50 },
  { text: "► Building interface...", delay: 70 },
  { text: "  ✓ 81 lessons compiled", delay: 50 },
  { text: "  ✓ Assets optimized (2.4 MB)", delay: 40 },
  { text: "► Starting server...", delay: 60 },
  { text: "", delay: 20 },
  { text: "  ╔══════════════════════════════════╗", delay: 30 },
  { text: "  ║  CodePath v2.0 — Ready to learn  ║", delay: 30 },
  { text: "  ╚══════════════════════════════════╝", delay: 30 },
];

const EXPLORER_FILES = [
  { name: "src", isFolder: true, indent: 0, icon: "📁" },
  { name: "app.py", isFolder: false, indent: 1, icon: "🐍" },
  { name: "server.js", isFolder: false, indent: 1, icon: "⚡" },
  { name: "runner.ts", isFolder: false, indent: 1, icon: "📘" },
  { name: "styles", isFolder: true, indent: 0, icon: "📁" },
  { name: "styles.css", isFolder: false, indent: 1, icon: "🎨" },
  { name: "theme.css", isFolder: false, indent: 1, icon: "🎨" },
  { name: "database", isFolder: true, indent: 0, icon: "📁" },
  { name: "query.sql", isFolder: false, indent: 1, icon: "🗄️" },
  { name: "schema.sql", isFolder: false, indent: 1, icon: "🗄️" },
  { name: "package.json", isFolder: false, indent: 0, icon: "📦" },
  { name: "README.md", isFolder: false, indent: 0, icon: "📄" },
];

type Phase = "typing" | "terminal" | "reveal" | "done";

const c = {
  kw: "#c678dd",
  str: "#98c379",
  fn: "#61afef",
  num: "#d19a66",
  builtin: "#e5c07b",
  punct: "#abb2bf",
  def: "#abb2bf",
  comment: "#5c6370",
  css_prop: "#9cdcfe",
  css_val: "#ce9178",
  sql_kw: "#c678dd",
  tag: "#e06c75",
};

function colorize(line: string, fileName: string): React.ReactNode[] {
  if (line.trim() === "") return [<span key="0">{" "}</span>];

  const ext = fileName.split(".").pop();
  let patterns: [RegExp, string][] = [];

  if (ext === "py") {
    patterns = [
      [/^(import|from|class|def|for|in|return|self|if|else|print)\b/, c.kw],
      [/^(LearningEngine|CodePathApp)\b/, c.fn],
      [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/, c.str],
      [/^(\d+)/, c.num],
      [/^(engine|courses|course|load|start|launch)\b/, c.builtin],
      [/^([()[\]{},.:=])/, c.punct],
      [/^(#.*)$/, c.comment],
    ];
  } else if (ext === "js" || ext === "ts") {
    patterns = [
      [/^(const|let|var|function|return|async|await|require|new)\b/, c.kw],
      [/^(express|CodeRunner|app|runner|req|res|console)\b/, c.builtin],
      [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, c.str],
      [/^(\d+)/, c.num],
      [/^(post|execute|json|listen|log|body)\b/, c.fn],
      [/^([()[\]{},.:;=<>])/, c.punct],
      [/^(\/\/.*)$/, c.comment],
    ];
  } else if (ext === "css") {
    patterns = [
      [/^(:root|\.[\w-]+)\b/, c.tag],
      [/^(--[\w-]+)/, c.css_prop],
      [/^(background|border-radius|box-shadow|font-family|transition|all)\b/, c.css_prop],
      [/^(#[0-9a-fA-F]{3,8})\b/, c.num],
      [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/, c.str],
      [/^(linear-gradient|rgba)\b/, c.fn],
      [/^(\d+\.?\d*(px|deg|rem|em|s|%)?)/, c.num],
      [/^(var)\b/, c.fn],
      [/^([{}();:,])/, c.punct],
    ];
  } else if (ext === "sql") {
    patterns = [
      [/^(SELECT|FROM|LEFT JOIN|JOIN|WHERE|GROUP BY|ORDER BY|LIMIT|ON|AS|COUNT|DESC|AND|OR|INSERT|UPDATE|DELETE|CREATE|TABLE|INTO|VALUES)\b/i, c.sql_kw],
      [/^(u|p)\b/, c.builtin],
      [/^(username|xp|level|lesson_id|completed|user_id|streak|id)\b/, c.css_prop],
      [/^(\d+)/, c.num],
      [/^('(?:[^'\\]|\\.)*')/, c.str],
      [/^([().,;*>])/, c.punct],
    ];
  }

  const tokens: React.ReactNode[] = [];
  let remaining = line;
  let k = 0;

  while (remaining.length > 0) {
    let matched = false;
    for (const [regex, color] of patterns) {
      const match = remaining.match(regex);
      if (match) {
        tokens.push(<span key={k++} style={{ color }}>{match[0]}</span>);
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      let nextIdx = remaining.length;
      for (const [regex] of patterns) {
        const m = remaining.slice(1).search(regex);
        if (m !== -1 && m + 1 < nextIdx) nextIdx = m + 1;
      }
      tokens.push(<span key={k++} style={{ color: c.def }}>{remaining.slice(0, nextIdx)}</span>);
      remaining = remaining.slice(nextIdx);
    }
  }

  return tokens;
}

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>("typing");
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [openTabs, setOpenTabs] = useState<number[]>([0]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [flashLine, setFlashLine] = useState(-1);
  const completedRef = useRef(false);
  const skipRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFile = FILES[activeFileIdx];

  const finish = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    skipRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    finish();
  }, [finish]);

  useEffect(() => {
    if (phase !== "typing" || skipRef.current) return;

    const totalLines = activeFile.lines.length;

    if (visibleLineCount < totalLines) {
      const linesPerBurst = visibleLineCount === 0 ? 2 : (Math.random() > 0.6 ? 2 : 1);
      const delay = visibleLineCount === 0 ? 120 : (40 + Math.random() * 40);
      timerRef.current = setTimeout(() => {
        const next = Math.min(visibleLineCount + linesPerBurst, totalLines);
        setVisibleLineCount(next);
        setFlashLine(next - 1);
        flashTimerRef.current = setTimeout(() => setFlashLine(-1), 150);
      }, delay);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    } else {
      const nextFileIdx = activeFileIdx + 1;
      if (nextFileIdx < FILES.length) {
        timerRef.current = setTimeout(() => {
          setActiveFileIdx(nextFileIdx);
          setOpenTabs((prev) => [...prev, nextFileIdx]);
          setVisibleLineCount(0);
        }, 200);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
      } else {
        timerRef.current = setTimeout(() => setPhase("terminal"), 250);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
      }
    }
  }, [phase, visibleLineCount, activeFileIdx, activeFile.lines.length]);

  useEffect(() => {
    if (phase !== "terminal" || skipRef.current) return;

    const lineIdx = terminalLines.length;
    if (lineIdx < TERMINAL_LINES.length) {
      const delay = TERMINAL_LINES[lineIdx].delay;
      timerRef.current = setTimeout(() => {
        setTerminalLines((p) => [...p, TERMINAL_LINES[lineIdx].text]);
      }, delay);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    } else {
      timerRef.current = setTimeout(() => setPhase("reveal"), 400);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [phase, terminalLines]);

  useEffect(() => {
    if (phase !== "reveal" || skipRef.current) return;
    timerRef.current = setTimeout(finish, 900);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, finish]);

  const visibleLines = activeFile.lines.slice(0, visibleLineCount);
  const showTerminal = phase === "terminal" || phase === "reveal";

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          animate={phase === "reveal" ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => {
            if (phase === "reveal") { setPhase("done"); finish(); }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            background: "#1e1e2e",
            overflow: "hidden",
          }}
        >
          <div style={{
            height: "38px",
            background: "#181825",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: "8px",
            borderBottom: "1px solid #313244",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: "7px", marginRight: "12px" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
            </div>
            <div style={{
              flex: 1,
              textAlign: "center",
              fontSize: "12px",
              color: "#6c7086",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.3px",
            }}>
              CodePath Editor
            </div>
            <div style={{ width: 60 }} />
          </div>

          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <motion.div
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                width: "200px",
                background: "#181825",
                borderRight: "1px solid #313244",
                padding: "8px 0",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <div style={{
                padding: "6px 12px",
                fontSize: "11px",
                color: "#6c7086",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
              }}>
                Explorer
              </div>

              {EXPLORER_FILES.map((f, i) => {
                const isActive = !f.isFolder && f.name === activeFile.name;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    style={{
                      padding: "3px 12px",
                      paddingLeft: `${12 + f.indent * 16}px`,
                      fontSize: "12px",
                      fontFamily: "system-ui, sans-serif",
                      color: isActive ? "#cdd6f4" : "#6c7086",
                      background: isActive ? "rgba(99, 102, 241, 0.1)" : "transparent",
                      borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "default",
                    }}
                  >
                    <span style={{ fontSize: "11px" }}>{f.isFolder ? (isActive ? "📂" : "📁") : f.icon}</span>
                    <span>{f.name}</span>
                  </motion.div>
                );
              })}
            </motion.div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{
                display: "flex",
                background: "#181825",
                borderBottom: "1px solid #313244",
                overflow: "hidden",
                flexShrink: 0,
              }}>
                {openTabs.map((tabIdx) => {
                  const file = FILES[tabIdx];
                  const isActive = tabIdx === activeFileIdx;
                  return (
                    <motion.div
                      key={tabIdx}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontFamily: "system-ui, sans-serif",
                        color: isActive ? "#cdd6f4" : "#6c7086",
                        background: isActive ? "#1e1e2e" : "#181825",
                        borderRight: "1px solid #313244",
                        borderBottom: isActive ? "2px solid #6366f1" : "2px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                        cursor: "default",
                      }}
                    >
                      <span style={{ fontSize: "11px" }}>{file.icon}</span>
                      {file.name}
                    </motion.div>
                  );
                })}
              </div>

              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
              }}>
                <div style={{
                  flex: showTerminal ? 0.55 : 1,
                  transition: "flex 0.3s ease",
                  overflow: "auto",
                  display: "flex",
                  fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace",
                  fontSize: "13px",
                  lineHeight: 1.75,
                  padding: "12px 0",
                }}>
                  <div style={{
                    width: "48px",
                    textAlign: "right",
                    paddingRight: "12px",
                    userSelect: "none",
                    flexShrink: 0,
                    color: "#45475a",
                    fontSize: "12px",
                  }}>
                    {activeFile.lines.map((_, i) => (
                      <div key={i} style={{
                        opacity: i < visibleLineCount ? 0.8 : 0.2,
                        transition: "opacity 0.15s",
                      }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  <div style={{
                    flex: 1,
                    borderLeft: "1px solid #313244",
                    paddingLeft: "16px",
                    paddingRight: "24px",
                  }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeFileIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {visibleLines.map((line, i) => (
                          <motion.div
                            key={`${activeFileIdx}-${i}`}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.1 }}
                            style={{
                              position: "relative",
                            }}
                          >
                            {flashLine === i && (
                              <motion.div
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                  position: "absolute",
                                  inset: "-1px -24px -1px -16px",
                                  background: "rgba(99, 102, 241, 0.08)",
                                  borderLeft: "2px solid rgba(99, 102, 241, 0.4)",
                                }}
                              />
                            )}
                            <span style={{ position: "relative", zIndex: 1 }}>
                              {colorize(line, activeFile.name)}
                            </span>
                          </motion.div>
                        ))}

                        {phase === "typing" && visibleLineCount > 0 && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
                            style={{
                              display: "inline-block",
                              width: "8px",
                              height: "16px",
                              background: "#6366f1",
                              boxShadow: "0 0 8px rgba(99, 102, 241, 0.5)",
                              borderRadius: "1px",
                              verticalAlign: "text-bottom",
                              marginLeft: "2px",
                            }}
                          />
                        )}

                        {visibleLineCount < activeFile.lines.length && (
                          <div style={{ marginTop: "4px" }}>
                            {activeFile.lines.slice(visibleLineCount).map((_, i) => (
                              <div key={i} style={{ height: "22.75px" }} />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <AnimatePresence>
                  {showTerminal && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "45%" }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        borderTop: "1px solid #313244",
                        background: "#11111b",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 12px",
                        borderBottom: "1px solid #313244",
                        flexShrink: 0,
                      }}>
                        <span style={{ color: "#a6e3a1", fontSize: "10px" }}>●</span>
                        <span style={{
                          fontSize: "11px",
                          color: "#6c7086",
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                          fontFamily: "system-ui, sans-serif",
                        }}>
                          Terminal
                        </span>
                      </div>
                      <div style={{
                        padding: "8px 16px",
                        fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                        fontSize: "12px",
                        lineHeight: 1.7,
                        flex: 1,
                        overflow: "auto",
                      }}>
                        {terminalLines.map((line, i) => {
                          const isCmd = line.startsWith("$");
                          const isOk = line.startsWith("  ✓");
                          const isHead = line.startsWith("►");
                          const isBox = line.includes("═") || line.includes("║") || line.includes("╔") || line.includes("╚");

                          let color = "#a6adc8";
                          if (isCmd) color = "#89b4fa";
                          if (isOk) color = "#a6e3a1";
                          if (isHead) color = "#cba6f7";
                          if (isBox) color = "#f9e2af";

                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.1 }}
                              style={{
                                color,
                                textShadow: (isOk || isBox) ? `0 0 8px ${color}30` : "none",
                              }}
                            >
                              {line || "\u00A0"}
                            </motion.div>
                          );
                        })}
                        {phase === "terminal" && terminalLines.length < TERMINAL_LINES.length && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
                            style={{
                              display: "inline-block",
                              width: "7px",
                              height: "14px",
                              background: "#a6e3a1",
                              borderRadius: "1px",
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={phase === "reveal" ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              background: "radial-gradient(ellipse at center, #1e1e2e 0%, #11111b 100%)",
              pointerEvents: phase === "reveal" ? "auto" : "none",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={phase === "reveal" ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 80px rgba(99, 102, 241, 0.5), 0 0 160px rgba(139, 92, 246, 0.2)",
                marginBottom: "20px",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={phase === "reveal" ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.15 }}
              style={{
                fontSize: "clamp(24px, 4vw, 40px)",
                fontWeight: 800,
                color: "#fff",
                fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              CodePath
            </motion.div>
          </motion.div>

          <button
            onClick={handleSkip}
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              zIndex: 10001,
              padding: "6px 16px",
              border: "1px solid #313244",
              borderRadius: "6px",
              background: "rgba(30,30,46,0.8)",
              color: "#6c7086",
              fontSize: "12px",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.15s ease",
              fontFamily: "system-ui, sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#cdd6f4";
              e.currentTarget.style.borderColor = "#6366f1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6c7086";
              e.currentTarget.style.borderColor = "#313244";
            }}
          >
            Skip
          </button>

          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 10001,
          }}>
            <div style={{
              width: "120px",
              height: "3px",
              background: "#313244",
              borderRadius: "2px",
              overflow: "hidden",
            }}>
              <motion.div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  borderRadius: "2px",
                }}
                animate={{
                  width: phase === "typing"
                    ? `${((activeFileIdx / FILES.length) + (visibleLineCount / activeFile.lines.length / FILES.length)) * 75}%`
                    : phase === "terminal"
                    ? `${75 + (terminalLines.length / TERMINAL_LINES.length) * 20}%`
                    : "100%"
                }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              />
            </div>
            <span style={{
              fontSize: "10px",
              color: "#45475a",
              fontFamily: "system-ui, sans-serif",
            }}>
              {phase === "typing" ? `${activeFileIdx + 1}/${FILES.length}` : phase === "terminal" ? "Building..." : "✓"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
