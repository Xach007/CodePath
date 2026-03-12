import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetLesson, 
  useCompleteLesson, 
  useSubmitQuiz, 
  useSubmitCode,
  useCheckAnswer,
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
import { X, Play, CheckCircle2, XCircle, ArrowRight, Lightbulb, Trophy, Star, RotateCcw, Terminal, Code2, FileText, AlertTriangle } from "lucide-react";
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
  const checkAnswerMutation = useCheckAnswer();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'checked'>('idle');
  const [quizResult, setQuizResult] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<{questionId: number, optionId: number}[]>([]);
  const [answerResults, setAnswerResults] = useState<Record<number, {correct: boolean, correctOptionId: number, explanation?: string | null}>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  const [code, setCode] = useState<string>("");
  const [codeResult, setCodeResult] = useState<any>(null);
  const [showHints, setShowHints] = useState(false);
  const [mobileTab, setMobileTab] = useState<'instructions' | 'editor' | 'results'>('editor');

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
    setCurrentQuestionIndex(0);
    setCollectedAnswers([]);
    setAnswerResults({});
    setQuizFinished(false);
    setCodeResult(null);
    setShowHints(false);
    setShowSuccessOverlay(false);
    setMobileTab('editor');
    if (lesson?.codingChallenge?.starterCode) {
      setCode(lesson.codingChallenge.starterCode);
    }
  }, [lessonId, lesson]);

  if (isLoading || !lesson) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="h-16 border-b border-border/50 flex items-center px-6 gap-4">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-2 flex-1 max-w-md rounded-full" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
              <Code2 className="w-8 h-8 text-primary" />
            </div>
            <Skeleton className="h-6 w-48 mx-auto rounded-lg" />
            <Skeleton className="h-4 w-32 mx-auto rounded-lg" />
          </div>
        </div>
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

  const handleQuizCheck = async () => {
    const questions = lesson.quizQuestions || [];
    const question = questions[currentQuestionIndex];
    if (!selectedOption || !question) return;

    try {
      const res = await checkAnswerMutation.mutateAsync({
        lessonId,
        data: { questionId: question.id, optionId: selectedOption }
      });
      setAnswerResults(prev => ({ ...prev, [question.id]: res }));
      setCollectedAnswers(prev => [...prev, { questionId: question.id, optionId: selectedOption }]);
      setQuizState('checked');
    } catch (err) {
      toast.error("Failed to check answer");
    }
  };

  const handleQuizNext = async () => {
    const questions = lesson.quizQuestions || [];
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;

    if (isLastQuestion) {
      const allAnswers = collectedAnswers;
      try {
        const res = await quizMutation.mutateAsync({
          lessonId,
          data: { answers: allAnswers }
        });
        setQuizResult(res);
        setQuizFinished(true);
        if (res.passed) handleSuccess(res.xpEarned, res.newAchievements);
      } catch (err) {
        toast.error("Failed to submit quiz");
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setQuizState('idle');
    }
  };

  const handleQuizRetry = () => {
    setCurrentQuestionIndex(0);
    setCollectedAnswers([]);
    setSelectedOption(null);
    setQuizState('idle');
    setQuizResult(null);
    setAnswerResults({});
    setQuizFinished(false);
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
        setMobileTab('results');
        toast.error("Some tests failed. Check the results and try again!");
      }
    } catch (err) {
      toast.error("Execution error");
    }
  };

  const handleNext = () => {
    if (lesson.nextLessonId) {
      setLocation(`/lessons/${lesson.nextLessonId}`);
    } else {
      setLocation(`/courses`);
    }
  };

  const quizQuestionCount = lesson.quizQuestions?.length || 1;
  const progressValue = lesson.isCompleted ? 100 : 
    lesson.type === 'quiz' ? Math.round((currentQuestionIndex / quizQuestionCount) * 100) : 0;

  const renderTheory = () => (
    <div className="max-w-3xl mx-auto py-12 px-4 md:px-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Theory Lesson</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold">{lesson.title}</h1>
          </div>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-code:text-primary prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl">
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
    const questions = lesson.quizQuestions || [];
    if (questions.length === 0) return null;
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    const totalQuestions = questions.length;
    const isChecked = quizState === 'checked';
    const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

    const currentResult = answerResults[question.id];
    const isCurrentCorrect = currentResult?.correct;
    const correctOptionId = currentResult?.correctOptionId;

    if (quizFinished && quizResult) {
      const correctCount = Object.values(answerResults).filter(r => r.correct).length;
      return (
        <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col min-h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${quizResult.passed ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <span className="text-4xl">{quizResult.passed ? '🎉' : '😔'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              {quizResult.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              You got {correctCount} out of {totalQuestions} correct
              {!quizResult.passed && '. You need at least 70% to pass.'}
            </p>
            <div className="flex gap-2 mb-8">
              {questions.map((q: any, i: number) => {
                const r = answerResults[q.id];
                return (
                  <div key={i} className={`w-3 h-3 rounded-full ${r?.correct ? 'bg-success' : 'bg-destructive'}`} />
                );
              })}
            </div>
            {!quizResult.passed && (
              <Button 
                size="lg" 
                variant="outline"
                className="rounded-xl h-14 px-8 text-base font-bold border-2"
                onClick={handleQuizRetry}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </motion.div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col min-h-[calc(100vh-4rem)]">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <span className="text-lg">❓</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: totalQuestions }).map((_, i) => {
                const q = questions[i];
                const r = q ? answerResults[q.id] : undefined;
                return (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                      r ? (r.correct ? 'bg-success' : 'bg-destructive') :
                      i === currentQuestionIndex ? 'bg-primary' :
                      'bg-muted'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-display font-bold mb-8">{question.question}</h2>
          
          <div className="space-y-3">
            {question.options.map((opt: any, optIdx: number) => {
              const isSelected = selectedOption === opt.id;
              
              let variant = "default";
              if (isChecked && opt.id === correctOptionId) variant = "correct";
              else if (isChecked && isSelected && !isCurrentCorrect) variant = "incorrect";
              else if (isChecked) variant = "dimmed";
              else if (isSelected) variant = "selected";

              const styles: Record<string, string> = {
                default: "border-border/50 bg-card hover:border-primary/30 hover:bg-primary/[0.03]",
                selected: "border-primary bg-primary/8 ring-2 ring-primary/20",
                correct: "border-success bg-success/8 ring-2 ring-success/20",
                incorrect: "border-destructive bg-destructive/8 ring-2 ring-destructive/20",
                dimmed: "border-border/30 opacity-50",
              };

              return (
                <motion.button 
                  key={opt.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: optIdx * 0.06, duration: 0.4 }}
                  className={`w-full border-2 text-left p-5 rounded-2xl transition-all duration-300 flex items-center gap-4 ${styles[variant]}`}
                  onClick={() => !isChecked && setSelectedOption(opt.id)}
                  disabled={isChecked}
                >
                  <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                    variant === "selected" || variant === "correct" ? "border-current bg-current/10" : "border-border"
                  }`}>
                    {isChecked && opt.id === correctOptionId ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                     isChecked && isSelected && !isCurrentCorrect ? <XCircle className="w-5 h-5 text-destructive" /> :
                     String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="flex-1 font-medium leading-snug">{opt.text}</span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {isChecked && currentResult?.explanation && (
              <motion.div 
                initial={{ opacity: 0, y: 12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -12, height: 0 }}
                className={`mt-6 p-5 rounded-2xl ${isCurrentCorrect ? 'bg-success/8 border border-success/15' : 'bg-destructive/8 border border-destructive/15'}`}
              >
                <h4 className={`font-bold mb-1.5 flex items-center gap-2 text-sm ${isCurrentCorrect ? 'text-success' : 'text-destructive'}`}>
                  {isCurrentCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {isCurrentCorrect ? "Correct!" : "Not quite right"}
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{currentResult.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="pt-6 flex border-t border-border/50 mt-8">
          {!isChecked ? (
            <Button 
              size="lg" 
              className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" 
              disabled={!selectedOption || checkAnswerMutation.isPending}
              onClick={handleQuizCheck}
            >
              {checkAnswerMutation.isPending ? "Checking..." : "Check Answer"}
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
              onClick={handleQuizNext}
              disabled={quizMutation.isPending}
            >
              {quizMutation.isPending ? "Finishing..." : isLastQuestion ? "Finish Quiz" : "Next Question"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderTestResults = () => (
    <div className="space-y-2">
      {codeResult?.errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 mb-3"
        >
          <div className="flex items-center gap-2 text-destructive text-xs font-bold mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Runtime Error
          </div>
          <pre className="text-xs font-mono text-destructive/80 whitespace-pre-wrap break-all">{codeResult.errorMessage}</pre>
        </motion.div>
      )}
      {codeResult?.output && !codeResult?.errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border border-border/30 bg-muted/30 mb-3"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold mb-1">
            <Terminal className="w-3.5 h-3.5" />
            Output
          </div>
          <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{codeResult.output}</pre>
        </motion.div>
      )}
      {codeResult?.testResults?.map((t: any, i: number) => (
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
          <div className="text-xs flex-1 min-w-0">
            <p className="font-semibold">{t.name}</p>
            {!t.passed && (
              <div className="mt-1.5 font-mono bg-background/50 p-2 rounded-lg text-[11px] space-y-0.5">
                <div><span className="text-muted-foreground">Expected:</span> <span className="text-success">{t.expected}</span></div>
                <div><span className="text-muted-foreground">Got:</span> <span className="text-destructive">{t.actual || "(no output)"}</span></div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderChallenge = () => {
    const chal = lesson.codingChallenge;
    if (!chal) return null;

    const passedCount = codeResult?.testResults?.filter((t: any) => t.passed).length || 0;
    const totalTests = codeResult?.testResults?.length || 0;

    return (
      <>
        {/* Desktop layout */}
        <div className="hidden md:flex flex-row h-[calc(100vh-4rem)] bg-background">
          <div className="w-[380px] xl:w-[420px] border-r border-border/50 flex flex-col bg-card">
            <div className="p-6 flex-1 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-success" />
                  </div>
                  <h2 className="text-lg font-display font-bold">{lesson.title}</h2>
                </div>
                <div className="prose prose-sm dark:prose-invert prose-headings:font-display prose-pre:rounded-xl">
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
                          {chal.hints.map((hint: string, i: number) => (
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">Test Results</h3>
                {codeResult && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    codeResult.passed ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {passedCount}/{totalTests} passed
                  </span>
                )}
              </div>
              {!codeResult ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Terminal className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground/60">Run your code to see results</p>
                </div>
              ) : renderTestResults()}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex-1 min-h-0">
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
                  renderLineHighlight: "all",
                  lineNumbersMinChars: 3,
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  automaticLayout: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: true,
                  },
                  wordBasedSuggestions: "currentDocument",
                  parameterHints: { enabled: true },
                  acceptSuggestionOnCommitCharacter: true,
                  tabCompletion: "on",
                  suggest: {
                    showKeywords: true,
                    showSnippets: true,
                    showFunctions: true,
                    showVariables: true,
                    showClasses: true,
                    showModules: true,
                    preview: true,
                  },
                  inlineSuggest: { enabled: true },
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  autoSurround: "languageDefined",
                  formatOnPaste: true,
                  matchBrackets: "always",
                  guides: {
                    bracketPairs: true,
                    indentation: true,
                  },
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
                Reset Code
              </Button>
              <Button 
                className="rounded-xl font-bold bg-success hover:bg-success/90 text-success-foreground px-6 h-9 text-sm shadow-lg shadow-success/20 hover:shadow-success/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                onClick={handleCodeSubmit}
                disabled={codeMutation.isPending}
              >
                {codeMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 mr-1.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    Run Tests
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile layout with tabs */}
        <div className="flex md:hidden flex-col h-[calc(100vh-4rem)] bg-background">
          <div className="flex border-b border-border/50 bg-card">
            {([
              { key: 'instructions' as const, label: 'Instructions', icon: FileText },
              { key: 'editor' as const, label: 'Code', icon: Code2 },
              { key: 'results' as const, label: 'Results', icon: Terminal },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors relative ${
                  mobileTab === tab.key ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.key === 'results' && codeResult && (
                  <span className={`w-2 h-2 rounded-full ${codeResult.passed ? 'bg-success' : 'bg-destructive'}`} />
                )}
                {mobileTab === tab.key && (
                  <motion.div layoutId="mobileTab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {mobileTab === 'instructions' && (
              <div className="h-full overflow-y-auto p-4">
                <h2 className="text-lg font-display font-bold mb-3">{lesson.title}</h2>
                <div className="prose prose-sm dark:prose-invert prose-headings:font-display prose-pre:rounded-xl">
                  <ReactMarkdown>{chal.instructions}</ReactMarkdown>
                </div>
                {chal.hints && chal.hints.length > 0 && (
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={() => setShowHints(!showHints)} className="rounded-xl text-xs font-semibold border-accent/30 text-accent">
                      <Lightbulb className="w-3.5 h-3.5 mr-1.5" /> {showHints ? "Hide" : "Hints"}
                    </Button>
                    {showHints && (
                      <div className="mt-2 space-y-2">
                        {chal.hints.map((hint: string, i: number) => (
                          <div key={i} className="p-3 bg-accent/5 border border-accent/10 rounded-xl text-sm">
                            <span className="font-semibold text-accent text-xs">Hint {i+1}:</span> {hint}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {mobileTab === 'editor' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    language={chal.language.toLowerCase()}
                    theme={isDark ? "vs-dark" : "vs"}
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      padding: { top: 12, bottom: 12 },
                      scrollBeyondLastLine: false,
                      lineNumbersMinChars: 3,
                      folding: false,
                      automaticLayout: true,
                      wordWrap: "on",
                    }}
                  />
                </div>
              </div>
            )}
            {mobileTab === 'results' && (
              <div className="h-full overflow-y-auto p-4">
                {!codeResult ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Terminal className="w-12 h-12 text-muted-foreground/20 mb-3" />
                    <p className="text-muted-foreground font-medium">No results yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Run your code to see test results</p>
                  </div>
                ) : renderTestResults()}
              </div>
            )}
          </div>

          <div className="h-14 border-t border-border/50 bg-card flex items-center justify-between px-4">
            <Button variant="ghost" size="sm" onClick={() => setCode(chal.starterCode)} className="text-muted-foreground text-xs rounded-lg">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
            <Button 
              className="rounded-xl font-bold bg-success hover:bg-success/90 text-success-foreground px-5 h-9 text-sm"
              onClick={handleCodeSubmit}
              disabled={codeMutation.isPending}
            >
              {codeMutation.isPending ? "Running..." : "Run Tests"}
              <Play className="w-3.5 h-3.5 ml-1.5 fill-current" />
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-16 border-b border-border/50 flex items-center px-5 justify-between bg-card z-10 relative">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              if (lesson.courseId) {
                setLocation(`/courses/${lesson.courseId}`);
              } else {
                setLocation('/courses');
              }
            }} className="rounded-xl hover:bg-muted">
              <X className="w-5 h-5" />
            </Button>
            <div className="flex-1 max-w-xs">
              <Progress value={progressValue} className="h-2 rounded-full bg-muted" indicatorClassName="bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] transition-all duration-700" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted-foreground font-medium">{lesson.title}</span>
            <div className="flex items-center gap-1.5 font-bold text-sm text-accent bg-accent/8 px-3.5 py-1.5 rounded-full border border-accent/15">
              <Star className="w-4 h-4 fill-current" />
              <span>{lesson.xpReward} XP</span>
            </div>
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
