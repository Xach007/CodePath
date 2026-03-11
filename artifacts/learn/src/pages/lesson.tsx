import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetLesson, 
  useCompleteLesson, 
  useSubmitQuiz, 
  useSubmitCode,
  getGetUserProgressQueryKey,
  getGetGamificationProfileQueryKey
} from "@workspace/api-client-react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Play, CheckCircle2, XCircle, ArrowRight, Lightbulb, Trophy, Star, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function Lesson() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const lessonId = parseInt(params.id || "0");
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useGetLesson(lessonId, { query: { enabled: !!lessonId } });
  const completeMutation = useCompleteLesson();
  const quizMutation = useSubmitQuiz();
  const codeMutation = useSubmitCode();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'submitted'>('idle');
  const [quizResult, setQuizResult] = useState<any>(null);

  const [code, setCode] = useState<string>("");
  const [codeResult, setCodeResult] = useState<any>(null);
  const [showHints, setShowHints] = useState(false);

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [rewardData, setRewardData] = useState<{xp: number, achievements: any[]}>({xp: 0, achievements: []});

  const [isDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    setSelectedOption(null);
    setQuizState('idle');
    setQuizResult(null);
    setCodeResult(null);
    setShowHints(false);
    setShowSuccessOverlay(false);
    if (lesson?.codingChallenge?.starterCode) {
      setCode(lesson.codingChallenge.starterCode);
    }
  }, [lessonId, lesson]);

  if (isLoading || !lesson) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="h-16 border-b border-border/50 flex items-center px-6">
          <Skeleton className="h-2 w-full max-w-md rounded-full" />
        </div>
        <div className="flex-1 p-8"><Skeleton className="h-full w-full rounded-3xl" /></div>
      </div>
    );
  }

  const triggerConfetti = () => {
    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#8b5cf6', '#10b981', '#f59e0b'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#8b5cf6', '#10b981', '#f59e0b'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleSuccess = (xp: number, achievements: any[]) => {
    triggerConfetti();
    setRewardData({ xp, achievements });
    setShowSuccessOverlay(true);
    queryClient.invalidateQueries({ queryKey: getGetUserProgressQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetGamificationProfileQueryKey() });
  };

  const handleTheoryComplete = async () => {
    try {
      const res = await completeMutation.mutateAsync({ lessonId });
      handleSuccess(res.xpEarned, res.newAchievements);
    } catch (err) {
      toast.error("Failed to complete lesson");
    }
  };

  const handleQuizSubmit = async () => {
    if (!selectedOption || !lesson.quizQuestions?.[0]) return;
    try {
      const res = await quizMutation.mutateAsync({
        lessonId,
        data: { answers: [{ questionId: lesson.quizQuestions[0].id, optionId: selectedOption }] }
      });
      setQuizResult(res);
      setQuizState('submitted');
      if (res.passed) handleSuccess(res.xpEarned, res.newAchievements);
    } catch (err) {
      toast.error("Failed to submit quiz");
    }
  };

  const handleCodeSubmit = async () => {
    try {
      const res = await codeMutation.mutateAsync({
        lessonId,
        data: { code, language: lesson.codingChallenge!.language }
      });
      setCodeResult(res);
      if (res.passed) {
        handleSuccess(res.xpEarned, res.newAchievements);
      } else {
        toast.error("Some tests failed. Keep trying!");
      }
    } catch (err) {
      toast.error("Execution error");
    }
  };

  const handleNext = () => {
    if (lesson.nextLessonId) {
      setLocation(`/lessons/${lesson.nextLessonId}`);
    } else {
      setLocation(`/courses/${lesson.moduleId}`);
    }
  };

  const renderTheory = () => (
    <div className="max-w-3xl mx-auto py-12 px-4 md:px-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">{lesson.title}</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-code:text-primary prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {lesson.content || ""}
          </ReactMarkdown>
        </div>
      </motion.div>
      <div className="fixed bottom-0 left-0 right-0 p-4 glass flex justify-center">
        <Button 
          size="lg" 
          className="w-full max-w-md rounded-xl h-14 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" 
          onClick={handleTheoryComplete}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? "Saving..." : "Complete & Continue"}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const question = lesson.quizQuestions?.[0];
    if (!question) return null;
    const isCorrect = quizResult?.results?.[0]?.correct;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-8">{question.question}</h2>
          
          <div className="space-y-3">
            {question.options.map((opt, optIdx) => {
              const isSelected = selectedOption === opt.id;
              const isSubmitted = quizState === 'submitted';
              const correctOptionId = quizResult?.results?.[0]?.correctOptionId;
              
              let variant = "default";
              if (isSubmitted && opt.id === correctOptionId) variant = "correct";
              else if (isSubmitted && isSelected && !isCorrect) variant = "incorrect";
              else if (isSubmitted) variant = "dimmed";
              else if (isSelected) variant = "selected";

              const styles: Record<string, string> = {
                default: "border-border/50 bg-card hover:border-primary/30 hover:bg-primary/[0.03]",
                selected: "border-primary bg-primary/8 ring-2 ring-primary/20",
                correct: "border-success bg-success/8",
                incorrect: "border-destructive bg-destructive/8",
                dimmed: "border-border/30 opacity-50",
              };

              return (
                <motion.button 
                  key={opt.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: optIdx * 0.06, duration: 0.4 }}
                  className={`w-full border-2 text-left p-5 rounded-2xl transition-all duration-300 flex items-center gap-4 ${styles[variant]}`}
                  onClick={() => !isSubmitted && setSelectedOption(opt.id)}
                  disabled={isSubmitted}
                >
                  <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                    variant === "selected" || variant === "correct" ? "border-current bg-current/10" : "border-border"
                  }`}>
                    {isSubmitted && opt.id === correctOptionId ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                     isSubmitted && isSelected && !isCorrect ? <XCircle className="w-5 h-5 text-destructive" /> :
                     String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="flex-1 font-medium leading-snug">{opt.text}</span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {isSubmitted && quizResult?.results?.[0]?.explanation && (
              <motion.div 
                initial={{ opacity: 0, y: 12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -12, height: 0 }}
                className={`mt-6 p-5 rounded-2xl ${isCorrect ? 'bg-success/8 border border-success/15' : 'bg-destructive/8 border border-destructive/15'}`}
              >
                <h4 className={`font-bold mb-1.5 flex items-center gap-2 text-sm ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {isCorrect ? "Correct!" : "Not quite right"}
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{quizResult.results[0].explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="pt-6 flex border-t border-border/50 mt-8">
          {!isSubmitted ? (
            <Button 
              size="lg" 
              className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" 
              disabled={!selectedOption || quizMutation.isPending}
              onClick={handleQuizSubmit}
            >
              {quizMutation.isPending ? "Checking..." : "Check Answer"}
            </Button>
          ) : !isCorrect ? (
            <Button 
              size="lg" 
              variant="outline"
              className="w-full rounded-xl h-14 text-base font-bold border-2"
              onClick={() => { setQuizState('idle'); setSelectedOption(null); setQuizResult(null); }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  const renderChallenge = () => {
    const chal = lesson.codingChallenge;
    if (!chal) return null;

    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-background">
        <div className="w-full md:w-[380px] xl:w-[420px] border-r border-border/50 flex flex-col bg-card">
          <div className="p-6 flex-1 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl font-display font-bold mb-4">{lesson.title}</h2>
              <div className="prose prose-sm dark:prose-invert prose-headings:font-display">
                <ReactMarkdown>{chal.instructions}</ReactMarkdown>
              </div>
              
              {chal.hints && chal.hints.length > 0 && (
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowHints(!showHints)} 
                    className="rounded-xl text-xs font-semibold border-accent/30 text-accent bg-accent/5 hover:bg-accent/10"
                  >
                    <Lightbulb className="w-3.5 h-3.5 mr-1.5" /> {showHints ? "Hide Hints" : "Show Hints"}
                  </Button>
                  <AnimatePresence>
                    {showHints && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2 overflow-hidden"
                      >
                        {chal.hints.map((hint, i) => (
                          <div key={i} className="p-3 bg-accent/5 border border-accent/10 rounded-xl text-sm">
                            <span className="font-semibold text-accent text-xs">Hint {i+1}:</span>{" "}
                            <span className="text-foreground/80">{hint}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
          
          <div className="h-[35%] border-t border-border/50 bg-muted/20 p-4 overflow-y-auto">
            <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Test Results</h3>
            {!codeResult ? (
              <p className="text-sm text-muted-foreground/60 italic">Run your code to see results.</p>
            ) : (
              <div className="space-y-2">
                {codeResult.testResults.map((t: any, i: number) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      t.passed ? 'bg-success/5 border-success/15' : 'bg-destructive/5 border-destructive/15'
                    }`}
                  >
                    {t.passed ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                    <div className="text-xs">
                      <p className="font-semibold">{t.name}</p>
                      {!t.passed && (
                        <div className="mt-1.5 font-mono bg-background/50 p-2 rounded-lg text-[11px]">
                          <span className="text-muted-foreground">Expected:</span> {t.expected}<br/>
                          <span className="text-destructive">Got:</span> {t.actual}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              language={chal.language.toLowerCase()}
              theme={isDark ? "vs-dark" : "vs"}
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, monospace',
                fontLigatures: true,
                padding: { top: 20, bottom: 20 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                renderLineHighlight: "gutter",
                lineNumbersMinChars: 3,
                folding: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
          <div className="h-14 border-t border-border/50 bg-card flex items-center justify-between px-5">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCode(chal.starterCode)} 
              className="text-muted-foreground text-xs font-semibold rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
            <Button 
              className="rounded-xl font-bold bg-success hover:bg-success/90 text-success-foreground px-6 h-9 text-sm shadow-lg shadow-success/20 hover:shadow-success/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              onClick={handleCodeSubmit}
              disabled={codeMutation.isPending}
            >
              {codeMutation.isPending ? "Running..." : "Run Tests"}
              <Play className="w-3.5 h-3.5 ml-1.5 fill-current" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-16 border-b border-border/50 flex items-center px-5 justify-between bg-card z-10 relative">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-xl hover:bg-muted">
              <X className="w-5 h-5" />
            </Button>
            <Progress value={0} className="w-32 md:w-56 h-2 rounded-full bg-muted" indicatorClassName="bg-gradient-to-r from-primary to-[hsl(280,80%,60%)]" />
          </div>
          <div className="flex items-center gap-1.5 font-bold text-sm text-accent bg-accent/8 px-3.5 py-1.5 rounded-full border border-accent/15">
            <Star className="w-4 h-4 fill-current" />
            <span>{lesson.xpReward} XP</span>
          </div>
        </header>

        {lesson.type === 'theory' && renderTheory()}
        {lesson.type === 'quiz' && renderQuiz()}
        {lesson.type === 'challenge' && renderChallenge()}
      </div>

      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
              className="max-w-sm w-full bg-card border border-border/50 p-8 rounded-3xl shadow-2xl shadow-black/10 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
                className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-success" />
              </motion.div>
              <h2 className="text-3xl font-display font-extrabold mb-2 gradient-text">
                Lesson Complete!
              </h2>
              <p className="text-muted-foreground mb-8">Great job! Keep going.</p>
              
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-3 mb-8 bg-accent/8 p-4 rounded-2xl border border-accent/15"
              >
                <Star className="w-7 h-7 text-accent fill-accent" />
                <span className="text-2xl font-bold text-accent">+{rewardData.xp} XP</span>
              </motion.div>

              {rewardData.achievements && rewardData.achievements.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8 text-left bg-muted/50 p-4 rounded-2xl border border-border/50"
                >
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> New Achievement
                  </h4>
                  {rewardData.achievements.map((ach: any) => (
                    <div key={ach.id} className="flex items-center gap-3">
                      <span className="text-2xl">{ach.icon}</span>
                      <div>
                        <p className="font-bold text-sm">{ach.title}</p>
                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              <Button 
                size="lg" 
                className="w-full rounded-xl h-13 text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                onClick={handleNext}
              >
                Continue <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
