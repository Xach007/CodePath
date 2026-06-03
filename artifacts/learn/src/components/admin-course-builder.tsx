import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Code2,
  Edit3,
  FileText,
  HelpCircle,
  Image,
  Plus,
  Power,
  PowerOff,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateCourseTitle, translateModuleTitle } from "@/lib/course-i18n";

type AdminFetch = (path: string, opts?: RequestInit) => Promise<Response>;
type LessonType = "theory" | "quiz" | "challenge";

type CourseSummary = {
  id: number;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  imageUrl?: string | null;
  totalLessons: number;
  estimatedHours: number;
  xpReward: number;
  isPublished: boolean;
};

type QuizOption = {
  id?: number;
  text: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  id?: number;
  question: string;
  explanation: string;
  options: QuizOption[];
};

type TestCase = {
  id?: number;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: number | boolean;
};

type ChallengeData = {
  id?: number;
  instructions: string;
  starterCode: string;
  language: string;
  hints: string[];
  testCases: TestCase[];
};

type BuilderLesson = {
  id?: number;
  title: string;
  type: LessonType;
  xpReward: number;
  estimatedMinutes: number;
  content: string;
  quizData: QuizQuestion[];
  challengeData: ChallengeData | null;
};

type BuilderModule = {
  id?: number;
  title: string;
  description: string;
  lessons: BuilderLesson[];
};

type BuilderCourse = {
  id?: number;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  imageUrl: string;
  totalLessons: number;
  estimatedHours: number;
  xpReward: number;
  isPublished: boolean;
  modules: BuilderModule[];
};

const languages = ["python", "javascript", "html", "css", "sql", "cpp", "java"];
const difficulties = ["beginner", "intermediate", "advanced"];
const lessonTypes: { value: LessonType; labelKey: string; icon: typeof FileText }[] = [
  { value: "theory", labelKey: "admin.builder.lessonTypes.theory", icon: FileText },
  { value: "quiz", labelKey: "admin.builder.lessonTypes.quiz", icon: HelpCircle },
  { value: "challenge", labelKey: "admin.builder.lessonTypes.challenge", icon: Code2 },
];

function emptyQuestion(): QuizQuestion {
  return {
    question: "",
    explanation: "",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ],
  };
}

function emptyChallenge(language = "python"): ChallengeData {
  return {
    instructions: "",
    starterCode: "",
    language,
    hints: [],
    testCases: [
      { name: "Correct output", input: "", expectedOutput: "", isHidden: 0 },
    ],
  };
}

function emptyLesson(type: LessonType, language = "python"): BuilderLesson {
  return {
    title: type === "challenge" ? "New Sandbox" : type === "quiz" ? "New Quiz" : "New Theory",
    type,
    xpReward: type === "theory" ? 10 : 15,
    estimatedMinutes: type === "challenge" ? 15 : 5,
    content: "",
    quizData: type === "quiz" ? [emptyQuestion()] : [],
    challengeData: type === "challenge" ? emptyChallenge(language) : null,
  };
}

function emptyModule(): BuilderModule {
  return {
    title: "New Module",
    description: "",
    lessons: [],
  };
}

function emptyCourse(): BuilderCourse {
  return {
    title: "",
    description: "",
    language: "python",
    difficulty: "beginner",
    imageUrl: "",
    totalLessons: 0,
    estimatedHours: 1,
    xpReward: 100,
    isPublished: false,
    modules: [emptyModule()],
  };
}

function normalizeCourse(raw: any): BuilderCourse {
  return {
    id: raw.id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    language: raw.language ?? "python",
    difficulty: raw.difficulty ?? "beginner",
    imageUrl: raw.imageUrl ?? "",
    totalLessons: raw.totalLessons ?? 0,
    estimatedHours: raw.estimatedHours ?? 1,
    xpReward: raw.xpReward ?? 100,
    isPublished: Boolean(raw.isPublished),
    modules: (raw.modules ?? []).map((mod: any) => ({
      id: mod.id,
      title: mod.title ?? "",
      description: mod.description ?? "",
      lessons: (mod.lessons ?? []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title ?? "",
        type: lesson.type === "quiz" || lesson.type === "challenge" ? lesson.type : "theory",
        xpReward: lesson.xpReward ?? 10,
        estimatedMinutes: lesson.estimatedMinutes ?? 5,
        content: lesson.content ?? "",
        quizData: (lesson.quizData ?? []).map((question: any) => ({
          id: question.id,
          question: question.question ?? "",
          explanation: question.explanation ?? "",
          options: (question.options ?? []).map((option: any) => ({
            id: option.id,
            text: option.text ?? "",
            isCorrect: Boolean(option.isCorrect),
          })),
        })),
        challengeData: lesson.challengeData
          ? {
              id: lesson.challengeData.id,
              instructions: lesson.challengeData.instructions ?? "",
              starterCode: lesson.challengeData.starterCode ?? "",
              language: lesson.challengeData.language ?? raw.language ?? "python",
              hints: lesson.challengeData.hints ?? [],
              testCases: (lesson.challengeData.testCases ?? []).map((testCase: any) => ({
                id: testCase.id,
                name: testCase.name ?? "",
                input: testCase.input ?? "",
                expectedOutput: testCase.expectedOutput ?? "",
                isHidden: testCase.isHidden ?? 0,
              })),
            }
          : null,
      })),
    })),
  };
}

function lessonIcon(type: LessonType) {
  if (type === "quiz") return HelpCircle;
  if (type === "challenge") return Code2;
  return FileText;
}

function textAreaHints(hints: string[]) {
  return hints.join("\n");
}

function parseHints(value: string) {
  return value.split("\n").map((hint) => hint.trim()).filter(Boolean);
}

function fieldClass(className = "") {
  return `w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 ${className}`;
}

function smallButtonClass(tone: "primary" | "ghost" | "danger" | "success" = "ghost") {
  const tones = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500",
    ghost: "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
    danger: "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
  };
  return `inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${tones[tone]}`;
}

function getComputedTotalLessons(course: BuilderCourse) {
  return course.modules.reduce((total, mod) => total + mod.lessons.length, 0);
}

function getCourseSnapshot(course: BuilderCourse) {
  return JSON.stringify({
    ...course,
    imageUrl: course.imageUrl.trim() || null,
    totalLessons: getComputedTotalLessons(course),
  });
}

export default function AdminCourseBuilder({ adminFetch }: { adminFetch: AdminFetch }) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [course, setCourse] = useState<BuilderCourse | null>(null);
  const [savedCourseSnapshot, setSavedCourseSnapshot] = useState("");
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "warning">("success");
  const [error, setError] = useState("");

  const totalLessons = useMemo(() => (
    course?.modules.reduce((total, mod) => total + mod.lessons.length, 0) ?? 0
  ), [course]);

  useEffect(() => {
    if (!status) return;
    const timeout = window.setTimeout(() => setStatus(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const createEmptyChallenge = useCallback((language = "python"): ChallengeData => ({
    ...emptyChallenge(language),
    testCases: [
      { name: t("admin.builder.correctOutput"), input: "", expectedOutput: "", isHidden: 0 },
    ],
  }), [t]);

  const createEmptyLesson = useCallback((type: LessonType, language = "python"): BuilderLesson => ({
    ...emptyLesson(type, language),
    title: t(`admin.builder.defaultLessons.${type}`),
    challengeData: type === "challenge" ? createEmptyChallenge(language) : null,
  }), [createEmptyChallenge, t]);

  const createEmptyModule = useCallback((): BuilderModule => ({
    ...emptyModule(),
    title: t("admin.builder.defaultModule"),
  }), [t]);

  const createEmptyCourse = useCallback((): BuilderCourse => ({
    ...emptyCourse(),
    modules: [createEmptyModule()],
  }), [createEmptyModule]);

  const difficultyLabel = useCallback((difficulty: string) => (
    t(`admin.builder.difficulties.${difficulty}`, { defaultValue: difficulty })
  ), [t]);

  const displayCourseTitle = useCallback((title: string) => translateCourseTitle(t, title), [t]);
  const displayModuleTitle = useCallback((title: string) => translateModuleTitle(t, title), [t]);
  const statusClassName = statusTone === "warning"
    ? "border-amber-500/35 bg-amber-500/10 text-amber-200"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

  const loadCourses = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await adminFetch("/admin/courses");
      setCourses(await res.json());
    } finally {
      setLoadingList(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadCourses().catch(() => setError(t("admin.builder.errors.loadCourses")));
  }, [loadCourses, t]);

  useEffect(() => {
    if (!course) return;
    if (selectedModuleIndex === null) return;
    if (selectedModuleIndex >= course.modules.length) {
      setSelectedModuleIndex(course.modules.length > 0 ? course.modules.length - 1 : null);
    }
  }, [course, selectedModuleIndex]);

  const loadCourse = async (id: number) => {
    setError("");
    setStatus("");
    setLoadingCourse(true);
    try {
      const res = await adminFetch(`/admin/courses/${id}/builder`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("admin.builder.errors.openCourse"));
      const normalizedCourse = normalizeCourse(data);
      setCourse(normalizedCourse);
      setSavedCourseSnapshot(getCourseSnapshot(normalizedCourse));
      setSelectedModuleIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.builder.errors.openCourse"));
    } finally {
      setLoadingCourse(false);
    }
  };

  const updateCourse = (updates: Partial<BuilderCourse>) => {
    setCourse((current) => current ? { ...current, ...updates } : current);
  };

  const updateModule = (moduleIndex: number, updates: Partial<BuilderModule>) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, index) => (
        index === moduleIndex ? { ...mod, ...updates } : mod
      ));
      return { ...current, modules };
    });
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, updates: Partial<BuilderLesson>) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, modIndex) => {
        if (modIndex !== moduleIndex) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((lesson, index) => (
            index === lessonIndex ? { ...lesson, ...updates } : lesson
          )),
        };
      });
      return { ...current, modules };
    });
  };

  const updateQuestion = (
    moduleIndex: number,
    lessonIndex: number,
    questionIndex: number,
    updates: Partial<QuizQuestion>,
  ) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, modIndex) => {
        if (modIndex !== moduleIndex) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((lesson, index) => {
            if (index !== lessonIndex) return lesson;
            return {
              ...lesson,
              quizData: lesson.quizData.map((question, qIndex) => (
                qIndex === questionIndex ? { ...question, ...updates } : question
              )),
            };
          }),
        };
      });
      return { ...current, modules };
    });
  };

  const updateOption = (
    moduleIndex: number,
    lessonIndex: number,
    questionIndex: number,
    optionIndex: number,
    updates: Partial<QuizOption>,
  ) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, modIndex) => {
        if (modIndex !== moduleIndex) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((lesson, index) => {
            if (index !== lessonIndex) return lesson;
            return {
              ...lesson,
              quizData: lesson.quizData.map((question, qIndex) => {
                if (qIndex !== questionIndex) return question;
                return {
                  ...question,
                  options: question.options.map((option, optIndex) => (
                    optIndex === optionIndex ? { ...option, ...updates } : option
                  )),
                };
              }),
            };
          }),
        };
      });
      return { ...current, modules };
    });
  };

  const markCorrectOption = (
    moduleIndex: number,
    lessonIndex: number,
    questionIndex: number,
    optionIndex: number,
  ) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, modIndex) => {
        if (modIndex !== moduleIndex) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((lesson, index) => {
            if (index !== lessonIndex) return lesson;
            return {
              ...lesson,
              quizData: lesson.quizData.map((question, qIndex) => {
                if (qIndex !== questionIndex) return question;
                return {
                  ...question,
                  options: question.options.map((option, optIndex) => ({
                    ...option,
                    isCorrect: optIndex === optionIndex,
                  })),
                };
              }),
            };
          }),
        };
      });
      return { ...current, modules };
    });
  };

  const updateChallenge = (
    moduleIndex: number,
    lessonIndex: number,
    updates: Partial<ChallengeData>,
  ) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, modIndex) => {
        if (modIndex !== moduleIndex) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((lesson, index) => {
            if (index !== lessonIndex) return lesson;
            return {
              ...lesson,
              challengeData: { ...(lesson.challengeData ?? createEmptyChallenge(current.language)), ...updates },
            };
          }),
        };
      });
      return { ...current, modules };
    });
  };

  const updateTestCase = (
    moduleIndex: number,
    lessonIndex: number,
    testIndex: number,
    updates: Partial<TestCase>,
  ) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, modIndex) => {
        if (modIndex !== moduleIndex) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((lesson, index) => {
            if (index !== lessonIndex || !lesson.challengeData) return lesson;
            return {
              ...lesson,
              challengeData: {
                ...lesson.challengeData,
                testCases: lesson.challengeData.testCases.map((testCase, tcIndex) => (
                  tcIndex === testIndex ? { ...testCase, ...updates } : testCase
                )),
              },
            };
          }),
        };
      });
      return { ...current, modules };
    });
  };

  const addModule = () => {
    const nextIndex = course?.modules.length ?? 0;
    setCourse((current) => {
      if (!current) return current;
      return { ...current, modules: [...current.modules, createEmptyModule()] };
    });
    setSelectedModuleIndex(nextIndex);
  };

  const removeModule = (moduleIndex: number) => {
    const nextModuleCount = Math.max(0, (course?.modules.length ?? 0) - 1);
    setCourse((current) => {
      if (!current) return current;
      return { ...current, modules: current.modules.filter((_, index) => index !== moduleIndex) };
    });
    setSelectedModuleIndex((selected) => {
      if (nextModuleCount === 0 || selected === null) return null;
      if (selected > moduleIndex) return selected - 1;
      if (selected >= nextModuleCount) return nextModuleCount - 1;
      return selected;
    });
  };

  const addLesson = (moduleIndex: number, type: LessonType) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, index) => (
        index === moduleIndex
          ? { ...mod, lessons: [...mod.lessons, createEmptyLesson(type, current.language)] }
          : mod
      ));
      return { ...current, modules };
    });
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setCourse((current) => {
      if (!current) return current;
      const modules = current.modules.map((mod, index) => (
        index === moduleIndex
          ? { ...mod, lessons: mod.lessons.filter((_, itemIndex) => itemIndex !== lessonIndex) }
          : mod
      ));
      return { ...current, modules };
    });
  };

  const setLessonType = (moduleIndex: number, lessonIndex: number, type: LessonType) => {
    const currentCourse = course;
    if (!currentCourse) return;
    const lesson = currentCourse.modules[moduleIndex]?.lessons[lessonIndex];
    if (!lesson) return;

    updateLesson(moduleIndex, lessonIndex, {
      type,
      quizData: type === "quiz" ? (lesson.quizData.length ? lesson.quizData : [emptyQuestion()]) : [],
      challengeData: type === "challenge" ? (lesson.challengeData ?? createEmptyChallenge(currentCourse.language)) : null,
    });
  };

  const addQuestion = (moduleIndex: number, lessonIndex: number) => {
    const lesson = course?.modules[moduleIndex]?.lessons[lessonIndex];
    updateLesson(moduleIndex, lessonIndex, {
      quizData: [...(lesson?.quizData ?? []), emptyQuestion()],
    });
  };

  const removeQuestion = (moduleIndex: number, lessonIndex: number, questionIndex: number) => {
    const lesson = course?.modules[moduleIndex]?.lessons[lessonIndex];
    updateLesson(moduleIndex, lessonIndex, {
      quizData: (lesson?.quizData ?? []).filter((_, index) => index !== questionIndex),
    });
  };

  const addOption = (moduleIndex: number, lessonIndex: number, questionIndex: number) => {
    const question = course?.modules[moduleIndex]?.lessons[lessonIndex]?.quizData[questionIndex];
    updateQuestion(moduleIndex, lessonIndex, questionIndex, {
      options: [...(question?.options ?? []), { text: "", isCorrect: false }],
    });
  };

  const removeOption = (
    moduleIndex: number,
    lessonIndex: number,
    questionIndex: number,
    optionIndex: number,
  ) => {
    const question = course?.modules[moduleIndex]?.lessons[lessonIndex]?.quizData[questionIndex];
    const nextOptions = (question?.options ?? []).filter((_, index) => index !== optionIndex);
    if (nextOptions.length > 0 && !nextOptions.some((option) => option.isCorrect)) {
      nextOptions[0] = { ...nextOptions[0], isCorrect: true };
    }
    updateQuestion(moduleIndex, lessonIndex, questionIndex, { options: nextOptions });
  };

  const addTestCase = (moduleIndex: number, lessonIndex: number) => {
    const challenge = course?.modules[moduleIndex]?.lessons[lessonIndex]?.challengeData;
    updateChallenge(moduleIndex, lessonIndex, {
      testCases: [
        ...(challenge?.testCases ?? []),
        { name: t("admin.builder.testNumber", { count: (challenge?.testCases.length ?? 0) + 1 }), input: "", expectedOutput: "", isHidden: 0 },
      ],
    });
  };

  const removeTestCase = (moduleIndex: number, lessonIndex: number, testIndex: number) => {
    const challenge = course?.modules[moduleIndex]?.lessons[lessonIndex]?.challengeData;
    updateChallenge(moduleIndex, lessonIndex, {
      testCases: (challenge?.testCases ?? []).filter((_, index) => index !== testIndex),
    });
  };

  const toggleCourseActive = async (summary: CourseSummary) => {
    setError("");
    try {
      await adminFetch(`/admin/courses/${summary.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: !summary.isPublished }),
      });
      if (course?.id === summary.id) {
        const nextCourse = { ...course, isPublished: !summary.isPublished };
        setCourse(nextCourse);
        setSavedCourseSnapshot(getCourseSnapshot(nextCourse));
      }
      await loadCourses();
    } catch {
      setError(t("admin.builder.errors.updateStatus"));
    }
  };

  const deleteCourse = async (summary: CourseSummary) => {
    if (!confirm(t("admin.builder.confirmDelete", { title: displayCourseTitle(summary.title) }))) return;
    setError("");
    try {
      await adminFetch(`/admin/courses/${summary.id}`, { method: "DELETE" });
      if (course?.id === summary.id) {
        setCourse(null);
        setSavedCourseSnapshot("");
      }
      await loadCourses();
    } catch {
      setError(t("admin.builder.errors.deleteCourse"));
    }
  };

  const saveCourse = async () => {
    if (!course) return;

    const currentSnapshot = getCourseSnapshot(course);
    if (savedCourseSnapshot && currentSnapshot === savedCourseSnapshot) {
      setError("");
      setStatusTone("warning");
      setStatus(t("admin.builder.notEdited"));
      return;
    }

    setSaving(true);
    setError("");
    setStatus("");

    try {
      const payload = {
        ...course,
        imageUrl: course.imageUrl.trim() || null,
        totalLessons,
      };
      const res = await adminFetch(
        course.id ? `/admin/courses/${course.id}/builder` : "/admin/courses/builder",
        {
          method: course.id ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("admin.builder.errors.saveCourse"));

      const normalizedCourse = normalizeCourse(data);
      setCourse(normalizedCourse);
      setSavedCourseSnapshot(getCourseSnapshot(normalizedCourse));
      setStatusTone("success");
      setStatus(t("admin.builder.saved"));
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.builder.errors.saveCourse"));
    } finally {
      setSaving(false);
    }
  };

  const renderQuiz = (lesson: BuilderLesson, moduleIndex: number, lessonIndex: number) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("admin.builder.quizQuestions")}</div>
        <button type="button" onClick={() => addQuestion(moduleIndex, lessonIndex)} className={smallButtonClass("ghost")}>
          <Plus className="h-3.5 w-3.5" /> {t("admin.builder.question")}
        </button>
      </div>

      {lesson.quizData.map((question, questionIndex) => (
        <div key={`${question.id ?? "new"}-${questionIndex}`} className="rounded-lg border border-white/10 bg-black/15 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">{t("admin.builder.questionNumber", { number: questionIndex + 1 })}</div>
            <button type="button" onClick={() => removeQuestion(moduleIndex, lessonIndex, questionIndex)} className={smallButtonClass("danger")}>
              <Trash2 className="h-3.5 w-3.5" /> {t("admin.builder.remove")}
            </button>
          </div>
          <input
            value={question.question}
            onChange={(event) => updateQuestion(moduleIndex, lessonIndex, questionIndex, { question: event.target.value })}
            placeholder={t("admin.builder.questionText")}
            className={fieldClass("mb-2")}
          />
          <textarea
            value={question.explanation}
            onChange={(event) => updateQuestion(moduleIndex, lessonIndex, questionIndex, { explanation: event.target.value })}
            placeholder={t("admin.builder.explanationAfterAnswer")}
            className={fieldClass("mb-3 min-h-16 resize-y")}
          />

          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={`${option.id ?? "new"}-${optionIndex}`} className="grid grid-cols-[32px_minmax(0,1fr)_36px] items-center gap-2">
                <input
                  type="radio"
                  checked={option.isCorrect}
                  onChange={() => markCorrectOption(moduleIndex, lessonIndex, questionIndex, optionIndex)}
                  className="h-4 w-4 accent-emerald-500"
                  title={t("admin.builder.correctAnswer")}
                />
                <input
                  value={option.text}
                  onChange={(event) => updateOption(moduleIndex, lessonIndex, questionIndex, optionIndex, { text: event.target.value })}
                  placeholder={t("admin.builder.answerNumber", { number: optionIndex + 1 })}
                  className={fieldClass()}
                />
                <button type="button" onClick={() => removeOption(moduleIndex, lessonIndex, questionIndex, optionIndex)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-red-500/10 hover:text-red-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => addOption(moduleIndex, lessonIndex, questionIndex)} className={`${smallButtonClass("ghost")} mt-3`}>
            <Plus className="h-3.5 w-3.5" /> {t("admin.builder.answer")}
          </button>
        </div>
      ))}

      {lesson.quizData.length === 0 && (
        <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/40">{t("admin.builder.noQuestions")}</div>
      )}
    </div>
  );

  const renderChallenge = (lesson: BuilderLesson, moduleIndex: number, lessonIndex: number) => {
    const challenge = lesson.challengeData ?? createEmptyChallenge(course?.language);

    return (
      <div className="space-y-3">
        <textarea
          value={challenge.instructions}
          onChange={(event) => updateChallenge(moduleIndex, lessonIndex, { instructions: event.target.value })}
          placeholder={t("admin.builder.sandboxInstructions")}
          className={fieldClass("min-h-32 resize-y font-mono")}
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
          <select
            value={challenge.language}
            onChange={(event) => updateChallenge(moduleIndex, lessonIndex, { language: event.target.value })}
            className={fieldClass()}
          >
            {languages.map((language) => <option key={language} value={language}>{language}</option>)}
          </select>
          <textarea
            value={challenge.starterCode}
            onChange={(event) => updateChallenge(moduleIndex, lessonIndex, { starterCode: event.target.value })}
            placeholder={t("admin.builder.starterCode")}
            className={fieldClass("min-h-28 resize-y font-mono")}
          />
        </div>
        <textarea
          value={textAreaHints(challenge.hints)}
          onChange={(event) => updateChallenge(moduleIndex, lessonIndex, { hints: parseHints(event.target.value) })}
          placeholder={t("admin.builder.hintsOnePerLine")}
          className={fieldClass("min-h-20 resize-y")}
        />

        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("admin.builder.testCases")}</div>
          <button type="button" onClick={() => addTestCase(moduleIndex, lessonIndex)} className={smallButtonClass("ghost")}>
            <Plus className="h-3.5 w-3.5" /> {t("admin.builder.test")}
          </button>
        </div>

        <div className="space-y-2">
          {challenge.testCases.map((testCase, testIndex) => (
            <div key={`${testCase.id ?? "new"}-${testIndex}`} className="rounded-lg border border-white/10 bg-black/15 p-3">
              <div className="mb-2 grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <input
                  value={testCase.name}
                  onChange={(event) => updateTestCase(moduleIndex, lessonIndex, testIndex, { name: event.target.value })}
                  placeholder={t("admin.builder.testName")}
                  className={fieldClass()}
                />
                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={Boolean(testCase.isHidden)}
                    onChange={(event) => updateTestCase(moduleIndex, lessonIndex, testIndex, { isHidden: event.target.checked ? 1 : 0 })}
                    className="accent-indigo-500"
                  />
                  {t("admin.builder.hidden")}
                </label>
                <button type="button" onClick={() => removeTestCase(moduleIndex, lessonIndex, testIndex)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                <textarea
                  value={testCase.input}
                  onChange={(event) => updateTestCase(moduleIndex, lessonIndex, testIndex, { input: event.target.value })}
                  placeholder={t("admin.builder.input")}
                  className={fieldClass("min-h-20 resize-y font-mono")}
                />
                <textarea
                  value={testCase.expectedOutput}
                  onChange={(event) => updateTestCase(moduleIndex, lessonIndex, testIndex, { expectedOutput: event.target.value })}
                  placeholder={t("admin.builder.expectedOutput")}
                  className={fieldClass("min-h-20 resize-y font-mono")}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLesson = (lesson: BuilderLesson, moduleIndex: number, lessonIndex: number) => {
    const Icon = lessonIcon(lesson.type);

    return (
      <div key={`${lesson.id ?? "new"}-${lessonIndex}`} className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-200">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <input
                value={lesson.title}
                onChange={(event) => updateLesson(moduleIndex, lessonIndex, { title: event.target.value })}
                placeholder={t("admin.builder.lessonTitle")}
                className={fieldClass("font-semibold")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 2xl:grid-cols-[150px_90px_110px_92px]">
            <select
              value={lesson.type}
              onChange={(event) => setLessonType(moduleIndex, lessonIndex, event.target.value as LessonType)}
              className={fieldClass()}
            >
              {lessonTypes.map((item) => <option key={item.value} value={item.value}>{t(item.labelKey)}</option>)}
            </select>
            <input
              type="number"
              min={0}
              value={lesson.xpReward}
              onChange={(event) => updateLesson(moduleIndex, lessonIndex, { xpReward: Number(event.target.value) || 0 })}
              className={fieldClass()}
              title={t("admin.builder.xpReward")}
            />
            <input
              type="number"
              min={1}
              value={lesson.estimatedMinutes}
              onChange={(event) => updateLesson(moduleIndex, lessonIndex, { estimatedMinutes: Number(event.target.value) || 1 })}
              className={fieldClass()}
              title={t("admin.builder.minutes")}
            />
            <button type="button" onClick={() => removeLesson(moduleIndex, lessonIndex)} className={smallButtonClass("danger")}>
              <Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}
            </button>
          </div>
        </div>

        {lesson.type === "theory" && (
          <textarea
            value={lesson.content}
            onChange={(event) => updateLesson(moduleIndex, lessonIndex, { content: event.target.value })}
            placeholder={t("admin.builder.theoryContent")}
            className={fieldClass("min-h-40 resize-y font-mono")}
          />
        )}

        {lesson.type === "quiz" && renderQuiz(lesson, moduleIndex, lessonIndex)}
        {lesson.type === "challenge" && renderChallenge(lesson, moduleIndex, lessonIndex)}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t("admin.builder.title")}</h2>
          <p className="mt-1 text-sm text-white/45">{t("admin.builder.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const newCourse = createEmptyCourse();
              setCourse(newCourse);
              setSavedCourseSnapshot(getCourseSnapshot(newCourse));
              setSelectedModuleIndex(null);
              setError("");
              setStatus("");
            }}
            className={smallButtonClass("primary")}
          >
            <Plus className="h-4 w-4" /> {t("admin.builder.newCourse")}
          </button>
          {course && (
            <button type="button" onClick={saveCourse} disabled={saving} className={smallButtonClass("success")}>
              <Save className="h-4 w-4" /> {saving ? t("admin.builder.saving") : t("admin.builder.saveCourse")}
            </button>
          )}
        </div>
      </div>

      {(error || status) && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-300" : statusClassName}`}>
          {error || status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-white/10 bg-white/5 md:sticky md:top-6 md:self-start">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold text-white">{t("admin.builder.allCourses")}</div>
            {loadingList && <div className="text-xs text-white/35">{t("common.loading")}</div>}
          </div>
          <div className="max-h-[36vh] overflow-y-auto p-2 md:max-h-[calc(100vh-14rem)]">
            {courses.map((summary) => (
              <div key={summary.id} className={`mb-2 rounded-lg border p-3 transition ${course?.id === summary.id ? "border-indigo-400/40 bg-indigo-500/10" : "border-white/10 bg-black/10 hover:bg-white/5"}`}>
                <button type="button" onClick={() => loadCourse(summary.id)} className="block w-full text-left">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-white">{displayCourseTitle(summary.title)}</span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${summary.isPublished ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/45"}`}>
                      {summary.isPublished ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                      {summary.isPublished ? t("admin.builder.active") : t("admin.builder.inactive")}
                    </span>
                  </div>
                  <div className="text-xs text-white/40">{summary.language} / {difficultyLabel(summary.difficulty)} / {t("admin.builder.lessonsCount", { count: summary.totalLessons })}</div>
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => toggleCourseActive(summary)} className={smallButtonClass("ghost")}>
                    {summary.isPublished ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                    {summary.isPublished ? t("admin.builder.disable") : t("admin.builder.enable")}
                  </button>
                  <button type="button" onClick={() => deleteCourse(summary)} className={smallButtonClass("danger")}>
                    <Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}
                  </button>
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-white/35">{t("admin.builder.noCourses")}</div>
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {loadingCourse && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-white/45">{t("admin.builder.openingCourse")}</div>
          )}

          {!loadingCourse && !course && (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-10 text-center">
              <Edit3 className="mx-auto mb-3 h-8 w-8 text-white/30" />
              <div className="text-lg font-semibold text-white">{t("admin.builder.chooseCourse")}</div>
              <p className="mt-1 text-sm text-white/40">{t("admin.builder.editorWillAppear")}</p>
            </div>
          )}

          {!loadingCourse && course && (
            <div className="space-y-5">
              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-wide text-white/40">{t("admin.builder.courseSettings")}</div>
                    <h3 className="mt-1 text-2xl font-bold text-white">{course.title || t("admin.builder.untitledCourse")}</h3>
                  </div>
                  <label className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${course.isPublished ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-white/55"}`}>
                    <input
                      type="checkbox"
                      checked={course.isPublished}
                      onChange={(event) => updateCourse({ isPublished: event.target.checked })}
                      className="accent-emerald-500"
                    />
                    {course.isPublished ? t("admin.builder.active") : t("admin.builder.inactive")}
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/20">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title || t("admin.builder.courseImageAlt")} className="h-full w-full object-cover" />
                    ) : (
                      <Image className="h-10 w-10 text-white/25" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <input value={course.title} onChange={(event) => updateCourse({ title: event.target.value })} placeholder={t("admin.builder.courseTitle")} className={fieldClass()} />
                    <input value={course.imageUrl} onChange={(event) => updateCourse({ imageUrl: event.target.value })} placeholder={t("admin.builder.imageUrl")} className={fieldClass()} />
                    <select value={course.language} onChange={(event) => updateCourse({ language: event.target.value })} className={fieldClass()}>
                      {languages.map((language) => <option key={language} value={language}>{language}</option>)}
                    </select>
                    <select value={course.difficulty} onChange={(event) => updateCourse({ difficulty: event.target.value })} className={fieldClass()}>
                      {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficultyLabel(difficulty)}</option>)}
                    </select>
                    <input type="number" min={1} value={course.estimatedHours} onChange={(event) => updateCourse({ estimatedHours: Number(event.target.value) || 1 })} className={fieldClass()} title={t("admin.builder.estimatedHours")} />
                    <input type="number" min={0} value={course.xpReward} onChange={(event) => updateCourse({ xpReward: Number(event.target.value) || 0 })} className={fieldClass()} title={t("admin.builder.xpReward")} />
                    <textarea value={course.description} onChange={(event) => updateCourse({ description: event.target.value })} placeholder={t("admin.builder.description")} className={fieldClass("min-h-24 resize-y lg:col-span-2")} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/45">
                  <span className="rounded-lg bg-white/5 px-3 py-1.5">{t("admin.builder.lessonsCount", { count: totalLessons })}</span>
                  <span className="rounded-lg bg-white/5 px-3 py-1.5">{t("admin.builder.modulesCount", { count: course.modules.length })}</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.04]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <h3 className="text-sm font-bold text-white">{t("admin.builder.modules")}</h3>
                  <button type="button" onClick={addModule} className={smallButtonClass("primary")}>
                    <Plus className="h-3.5 w-3.5" /> {t("admin.builder.add")}
                  </button>
                </div>
                <div className="max-h-[68vh] space-y-2 overflow-y-auto p-2">
                  {course.modules.map((mod, moduleIndex) => {
                    const isSelected = selectedModuleIndex === moduleIndex;

                    return (
                      <div
                        key={`${mod.id ?? "new"}-${moduleIndex}`}
                        className={`rounded-lg border transition ${
                          isSelected ? "border-indigo-400/50 bg-indigo-500/15" : "border-white/10 bg-black/10"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedModuleIndex(isSelected ? null : moduleIndex)}
                          className="block w-full p-3 text-left hover:bg-white/5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("admin.builder.moduleNumber", { number: moduleIndex + 1 })}</span>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/50">{mod.lessons.length}</span>
                          </div>
                          <div className="mt-1 truncate text-sm font-semibold text-white">{mod.title ? displayModuleTitle(mod.title) : t("admin.builder.untitledModule")}</div>
                        </button>

                        {isSelected && (
                          <div className="border-t border-white/10 p-4">
                            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">{t("admin.builder.editModuleNumber", { number: moduleIndex + 1 })}</div>
                                <div className="grid grid-cols-1 gap-3">
                                  <input
                                    value={mod.title}
                                    onChange={(event) => updateModule(moduleIndex, { title: event.target.value })}
                                    placeholder={t("admin.builder.moduleTitle")}
                                    className={fieldClass("font-semibold")}
                                  />
                                  <input
                                    value={mod.description}
                                    onChange={(event) => updateModule(moduleIndex, { description: event.target.value })}
                                    placeholder={t("admin.builder.moduleDescription")}
                                    className={fieldClass()}
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => removeModule(moduleIndex)} className={smallButtonClass("danger")}>
                                <Trash2 className="h-3.5 w-3.5" /> {t("admin.builder.deleteModule")}
                              </button>
                            </div>

                            <div className="mb-4 rounded-lg border border-white/10 bg-black/15 p-3">
                              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">{t("admin.builder.addLessonToModule")}</div>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => addLesson(moduleIndex, "theory")} className={smallButtonClass("ghost")}>
                                  <FileText className="h-3.5 w-3.5" /> {t("admin.builder.addTheory")}
                                </button>
                                <button type="button" onClick={() => addLesson(moduleIndex, "quiz")} className={smallButtonClass("ghost")}>
                                  <HelpCircle className="h-3.5 w-3.5" /> {t("admin.builder.addQuiz")}
                                </button>
                                <button type="button" onClick={() => addLesson(moduleIndex, "challenge")} className={smallButtonClass("ghost")}>
                                  <Code2 className="h-3.5 w-3.5" /> {t("admin.builder.addSandbox")}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {mod.lessons.map((lesson, lessonIndex) => renderLesson(lesson, moduleIndex, lessonIndex))}
                              {mod.lessons.length === 0 && (
                                <div className="rounded-lg border border-dashed border-white/15 p-5 text-center text-sm text-white/35">
                                  {t("admin.builder.emptyLessons")}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {course.modules.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-white/35">{t("admin.builder.emptyModules")}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
