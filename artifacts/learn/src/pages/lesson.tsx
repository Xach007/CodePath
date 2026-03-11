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
import { X, Play, CheckCircle2, XCircle, ArrowRight, Lightbulb, Trophy, Star, ChevronLeft } from "lucide-react";
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

  useEffect(() => {
    // Reset state on lesson change
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
        <div className="h-16 border-b flex items-center px-4"><Skeleton className="h-4 w-full max-w-md" /></div>
        <div className="flex-1 p-8"><Skeleton className="h-full w-full rounded-2xl" /></div>
      </div>
    );
  }

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#10b981', '#f59e0b']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#10b981', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleSuccess = (xp: number, achievements: any[]) => {
    triggerConfetti();
    setRewardData({ xp, achievements });
    setShowSuccessOverlay(true);
    // Invalidate progress to update nav badges
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
        data: {
          answers: [{ questionId: lesson.quizQuestions[0].id, optionId: selectedOption }]
        }
      });
      setQuizResult(res);
      setQuizState('submitted');
      if (res.passed) {
        handleSuccess(res.xpEarned, res.newAchievements);
      }
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
        toast.error("Tests failed. Keep trying!");
      }
    } catch (err) {
      toast.error("Execution error");
    }
  };

  const handleNext = () => {
    if (lesson.nextLessonId) {
      setLocation(`/lessons/${lesson.nextLessonId}`);
    } else {
      setLocation(`/courses/${lesson.moduleId}`); // Fallback
    }
  };

  // UI Components per type
  const renderTheory = () => (
    <div className="max-w-3xl mx-auto py-12 px-4 md:px-8 pb-32">
      <h1 className="text-4xl font-display font-bold mb-8">{lesson.title}</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {lesson.content || ""}
        </ReactMarkdown>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex justify-center">
        <Button 
          size="lg" 
          className="w-full max-w-md rounded-xl h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform" 
          onClick={handleTheoryComplete}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? "Saving..." : "Complete & Continue"}
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
        <div className="flex-1">
          <h2 className="text-3xl font-display font-bold mb-8">{question.question}</h2>
          
          <div className="space-y-4">
            {question.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isSubmitted = quizState === 'submitted';
              const correctOptionId = quizResult?.results?.[0]?.correctOptionId;
              
              let btnClass = "border-2 bg-card hover:bg-muted text-left justify-start h-auto py-6 px-6 text-lg rounded-2xl w-full transition-all";
              
              if (isSubmitted) {
                if (opt.id === correctOptionId) {
                  btnClass = "border-2 border-success bg-success/10 text-success text-left justify-start h-auto py-6 px-6 text-lg rounded-2xl w-full";
                } else if (isSelected && !isCorrect) {
                  btnClass = "border-2 border-destructive bg-destructive/10 text-destructive text-left justify-start h-auto py-6 px-6 text-lg rounded-2xl w-full";
                } else {
                  btnClass = "border-2 opacity-50 bg-card text-left justify-start h-auto py-6 px-6 text-lg rounded-2xl w-full";
                }
              } else if (isSelected) {
                btnClass = "border-2 border-primary bg-primary/10 text-primary text-left justify-start h-auto py-6 px-6 text-lg rounded-2xl w-full shadow-md";
              }

              return (
                <Button 
                  key={opt.id}
                  variant="outline"
                  className={btnClass}
                  onClick={() => !isSubmitted && setSelectedOption(opt.id)}
                  disabled={isSubmitted}
                >
                  <span className="flex-1 whitespace-normal leading-tight">{opt.text}</span>
                  {isSubmitted && opt.id === correctOptionId && <CheckCircle2 className="w-6 h-6 shrink-0" />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle className="w-6 h-6 shrink-0" />}
                </Button>
              );
            })}
          </div>

          {isSubmitted && quizResult?.results?.[0]?.explanation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-8 p-6 rounded-2xl ${isCorrect ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}
            >
              <h4 className={`font-bold mb-2 flex items-center gap-2 ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                {isCorrect ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                {isCorrect ? "Correct!" : "Not quite."}
              </h4>
              <p className="text-foreground">{quizResult.results[0].explanation}</p>
            </motion.div>
          )}
        </div>

        <div className="pt-8 flex border-t border-border mt-8">
          {!isSubmitted ? (
            <Button 
              size="lg" 
              className="w-full rounded-xl h-14 text-lg font-bold" 
              disabled={!selectedOption || quizMutation.isPending}
              onClick={handleQuizSubmit}
            >
              {quizMutation.isPending ? "Checking..." : "Check Answer"}
            </Button>
          ) : (
            <Button 
              size="lg" 
              className={`w-full rounded-xl h-14 text-lg font-bold ${!isCorrect ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
              onClick={isCorrect ? () => {} : () => { setQuizState('idle'); setSelectedOption(null); setQuizResult(null); }}
              // If correct, the success overlay handles navigation. If incorrect, this button resets.
              style={{ display: isCorrect ? 'none' : 'flex' }} 
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderChallenge = () => {
    const chal = lesson.codingChallenge;
    if (!chal) return null;

    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-background">
        {/* Left Panel: Instructions */}
        <div className="w-full md:w-1/3 xl:w-1/4 border-r border-border flex flex-col bg-card">
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-2xl font-display font-bold mb-6">{lesson.title}</h2>
            <div className="prose prose-sm dark:prose-invert">
              <ReactMarkdown>{chal.instructions}</ReactMarkdown>
            </div>
            
            {chal.hints && chal.hints.length > 0 && (
              <div className="mt-8">
                <Button variant="outline" size="sm" onClick={() => setShowHints(!showHints)} className="rounded-lg text-primary border-primary/30 bg-primary/5">
                  <Lightbulb className="w-4 h-4 mr-2" /> {showHints ? "Hide Hints" : "Show Hints"}
                </Button>
                {showHints && (
                  <div className="mt-4 space-y-3">
                    {chal.hints.map((hint, i) => (
                      <div key={i} className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-sm">
                        <span className="font-bold text-accent">Hint {i+1}:</span> {hint}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Test Results Area */}
          <div className="h-1/3 border-t border-border bg-muted/30 p-4 overflow-y-auto">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">Test Results</h3>
            {!codeResult ? (
              <p className="text-sm text-muted-foreground italic">Run your code to see results.</p>
            ) : (
              <div className="space-y-2">
                {codeResult.testResults.map((t: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${t.passed ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                    {t.passed ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                    <div className="text-sm">
                      <p className="font-bold">{t.name}</p>
                      {!t.passed && (
                        <div className="mt-1 text-xs font-mono bg-background/50 p-2 rounded">
                          <span className="text-muted-foreground">Expected:</span> {t.expected}<br/>
                          <span className="text-destructive">Actual:</span> {t.actual}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              language={chal.language.toLowerCase()}
              theme="vs-dark" // Forces a dark theme for the editor to look pro
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                padding: { top: 24 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth"
              }}
            />
          </div>
          <div className="h-16 border-t border-border bg-card flex items-center justify-between px-6">
            <Button variant="ghost" onClick={() => setCode(chal.starterCode)} className="text-muted-foreground">
              Reset Code
            </Button>
            <Button 
              size="lg" 
              className="rounded-xl font-bold bg-success hover:bg-success/90 text-success-foreground px-8"
              onClick={handleCodeSubmit}
              disabled={codeMutation.isPending}
            >
              {codeMutation.isPending ? "Running..." : "Run Tests"}
              <Play className="w-4 h-4 ml-2 fill-current" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Minimal Header */}
        <header className="h-16 border-b border-border flex items-center px-4 justify-between bg-card z-10 relative">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <X className="w-5 h-5" />
            </Button>
            <Progress value={0} className="w-32 md:w-64 h-2 rounded-full" />
          </div>
          <div className="flex items-center gap-2 font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
            <Star className="w-4 h-4 fill-current" />
            <span>{lesson.xpReward} XP</span>
          </div>
        </header>

        {lesson.type === 'theory' && renderTheory()}
        {lesson.type === 'quiz' && renderQuiz()}
        {lesson.type === 'challenge' && renderChallenge()}
      </div>

      {/* Success Fullscreen Overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="max-w-md w-full bg-card border border-border p-8 rounded-3xl shadow-2xl text-center"
            >
              <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <h2 className="text-4xl font-display font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-success to-primary">
                Lesson Complete!
              </h2>
              <p className="text-lg text-muted-foreground mb-8">Great job! You're making progress.</p>
              
              <div className="flex items-center justify-center gap-4 mb-8 bg-accent/10 p-4 rounded-2xl border border-accent/20">
                <Star className="w-8 h-8 text-accent fill-current" />
                <span className="text-3xl font-bold text-accent">+{rewardData.xp} XP</span>
              </div>

              {rewardData.achievements && rewardData.achievements.length > 0 && (
                <div className="mb-8 text-left bg-muted p-4 rounded-2xl">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> New Achievement!
                  </h4>
                  {rewardData.achievements.map((ach: any) => (
                    <div key={ach.id} className="flex items-center gap-3">
                      <span className="text-3xl">{ach.icon}</span>
                      <div>
                        <p className="font-bold">{ach.title}</p>
                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full rounded-xl h-14 text-xl font-bold shadow-xl shadow-primary/20"
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
