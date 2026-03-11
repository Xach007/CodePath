import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  userXPTable,
  userStreaksTable,
  coursesTable,
  modulesTable,
  lessonsTable,
  quizQuestionsTable,
  quizOptionsTable,
  codingChallengesTable,
  testCasesTable,
  achievementsTable,
  userAchievementsTable,
  userLessonProgressTable,
  userCourseEnrollmentsTable,
} from "@workspace/db";
import { eq, desc, asc, count } from "drizzle-orm";
import { adminMiddleware } from "../lib/adminAuth";
import { hashPassword, generateToken } from "../lib/auth";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || user.passwordHash !== passwordHash || !user.isAdmin) {
    res.status(401).json({ error: "Invalid credentials or not an admin" });
    return;
  }

  const token = generateToken(user.id);
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
    },
    token,
  });
});

// ── DASHBOARD STATS ──
router.get("/admin/stats", adminMiddleware, async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ value: count() }).from(usersTable);
  const [courseCount] = await db.select({ value: count() }).from(coursesTable);
  const [lessonCount] = await db.select({ value: count() }).from(lessonsTable);
  const [moduleCount] = await db.select({ value: count() }).from(modulesTable);
  const [achievementCount] = await db.select({ value: count() }).from(achievementsTable);
  const [enrollmentCount] = await db.select({ value: count() }).from(userCourseEnrollmentsTable);

  res.json({
    users: userCount.value,
    courses: courseCount.value,
    lessons: lessonCount.value,
    modules: moduleCount.value,
    achievements: achievementCount.value,
    enrollments: enrollmentCount.value,
  });
});

// ── USERS ──
router.get("/admin/users", adminMiddleware, async (_req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    email: usersTable.email,
    displayName: usersTable.displayName,
    isAdmin: usersTable.isAdmin,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(asc(usersTable.id));

  const usersWithXP = await Promise.all(users.map(async (u) => {
    const [xp] = await db.select().from(userXPTable).where(eq(userXPTable.userId, u.id));
    return { ...u, totalXP: xp?.totalXP ?? 0, currentLevel: xp?.currentLevel ?? 1 };
  }));

  res.json(usersWithXP);
});

router.delete("/admin/users/:id", adminMiddleware, async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id);

  await db.delete(userAchievementsTable).where(eq(userAchievementsTable.userId, userId));
  await db.delete(userLessonProgressTable).where(eq(userLessonProgressTable.userId, userId));
  await db.delete(userCourseEnrollmentsTable).where(eq(userCourseEnrollmentsTable.userId, userId));
  await db.delete(userXPTable).where(eq(userXPTable.userId, userId));
  await db.delete(userStreaksTable).where(eq(userStreaksTable.userId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  res.json({ success: true });
});

router.patch("/admin/users/:id", adminMiddleware, async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id);
  const { username, email, displayName, isAdmin, password } = req.body;

  const updates: any = {};
  if (username !== undefined) updates.username = username;
  if (email !== undefined) updates.email = email;
  if (displayName !== undefined) updates.displayName = displayName;
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;
  if (password) updates.passwordHash = hashPassword(password);

  if (Object.keys(updates).length > 0) {
    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json(user);
});

// ── COURSES ──
router.get("/admin/courses", adminMiddleware, async (_req, res): Promise<void> => {
  const courses = await db.select().from(coursesTable).orderBy(asc(coursesTable.id));
  res.json(courses);
});

router.post("/admin/courses", adminMiddleware, async (req, res): Promise<void> => {
  const { title, description, language, difficulty, imageUrl, totalLessons, estimatedHours, xpReward, isPublished } = req.body;
  const [course] = await db.insert(coursesTable).values({
    title, description, language, difficulty, imageUrl,
    totalLessons: totalLessons ?? 0,
    estimatedHours: estimatedHours ?? 1,
    xpReward: xpReward ?? 100,
    isPublished: isPublished ?? false,
  }).returning();
  res.status(201).json(course);
});

router.patch("/admin/courses/:id", adminMiddleware, async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.id);
  const updates: any = {};
  const fields = ["title", "description", "language", "difficulty", "imageUrl", "totalLessons", "estimatedHours", "xpReward", "isPublished"];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) {
    await db.update(coursesTable).set(updates).where(eq(coursesTable.id, courseId));
  }
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  res.json(course);
});

async function deleteLessonData(lessonId: number) {
  const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.lessonId, lessonId));
  for (const q of questions) {
    await db.delete(quizOptionsTable).where(eq(quizOptionsTable.questionId, q.id));
  }
  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.lessonId, lessonId));
  const [challenge] = await db.select().from(codingChallengesTable).where(eq(codingChallengesTable.lessonId, lessonId));
  if (challenge) {
    await db.delete(testCasesTable).where(eq(testCasesTable.challengeId, challenge.id));
    await db.delete(codingChallengesTable).where(eq(codingChallengesTable.id, challenge.id));
  }
  await db.delete(userLessonProgressTable).where(eq(userLessonProgressTable.lessonId, lessonId));
}

router.delete("/admin/courses/:id", adminMiddleware, async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.id);
  const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, courseId));
  for (const mod of modules) {
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, mod.id));
    for (const lesson of lessons) {
      await deleteLessonData(lesson.id);
    }
    await db.delete(lessonsTable).where(eq(lessonsTable.moduleId, mod.id));
  }
  await db.delete(modulesTable).where(eq(modulesTable.courseId, courseId));
  await db.delete(userCourseEnrollmentsTable).where(eq(userCourseEnrollmentsTable.courseId, courseId));
  await db.delete(coursesTable).where(eq(coursesTable.id, courseId));
  res.json({ success: true });
});

// ── MODULES ──
router.get("/admin/courses/:courseId/modules", adminMiddleware, async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.courseId);
  const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, courseId)).orderBy(asc(modulesTable.orderIndex));
  res.json(modules);
});

router.post("/admin/modules", adminMiddleware, async (req, res): Promise<void> => {
  const { courseId, title, description, orderIndex } = req.body;
  const [mod] = await db.insert(modulesTable).values({
    courseId, title, description: description ?? "", orderIndex: orderIndex ?? 0,
  }).returning();
  res.status(201).json(mod);
});

router.patch("/admin/modules/:id", adminMiddleware, async (req, res): Promise<void> => {
  const modId = parseInt(req.params.id);
  const updates: any = {};
  for (const f of ["title", "description", "orderIndex", "courseId"]) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) {
    await db.update(modulesTable).set(updates).where(eq(modulesTable.id, modId));
  }
  const [mod] = await db.select().from(modulesTable).where(eq(modulesTable.id, modId));
  res.json(mod);
});

router.delete("/admin/modules/:id", adminMiddleware, async (req, res): Promise<void> => {
  const modId = parseInt(req.params.id);
  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, modId));
  for (const lesson of lessons) {
    await deleteLessonData(lesson.id);
  }
  await db.delete(lessonsTable).where(eq(lessonsTable.moduleId, modId));
  await db.delete(modulesTable).where(eq(modulesTable.id, modId));
  res.json({ success: true });
});

// ── LESSONS ──
router.get("/admin/modules/:moduleId/lessons", adminMiddleware, async (req, res): Promise<void> => {
  const moduleId = parseInt(req.params.moduleId);
  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, moduleId)).orderBy(asc(lessonsTable.orderIndex));
  res.json(lessons);
});

router.get("/admin/lessons/:id", adminMiddleware, async (req, res): Promise<void> => {
  const lessonId = parseInt(req.params.id);
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }

  let quizData = null;
  let challengeData = null;

  if (lesson.type === "quiz") {
    const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.lessonId, lessonId)).orderBy(asc(quizQuestionsTable.orderIndex));
    const questionsWithOptions = await Promise.all(questions.map(async (q) => {
      const options = await db.select().from(quizOptionsTable).where(eq(quizOptionsTable.questionId, q.id)).orderBy(asc(quizOptionsTable.orderIndex));
      return { ...q, options };
    }));
    quizData = questionsWithOptions;
  }

  if (lesson.type === "challenge") {
    const [challenge] = await db.select().from(codingChallengesTable).where(eq(codingChallengesTable.lessonId, lessonId));
    if (challenge) {
      const testCases = await db.select().from(testCasesTable).where(eq(testCasesTable.challengeId, challenge.id)).orderBy(asc(testCasesTable.orderIndex));
      challengeData = { ...challenge, testCases };
    }
  }

  res.json({ ...lesson, quizData, challengeData });
});

router.post("/admin/lessons", adminMiddleware, async (req, res): Promise<void> => {
  const { moduleId, title, type, orderIndex, xpReward, estimatedMinutes, content } = req.body;
  const [lesson] = await db.insert(lessonsTable).values({
    moduleId, title, type: type ?? "theory", orderIndex: orderIndex ?? 0,
    xpReward: xpReward ?? 10, estimatedMinutes: estimatedMinutes ?? 5, content,
  }).returning();
  res.status(201).json(lesson);
});

router.patch("/admin/lessons/:id", adminMiddleware, async (req, res): Promise<void> => {
  const lessonId = parseInt(req.params.id);
  const updates: any = {};
  for (const f of ["title", "type", "orderIndex", "xpReward", "estimatedMinutes", "content", "moduleId"]) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) {
    await db.update(lessonsTable).set(updates).where(eq(lessonsTable.id, lessonId));
  }
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
  res.json(lesson);
});

router.delete("/admin/lessons/:id", adminMiddleware, async (req, res): Promise<void> => {
  const lessonId = parseInt(req.params.id);
  await deleteLessonData(lessonId);
  await db.delete(lessonsTable).where(eq(lessonsTable.id, lessonId));
  res.json({ success: true });
});

// ── QUIZ QUESTIONS ──
router.post("/admin/quiz-questions", adminMiddleware, async (req, res): Promise<void> => {
  const { lessonId, question, explanation, orderIndex } = req.body;
  const [q] = await db.insert(quizQuestionsTable).values({
    lessonId, question, explanation, orderIndex: orderIndex ?? 0,
  }).returning();
  res.status(201).json(q);
});

router.patch("/admin/quiz-questions/:id", adminMiddleware, async (req, res): Promise<void> => {
  const qId = parseInt(req.params.id);
  const updates: any = {};
  for (const f of ["question", "explanation", "orderIndex"]) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) {
    await db.update(quizQuestionsTable).set(updates).where(eq(quizQuestionsTable.id, qId));
  }
  const [q] = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.id, qId));
  res.json(q);
});

router.delete("/admin/quiz-questions/:id", adminMiddleware, async (req, res): Promise<void> => {
  const qId = parseInt(req.params.id);
  await db.delete(quizOptionsTable).where(eq(quizOptionsTable.questionId, qId));
  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.id, qId));
  res.json({ success: true });
});

// ── QUIZ OPTIONS ──
router.post("/admin/quiz-options", adminMiddleware, async (req, res): Promise<void> => {
  const { questionId, text, isCorrect, orderIndex } = req.body;
  const [opt] = await db.insert(quizOptionsTable).values({
    questionId, text, isCorrect: isCorrect ?? false, orderIndex: orderIndex ?? 0,
  }).returning();
  res.status(201).json(opt);
});

router.patch("/admin/quiz-options/:id", adminMiddleware, async (req, res): Promise<void> => {
  const optId = parseInt(req.params.id);
  const updates: any = {};
  for (const f of ["text", "isCorrect", "orderIndex"]) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) {
    await db.update(quizOptionsTable).set(updates).where(eq(quizOptionsTable.id, optId));
  }
  const [opt] = await db.select().from(quizOptionsTable).where(eq(quizOptionsTable.id, optId));
  res.json(opt);
});

router.delete("/admin/quiz-options/:id", adminMiddleware, async (req, res): Promise<void> => {
  const optId = parseInt(req.params.id);
  await db.delete(quizOptionsTable).where(eq(quizOptionsTable.id, optId));
  res.json({ success: true });
});

// ── CODING CHALLENGES ──
router.post("/admin/coding-challenges", adminMiddleware, async (req, res): Promise<void> => {
  const { lessonId, instructions, starterCode, language, hints } = req.body;
  const [ch] = await db.insert(codingChallengesTable).values({
    lessonId, instructions, starterCode: starterCode ?? "", language: language ?? "python", hints: hints ?? [],
  }).returning();
  res.status(201).json(ch);
});

router.patch("/admin/coding-challenges/:id", adminMiddleware, async (req, res): Promise<void> => {
  const chId = parseInt(req.params.id);
  const updates: any = {};
  for (const f of ["instructions", "starterCode", "language", "hints"]) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) {
    await db.update(codingChallengesTable).set(updates).where(eq(codingChallengesTable.id, chId));
  }
  const [ch] = await db.select().from(codingChallengesTable).where(eq(codingChallengesTable.id, chId));
  res.json(ch);
});

router.delete("/admin/coding-challenges/:id", adminMiddleware, async (req, res): Promise<void> => {
  const chId = parseInt(req.params.id);
  await db.delete(testCasesTable).where(eq(testCasesTable.challengeId, chId));
  await db.delete(codingChallengesTable).where(eq(codingChallengesTable.id, chId));
  res.json({ success: true });
});

// ── TEST CASES ──
router.post("/admin/test-cases", adminMiddleware, async (req, res): Promise<void> => {
  const { challengeId, name, input, expectedOutput, isHidden, orderIndex } = req.body;
  const [tc] = await db.insert(testCasesTable).values({
    challengeId, name, input: input ?? "", expectedOutput, isHidden: isHidden ?? 0, orderIndex: orderIndex ?? 0,
  }).returning();
  res.status(201).json(tc);
});

router.patch("/admin/test-cases/:id", adminMiddleware, async (req, res): Promise<void> => {
  const tcId = parseInt(req.params.id);
  const updates: any = {};
  for (const f of ["name", "input", "expectedOutput", "isHidden", "orderIndex"]) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) {
    await db.update(testCasesTable).set(updates).where(eq(testCasesTable.id, tcId));
  }
  const [tc] = await db.select().from(testCasesTable).where(eq(testCasesTable.id, tcId));
  res.json(tc);
});

router.delete("/admin/test-cases/:id", adminMiddleware, async (req, res): Promise<void> => {
  const tcId = parseInt(req.params.id);
  await db.delete(testCasesTable).where(eq(testCasesTable.id, tcId));
  res.json({ success: true });
});

// ── ACHIEVEMENTS ──
router.get("/admin/achievements", adminMiddleware, async (_req, res): Promise<void> => {
  const achievements = await db.select().from(achievementsTable).orderBy(asc(achievementsTable.id));
  res.json(achievements);
});

router.post("/admin/achievements", adminMiddleware, async (req, res): Promise<void> => {
  const { key, title, description, icon, xpReward } = req.body;
  const [ach] = await db.insert(achievementsTable).values({
    key, title, description, icon, xpReward: xpReward ?? 0,
  }).returning();
  res.status(201).json(ach);
});

router.patch("/admin/achievements/:id", adminMiddleware, async (req, res): Promise<void> => {
  const achId = parseInt(req.params.id);
  const updates: any = {};
  for (const f of ["key", "title", "description", "icon", "xpReward"]) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) {
    await db.update(achievementsTable).set(updates).where(eq(achievementsTable.id, achId));
  }
  const [ach] = await db.select().from(achievementsTable).where(eq(achievementsTable.id, achId));
  res.json(ach);
});

router.delete("/admin/achievements/:id", adminMiddleware, async (req, res): Promise<void> => {
  const achId = parseInt(req.params.id);
  await db.delete(userAchievementsTable).where(eq(userAchievementsTable.achievementId, achId));
  await db.delete(achievementsTable).where(eq(achievementsTable.id, achId));
  res.json({ success: true });
});

export default router;
