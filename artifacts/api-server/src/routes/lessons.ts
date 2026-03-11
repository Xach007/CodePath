import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  lessonsTable, modulesTable, quizQuestionsTable, quizOptionsTable,
  codingChallengesTable, testCasesTable, userLessonProgressTable,
  userCourseEnrollmentsTable, coursesTable,
} from "@workspace/db";
import { eq, and, asc, lt, gt } from "drizzle-orm";
import {
  GetLessonParams,
  GetLessonResponse,
  CompleteLessonParams,
  CompleteLessonResponse,
  SubmitQuizParams,
  SubmitQuizBody,
  SubmitQuizResponse,
  SubmitCodeParams,
  SubmitCodeBody,
  SubmitCodeResponse,
} from "@workspace/api-zod";
import { authMiddleware, getAuthUserId } from "../lib/auth";
import { awardXP, updateStreak, checkAndUnlockAchievements } from "../lib/gamification";
import { runPythonCode } from "../lib/codeRunner";

const router: IRouter = Router();

async function isLessonCompleted(userId: number, lessonId: number): Promise<boolean> {
  const result = await db.select().from(userLessonProgressTable)
    .where(and(
      eq(userLessonProgressTable.userId, userId),
      eq(userLessonProgressTable.lessonId, lessonId),
    ));
  return result.length > 0;
}

async function isLessonUnlocked(userId: number, lesson: { id: number; moduleId: number; orderIndex: number }): Promise<boolean> {
  if (lesson.orderIndex === 0) return true;

  const prevLessons = await db.select().from(lessonsTable)
    .where(and(
      eq(lessonsTable.moduleId, lesson.moduleId),
      lt(lessonsTable.orderIndex, lesson.orderIndex),
    ))
    .orderBy(asc(lessonsTable.orderIndex));

  if (prevLessons.length === 0) return true;

  const prevLesson = prevLessons[prevLessons.length - 1];
  return isLessonCompleted(userId, prevLesson.id);
}

router.get("/lessons/:lessonId", authMiddleware, async (req, res): Promise<void> => {
  const params = GetLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const userId = getAuthUserId(req);
  const [lesson] = await db.select().from(lessonsTable)
    .where(eq(lessonsTable.id, params.data.lessonId));

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const isCompleted = await isLessonCompleted(userId, lesson.id);
  const isUnlocked = await isLessonUnlocked(userId, lesson);

  const allModuleLessons = await db.select().from(lessonsTable)
    .where(eq(lessonsTable.moduleId, lesson.moduleId))
    .orderBy(asc(lessonsTable.orderIndex));

  const currentIndex = allModuleLessons.findIndex(l => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allModuleLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allModuleLessons.length - 1 ? allModuleLessons[currentIndex + 1] : null;

  let quizQuestions: any[] = [];
  let codingChallenge = null;

  if (lesson.type === "quiz") {
    const questions = await db.select().from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.lessonId, lesson.id))
      .orderBy(asc(quizQuestionsTable.orderIndex));

    quizQuestions = await Promise.all(questions.map(async (q) => {
      const options = await db.select().from(quizOptionsTable)
        .where(eq(quizOptionsTable.questionId, q.id))
        .orderBy(asc(quizOptionsTable.orderIndex));
      return {
        id: q.id,
        question: q.question,
        explanation: q.explanation,
        options: options.map(o => ({ id: o.id, text: o.text })),
      };
    }));
  }

  if (lesson.type === "challenge") {
    const [challenge] = await db.select().from(codingChallengesTable)
      .where(eq(codingChallengesTable.lessonId, lesson.id));
    if (challenge) {
      codingChallenge = {
        id: challenge.id,
        instructions: challenge.instructions,
        starterCode: challenge.starterCode,
        language: challenge.language,
        hints: challenge.hints,
      };
    }
  }

  res.json(GetLessonResponse.parse({
    id: lesson.id,
    moduleId: lesson.moduleId,
    title: lesson.title,
    type: lesson.type,
    orderIndex: lesson.orderIndex,
    xpReward: lesson.xpReward,
    estimatedMinutes: lesson.estimatedMinutes,
    content: lesson.content,
    quizQuestions,
    codingChallenge,
    nextLessonId: nextLesson?.id ?? null,
    prevLessonId: prevLesson?.id ?? null,
    isCompleted,
    isUnlocked,
  }));
});

router.post("/lessons/:lessonId/complete", authMiddleware, async (req, res): Promise<void> => {
  const params = CompleteLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const userId = getAuthUserId(req);
  const lessonId = params.data.lessonId;

  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const alreadyDone = await isLessonCompleted(userId, lessonId);
  let xpEarned = 0;

  if (!alreadyDone) {
    await db.insert(userLessonProgressTable).values({
      userId,
      lessonId,
      xpEarned: lesson.xpReward,
    });
    xpEarned = lesson.xpReward;
    await awardXP(userId, xpEarned);
    await ensureCourseEnrollment(userId, lesson.moduleId);
  }

  const streakResult = await updateStreak(userId);
  const newAchievements = await checkAndUnlockAchievements(userId);

  res.json(CompleteLessonResponse.parse({
    success: true,
    xpEarned,
    newAchievements,
    streakUpdated: streakResult.updated,
    currentStreak: streakResult.currentStreak,
  }));
});

router.post("/lessons/:lessonId/submit-quiz", authMiddleware, async (req, res): Promise<void> => {
  const params = SubmitQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const body = SubmitQuizBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userId = getAuthUserId(req);
  const lessonId = params.data.lessonId;
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const questions = await db.select().from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.lessonId, lessonId));

  const results = [];
  let correctCount = 0;

  for (const question of questions) {
    const options = await db.select().from(quizOptionsTable)
      .where(eq(quizOptionsTable.questionId, question.id));
    const correctOption = options.find(o => o.isCorrect);
    const userAnswer = body.data.answers.find(a => a.questionId === question.id);

    const isCorrect = userAnswer?.optionId === correctOption?.id;
    if (isCorrect) correctCount++;

    results.push({
      questionId: question.id,
      correct: isCorrect,
      correctOptionId: correctOption?.id ?? 0,
      explanation: question.explanation,
    });
  }

  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = score >= 70;
  let xpEarned = 0;
  let newAchievements: any[] = [];

  if (passed) {
    const alreadyDone = await isLessonCompleted(userId, lessonId);
    if (!alreadyDone) {
      xpEarned = lesson.xpReward;
      await db.insert(userLessonProgressTable).values({
        userId,
        lessonId,
        xpEarned,
      });
      await awardXP(userId, xpEarned);
      await ensureCourseEnrollment(userId, lesson.moduleId);
      await updateStreak(userId);
      newAchievements = await checkAndUnlockAchievements(userId);
    }
  }

  res.json(SubmitQuizResponse.parse({
    passed,
    score,
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    xpEarned,
    results,
    newAchievements,
  }));
});

router.post("/lessons/:lessonId/submit-code", authMiddleware, async (req, res): Promise<void> => {
  const params = SubmitCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const body = SubmitCodeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userId = getAuthUserId(req);
  const lessonId = params.data.lessonId;

  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const [challenge] = await db.select().from(codingChallengesTable)
    .where(eq(codingChallengesTable.lessonId, lessonId));
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const testCases = await db.select().from(testCasesTable)
    .where(eq(testCasesTable.challengeId, challenge.id))
    .orderBy(asc(testCasesTable.orderIndex));

  const runResult = await runPythonCode(body.data.code, testCases.map(tc => ({
    name: tc.name,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  })));

  let xpEarned = 0;
  let newAchievements: any[] = [];

  if (runResult.passed) {
    const alreadyDone = await isLessonCompleted(userId, lessonId);
    if (!alreadyDone) {
      xpEarned = lesson.xpReward;
      await db.insert(userLessonProgressTable).values({
        userId,
        lessonId,
        xpEarned,
      });
      await awardXP(userId, xpEarned);
      await ensureCourseEnrollment(userId, lesson.moduleId);
      await updateStreak(userId);
      newAchievements = await checkAndUnlockAchievements(userId);
    }
  }

  res.json(SubmitCodeResponse.parse({
    passed: runResult.passed,
    xpEarned,
    testResults: runResult.testResults,
    output: runResult.output,
    errorMessage: runResult.errorMessage,
    newAchievements,
  }));
});

async function ensureCourseEnrollment(userId: number, moduleId: number): Promise<void> {
  const [mod] = await db.select().from(modulesTable).where(eq(modulesTable.id, moduleId));
  if (!mod) return;

  const existing = await db.select().from(userCourseEnrollmentsTable)
    .where(and(
      eq(userCourseEnrollmentsTable.userId, userId),
      eq(userCourseEnrollmentsTable.courseId, mod.courseId),
    ));

  if (existing.length === 0) {
    await db.insert(userCourseEnrollmentsTable).values({
      userId,
      courseId: mod.courseId,
    });
  }
}

export default router;
