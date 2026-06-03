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
  supportMessagesTable,
  userNotificationsTable,
} from "@workspace/db";
import { and, eq, desc, asc, count, inArray } from "drizzle-orm";
import { adminMiddleware } from "../lib/adminAuth";
import { hashPassword, generateToken } from "../lib/auth";
import { awardXP, calculateLevel, checkAndUnlockAchievements } from "../lib/gamification";
import { ensureSupportMessagesTable } from "../lib/supportMessages";
import { ensureUserNotificationsTable } from "../lib/notifications";

const router: IRouter = Router();

type AdminQuizOptionInput = {
  id?: number;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
};

type AdminQuizQuestionInput = {
  id?: number;
  question: string;
  explanation: string | null;
  orderIndex: number;
  options: AdminQuizOptionInput[];
};

type AdminTestCaseInput = {
  id?: number;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: number;
  orderIndex: number;
};

type AdminChallengeInput = {
  id?: number;
  instructions: string;
  starterCode: string;
  language: string;
  hints: string[];
  testCases: AdminTestCaseInput[];
};

type AdminLessonInput = {
  id?: number;
  title: string;
  type: "theory" | "quiz" | "challenge";
  orderIndex: number;
  xpReward: number;
  estimatedMinutes: number;
  content: string | null;
  quizData: AdminQuizQuestionInput[];
  challengeData: AdminChallengeInput | null;
};

type AdminModuleInput = {
  id?: number;
  title: string;
  description: string;
  orderIndex: number;
  lessons: AdminLessonInput[];
};

type AdminCourseInput = {
  title: string;
  description: string;
  language: string;
  difficulty: string;
  imageUrl: string | null;
  estimatedHours: number;
  xpReward: number;
  isPublished: boolean;
};

type AdminCourseBuilderInput = {
  course: AdminCourseInput;
  modules: AdminModuleInput[];
  totalLessons: number;
};

type AdminActivityLesson = {
  id: number;
  title: string;
  type: string;
  orderIndex: number;
  moduleId: number;
  moduleTitle: string;
  moduleOrderIndex: number;
  xpReward: number;
};

type AdminActivityProgress = {
  lessonId: number;
  completedAt: Date;
  xpEarned: number;
};

type AdminActivityEnrollment = {
  courseId: number;
  startedAt: Date;
  completedAt: Date | null;
};

type AdminActivityAchievement = {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
};

type AdminActivityUserAchievement = {
  achievementId: number;
  unlockedAt: Date;
};

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function asRouteNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return Number.parseInt(raw ?? "", 10);
}

function dateToIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

async function ensureUserExists(userId: number): Promise<boolean> {
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId));
  return Boolean(user);
}

async function recalculateUserXP(userId: number) {
  const [lessonProgress, userAchievements, allAchievements] = await Promise.all([
    db.select().from(userLessonProgressTable).where(eq(userLessonProgressTable.userId, userId)),
    db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId)),
    db.select().from(achievementsTable),
  ]);

  const unlockedIds = new Set(userAchievements.map((achievement) => achievement.achievementId));
  const lessonXP = lessonProgress.reduce((total, progress) => total + (progress.xpEarned ?? 0), 0);
  const achievementXP = allAchievements.reduce((total, achievement) => (
    unlockedIds.has(achievement.id) ? total + achievement.xpReward : total
  ), 0);
  const totalXP = lessonXP + achievementXP;
  const currentLevel = calculateLevel(totalXP);

  const [existing] = await db.select().from(userXPTable).where(eq(userXPTable.userId, userId));
  if (existing) {
    await db.update(userXPTable)
      .set({ totalXP, currentLevel })
      .where(eq(userXPTable.userId, userId));
  } else {
    await db.insert(userXPTable).values({ userId, totalXP, currentLevel });
  }

  return { totalXP, currentLevel };
}

async function ensureCourseEnrollment(userId: number, courseId: number) {
  const [existing] = await db.select().from(userCourseEnrollmentsTable).where(and(
    eq(userCourseEnrollmentsTable.userId, userId),
    eq(userCourseEnrollmentsTable.courseId, courseId),
  ));

  if (!existing) {
    await db.insert(userCourseEnrollmentsTable).values({ userId, courseId });
  }
}

async function getLessonContext(lessonId: number) {
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
  if (!lesson) return null;

  const [courseModule] = await db.select().from(modulesTable).where(eq(modulesTable.id, lesson.moduleId));
  if (!courseModule) return null;

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseModule.courseId));
  if (!course) return null;

  return { lesson, courseModule, course };
}

async function syncCourseCompletion(userId: number, courseId: number) {
  const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, courseId));
  const lessons: any[] = [];

  for (const courseModule of modules) {
    const moduleLessons = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, courseModule.id));
    lessons.push(...moduleLessons);
  }

  if (lessons.length === 0) {
    await db.update(userCourseEnrollmentsTable)
      .set({ completedAt: null })
      .where(and(
        eq(userCourseEnrollmentsTable.userId, userId),
        eq(userCourseEnrollmentsTable.courseId, courseId),
      ));
    return;
  }

  const completedProgress = await db.select().from(userLessonProgressTable).where(and(
    eq(userLessonProgressTable.userId, userId),
    inArray(userLessonProgressTable.lessonId, lessons.map((lesson) => lesson.id)),
  ));
  const completedLessonIds = new Set(completedProgress.map((progress) => progress.lessonId));
  const isComplete = lessons.every((lesson) => completedLessonIds.has(lesson.id));

  await db.update(userCourseEnrollmentsTable)
    .set({ completedAt: isComplete ? new Date() : null })
    .where(and(
      eq(userCourseEnrollmentsTable.userId, userId),
      eq(userCourseEnrollmentsTable.courseId, courseId),
    ));
}

async function completeLessonsForUser(userId: number, lessonIds: number[]) {
  let xpEarned = 0;
  let addedLessons = 0;
  const affectedCourseIds = new Set<number>();

  for (const lessonId of lessonIds) {
    const context = await getLessonContext(lessonId);
    if (!context) continue;

    const [existing] = await db.select().from(userLessonProgressTable).where(and(
      eq(userLessonProgressTable.userId, userId),
      eq(userLessonProgressTable.lessonId, lessonId),
    ));

    await ensureCourseEnrollment(userId, context.course.id);
    affectedCourseIds.add(context.course.id);

    if (existing) continue;

    await db.insert(userLessonProgressTable).values({
      userId,
      lessonId,
      xpEarned: context.lesson.xpReward,
    });
    xpEarned += context.lesson.xpReward;
    addedLessons += 1;
  }

  if (xpEarned > 0) {
    await awardXP(userId, xpEarned);
  }

  for (const courseId of affectedCourseIds) {
    await syncCourseCompletion(userId, courseId);
  }

  const newAchievements = addedLessons > 0 ? await checkAndUnlockAchievements(userId) : [];

  return {
    addedLessons,
    xpEarned,
    newAchievements,
  };
}

function normalizeHints(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((hint) => asString(hint).trim()).filter(Boolean);
  }
  return asString(value)
    .split("\n")
    .map((hint) => hint.trim())
    .filter(Boolean);
}

function normalizeQuizOptions(value: unknown): AdminQuizOptionInput[] {
  const options = asArray(value).map((rawOption, optionIndex) => {
    const option = asRecord(rawOption);
    return {
      id: Number.isInteger(option.id) ? option.id : undefined,
      text: asString(option.text).trim(),
      isCorrect: asBoolean(option.isCorrect),
      orderIndex: optionIndex,
    };
  }).filter((option) => option.text.length > 0);

  const hasCorrectOption = options.some((option) => option.isCorrect);
  return options.map((option, optionIndex) => ({
    ...option,
    isCorrect: hasCorrectOption ? option.isCorrect : optionIndex === 0,
  }));
}

function normalizeQuizQuestions(value: unknown): AdminQuizQuestionInput[] {
  return asArray(value).map((rawQuestion, questionIndex) => {
    const question = asRecord(rawQuestion);
    return {
      id: Number.isInteger(question.id) ? question.id : undefined,
      question: asString(question.question).trim(),
      explanation: asString(question.explanation).trim() || null,
      orderIndex: questionIndex,
      options: normalizeQuizOptions(question.options),
    };
  }).filter((question) => question.question.length > 0);
}

function normalizeTestCases(value: unknown): AdminTestCaseInput[] {
  return asArray(value).map((rawTestCase, testIndex) => {
    const testCase = asRecord(rawTestCase);
    const hiddenValue = testCase.isHidden;
    return {
      id: Number.isInteger(testCase.id) ? testCase.id : undefined,
      name: asString(testCase.name, `Test ${testIndex + 1}`).trim() || `Test ${testIndex + 1}`,
      input: asString(testCase.input),
      expectedOutput: asString(testCase.expectedOutput),
      isHidden: typeof hiddenValue === "boolean" ? (hiddenValue ? 1 : 0) : asNumber(hiddenValue, 0),
      orderIndex: testIndex,
    };
  }).filter((testCase) => testCase.expectedOutput.trim().length > 0);
}

function normalizeChallenge(value: unknown, language: string): AdminChallengeInput | null {
  const challenge = asRecord(value);
  const instructions = asString(challenge.instructions).trim();
  const starterCode = asString(challenge.starterCode);
  const testCases = normalizeTestCases(challenge.testCases);

  if (!instructions && !starterCode && testCases.length === 0) {
    return null;
  }

  return {
    id: Number.isInteger(challenge.id) ? challenge.id : undefined,
    instructions,
    starterCode,
    language: asString(challenge.language, language || "python"),
    hints: normalizeHints(challenge.hints),
    testCases,
  };
}

function normalizeCourseBuilderPayload(body: unknown): AdminCourseBuilderInput {
  const raw = asRecord(body);
  const modules = asArray(raw.modules).map((rawModule, moduleIndex) => {
    const mod = asRecord(rawModule);
    const lessons = asArray(mod.lessons).map((rawLesson, lessonIndex) => {
      const lesson = asRecord(rawLesson);
      const rawType = asString(lesson.type, "theory");
      const type: AdminLessonInput["type"] = rawType === "quiz" || rawType === "challenge" ? rawType : "theory";
      const language = asString(raw.language, "python");

      return {
        id: Number.isInteger(lesson.id) ? lesson.id : undefined,
        title: asString(lesson.title).trim(),
        type,
        orderIndex: lessonIndex,
        xpReward: Math.max(0, Math.round(asNumber(lesson.xpReward, 10))),
        estimatedMinutes: Math.max(1, Math.round(asNumber(lesson.estimatedMinutes, 5))),
        content: asString(lesson.content).trim() || null,
        quizData: type === "quiz" ? normalizeQuizQuestions(lesson.quizData) : [],
        challengeData: type === "challenge" ? normalizeChallenge(lesson.challengeData, language) : null,
      };
    }).filter((lesson) => lesson.title.length > 0);

    return {
      id: Number.isInteger(mod.id) ? mod.id : undefined,
      title: asString(mod.title).trim(),
      description: asString(mod.description).trim(),
      orderIndex: moduleIndex,
      lessons,
    };
  }).filter((mod) => mod.title.length > 0);

  const course = {
    title: asString(raw.title).trim(),
    description: asString(raw.description).trim(),
    language: asString(raw.language, "python").trim() || "python",
    difficulty: asString(raw.difficulty, "beginner").trim() || "beginner",
    imageUrl: asString(raw.imageUrl).trim() || null,
    estimatedHours: Math.max(1, Math.round(asNumber(raw.estimatedHours, 1))),
    xpReward: Math.max(0, Math.round(asNumber(raw.xpReward, 100))),
    isPublished: asBoolean(raw.isPublished),
  };

  if (!course.title) {
    throw new Error("Course title is required");
  }
  if (!course.description) {
    throw new Error("Course description is required");
  }

  return {
    course,
    modules,
    totalLessons: modules.reduce((total, mod) => total + mod.lessons.length, 0),
  };
}

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
router.post("/admin/users", adminMiddleware, async (req, res): Promise<void> => {
  const body = asRecord(req.body);
  const username = asString(body.username).trim();
  const email = asString(body.email).trim();
  const password = asString(body.password);
  const displayName = asString(body.displayName).trim() || username;
  const isAdmin = asBoolean(body.isAdmin);

  if (!username || username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existingEmail] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [existingUsername] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const user = await db.transaction(async (tx: any) => {
    const [createdUser] = await tx.insert(usersTable).values({
      username,
      email,
      passwordHash: hashPassword(password),
      displayName,
      isAdmin,
    }).returning();

    await tx.insert(userXPTable).values({ userId: createdUser.id, totalXP: 0, currentLevel: 1 });
    await tx.insert(userStreaksTable).values({ userId: createdUser.id, currentStreak: 0, longestStreak: 0 });

    return createdUser;
  });

  res.status(201).json({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    totalXP: 0,
    currentLevel: 1,
  });
});

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

router.get("/admin/users/:id/activity", adminMiddleware, async (req, res): Promise<void> => {
  const userId = asRouteNumber(req.params.id);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    email: usersTable.email,
    displayName: usersTable.displayName,
    isAdmin: usersTable.isAdmin,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [
    xpRows,
    streakRows,
    allAchievements,
    userAchievements,
    completedProgress,
    enrollments,
  ] = await Promise.all([
    db.select().from(userXPTable).where(eq(userXPTable.userId, userId)),
    db.select().from(userStreaksTable).where(eq(userStreaksTable.userId, userId)),
    db.select().from(achievementsTable).orderBy(asc(achievementsTable.id)),
    db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId)),
    db.select().from(userLessonProgressTable)
      .where(eq(userLessonProgressTable.userId, userId))
      .orderBy(desc(userLessonProgressTable.completedAt)),
    db.select().from(userCourseEnrollmentsTable)
      .where(eq(userCourseEnrollmentsTable.userId, userId))
      .orderBy(desc(userCourseEnrollmentsTable.startedAt)),
  ]);

  const xp = xpRows[0];
  const streak = streakRows[0];
  const typedAchievements = allAchievements as AdminActivityAchievement[];
  const typedUserAchievements = userAchievements as AdminActivityUserAchievement[];
  const typedCompletedProgress = completedProgress as AdminActivityProgress[];
  const typedEnrollments = enrollments as AdminActivityEnrollment[];
  const unlockedAtByAchievementId = new Map<number, Date>(typedUserAchievements.map((item) => [item.achievementId, item.unlockedAt]));
  const completedByLessonId = new Map<number, AdminActivityProgress>(typedCompletedProgress.map((item) => [item.lessonId, item]));

  const achievements = typedAchievements.map((achievement) => {
    const unlockedAt = unlockedAtByAchievementId.get(achievement.id) ?? null;
    return {
      id: achievement.id,
      key: achievement.key,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
      unlockedAt: dateToIso(unlockedAt),
    };
  });

  const courses = await Promise.all(typedEnrollments.map(async (enrollment) => {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, enrollment.courseId));
    if (!course) return null;

    const modules = await db.select().from(modulesTable)
      .where(eq(modulesTable.courseId, course.id))
      .orderBy(asc(modulesTable.orderIndex));

    const lessons: AdminActivityLesson[] = [];
    for (const courseModule of modules) {
      const moduleLessons = await db.select().from(lessonsTable)
        .where(eq(lessonsTable.moduleId, courseModule.id))
        .orderBy(asc(lessonsTable.orderIndex));

      lessons.push(...moduleLessons.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        orderIndex: lesson.orderIndex,
        moduleId: courseModule.id,
        moduleTitle: courseModule.title,
        moduleOrderIndex: courseModule.orderIndex,
        xpReward: lesson.xpReward,
      })));
    }

    const completedLessonIds = new Set(
      lessons
        .filter((lesson: AdminActivityLesson) => completedByLessonId.has(lesson.id))
        .map((lesson: AdminActivityLesson) => lesson.id),
    );
    const completedInCourse = lessons
      .map((lesson: AdminActivityLesson) => ({ lesson, progress: completedByLessonId.get(lesson.id) }))
      .filter((item): item is { lesson: AdminActivityLesson; progress: AdminActivityProgress } => Boolean(item.progress));
    const lastCompleted = completedInCourse
      .sort((a, b) => (
        (b.progress?.completedAt?.getTime() ?? 0) - (a.progress?.completedAt?.getTime() ?? 0)
      ))[0] ?? null;

    const totalLessons = lessons.length;
    const completedLessons = completedLessonIds.size;
    const percentComplete = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const inferredCompletedAt = completedLessons >= totalLessons && totalLessons > 0
      ? lastCompleted?.progress?.completedAt ?? null
      : null;
    const completedAt = enrollment.completedAt ?? inferredCompletedAt;
    const status = completedAt
      ? "completed"
      : completedLessons > 0
        ? "in_progress"
        : "started";
    const currentLesson = status === "completed"
      ? null
      : lessons.find((lesson: AdminActivityLesson) => !completedLessonIds.has(lesson.id)) ?? lessons[0] ?? null;

    const lessonPointer = (lesson: AdminActivityLesson | null, completedAtValue?: Date | null) => lesson ? {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      orderIndex: lesson.orderIndex,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.moduleTitle,
      moduleOrderIndex: lesson.moduleOrderIndex,
      xpReward: lesson.xpReward,
      completedAt: dateToIso(completedAtValue ?? null),
    } : null;

    return {
      courseId: course.id,
      courseTitle: course.title,
      language: course.language,
      difficulty: course.difficulty,
      imageUrl: course.imageUrl,
      status,
      completedLessons,
      totalLessons,
      percentComplete,
      xpEarned: completedInCourse.reduce((sum: number, item) => sum + (item.progress?.xpEarned ?? 0), 0),
      startedAt: dateToIso(enrollment.startedAt),
      completedAt: dateToIso(completedAt),
      lastActivityAt: dateToIso(lastCompleted?.progress?.completedAt ?? enrollment.startedAt),
      currentLesson: lessonPointer(currentLesson),
      lastCompletedLesson: lessonPointer(lastCompleted?.lesson ?? null, lastCompleted?.progress?.completedAt ?? null),
    };
  }));

  const recentLessons = await Promise.all(typedCompletedProgress.slice(0, 8).map(async (progress) => {
    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, progress.lessonId));
    if (!lesson) return null;
    const [courseModule] = await db.select().from(modulesTable).where(eq(modulesTable.id, lesson.moduleId));
    if (!courseModule) return null;
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseModule.courseId));
    if (!course) return null;

    return {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      moduleTitle: courseModule.title,
      courseId: course.id,
      courseTitle: course.title,
      xpEarned: progress.xpEarned,
      completedAt: dateToIso(progress.completedAt),
    };
  }));

  const validCourses = courses.filter(Boolean) as any[];
  const unlockedAchievements = achievements.filter((achievement: any) => achievement.unlockedAt !== null);

  res.json({
    user: {
      ...user,
      createdAt: dateToIso(user.createdAt),
      totalXP: xp?.totalXP ?? 0,
      currentLevel: xp?.currentLevel ?? 1,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      lastActivityDate: dateToIso(streak?.lastActivityDate ?? null),
    },
    summary: {
      enrolledCourses: validCourses.length,
      completedCourses: validCourses.filter((course) => course.status === "completed").length,
      inProgressCourses: validCourses.filter((course) => course.status === "in_progress").length,
      completedLessons: completedByLessonId.size,
      unlockedAchievements: unlockedAchievements.length,
      totalAchievements: achievements.length,
    },
    courses: validCourses,
    achievements,
    recentLessons: recentLessons.filter(Boolean),
  });
});

router.post("/admin/users/:userId/achievements/:achievementId", adminMiddleware, async (req, res): Promise<void> => {
  const userId = asRouteNumber(req.params.userId);
  const achievementId = asRouteNumber(req.params.achievementId);
  if (!Number.isInteger(userId) || !Number.isInteger(achievementId)) {
    res.status(400).json({ error: "Invalid user or achievement ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [achievement] = await db.select().from(achievementsTable).where(eq(achievementsTable.id, achievementId));
  if (!achievement) {
    res.status(404).json({ error: "Achievement not found" });
    return;
  }

  const [existing] = await db.select().from(userAchievementsTable).where(and(
    eq(userAchievementsTable.userId, userId),
    eq(userAchievementsTable.achievementId, achievementId),
  ));

  if (existing) {
    res.json({ success: true, alreadyUnlocked: true });
    return;
  }

  await db.insert(userAchievementsTable).values({ userId, achievementId });
  if (achievement.xpReward > 0) {
    await awardXP(userId, achievement.xpReward);
  }

  res.status(201).json({ success: true, alreadyUnlocked: false });
});

router.delete("/admin/users/:userId/achievements/:achievementId", adminMiddleware, async (req, res): Promise<void> => {
  const userId = asRouteNumber(req.params.userId);
  const achievementId = asRouteNumber(req.params.achievementId);
  if (!Number.isInteger(userId) || !Number.isInteger(achievementId)) {
    res.status(400).json({ error: "Invalid user or achievement ID" });
    return;
  }

  if (!(await ensureUserExists(userId))) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [achievement] = await db.select().from(achievementsTable).where(eq(achievementsTable.id, achievementId));
  if (!achievement) {
    res.status(404).json({ error: "Achievement not found" });
    return;
  }

  const [existing] = await db.select().from(userAchievementsTable).where(and(
    eq(userAchievementsTable.userId, userId),
    eq(userAchievementsTable.achievementId, achievementId),
  ));

  if (!existing) {
    res.json({ success: true, alreadyRemoved: true, xp: await recalculateUserXP(userId) });
    return;
  }

  await db.delete(userAchievementsTable).where(and(
    eq(userAchievementsTable.userId, userId),
    eq(userAchievementsTable.achievementId, achievementId),
  ));

  res.json({ success: true, alreadyRemoved: false, xp: await recalculateUserXP(userId) });
});

router.post("/admin/users/:userId/courses/:courseId", adminMiddleware, async (req, res): Promise<void> => {
  const userId = asRouteNumber(req.params.userId);
  const courseId = asRouteNumber(req.params.courseId);
  if (!Number.isInteger(userId) || !Number.isInteger(courseId)) {
    res.status(400).json({ error: "Invalid user or course ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const [existing] = await db.select().from(userCourseEnrollmentsTable).where(and(
    eq(userCourseEnrollmentsTable.userId, userId),
    eq(userCourseEnrollmentsTable.courseId, courseId),
  ));

  if (existing) {
    res.json({ success: true, alreadyAdded: true });
    return;
  }

  await db.insert(userCourseEnrollmentsTable).values({ userId, courseId });
  res.status(201).json({ success: true, alreadyAdded: false });
});

router.post("/admin/users/:userId/modules/:moduleId", adminMiddleware, async (req, res): Promise<void> => {
  const userId = asRouteNumber(req.params.userId);
  const moduleId = asRouteNumber(req.params.moduleId);
  if (!Number.isInteger(userId) || !Number.isInteger(moduleId)) {
    res.status(400).json({ error: "Invalid user or module ID" });
    return;
  }

  if (!(await ensureUserExists(userId))) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [courseModule] = await db.select().from(modulesTable).where(eq(modulesTable.id, moduleId));
  if (!courseModule) {
    res.status(404).json({ error: "Module not found" });
    return;
  }

  await ensureCourseEnrollment(userId, courseModule.courseId);
  const lessons = await db.select().from(lessonsTable)
    .where(eq(lessonsTable.moduleId, moduleId))
    .orderBy(asc(lessonsTable.orderIndex));
  const result = await completeLessonsForUser(userId, lessons.map((lesson) => lesson.id));

  res.status(result.addedLessons > 0 ? 201 : 200).json({
    success: true,
    alreadyCompleted: result.addedLessons === 0,
    ...result,
  });
});

router.post("/admin/users/:userId/lessons/:lessonId", adminMiddleware, async (req, res): Promise<void> => {
  const userId = asRouteNumber(req.params.userId);
  const lessonId = asRouteNumber(req.params.lessonId);
  if (!Number.isInteger(userId) || !Number.isInteger(lessonId)) {
    res.status(400).json({ error: "Invalid user or lesson ID" });
    return;
  }

  if (!(await ensureUserExists(userId))) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const context = await getLessonContext(lessonId);
  if (!context) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const result = await completeLessonsForUser(userId, [lessonId]);

  res.status(result.addedLessons > 0 ? 201 : 200).json({
    success: true,
    alreadyCompleted: result.addedLessons === 0,
    ...result,
  });
});

router.post("/admin/users/:userId/reset-progress", adminMiddleware, async (req, res): Promise<void> => {
  const userId = asRouteNumber(req.params.userId);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (!(await ensureUserExists(userId))) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const body = asRecord(req.body);
  const scope = asString(body.scope, "all");
  const clearAchievements = asBoolean(body.clearAchievements);
  const affectedCourseIds = new Set<number>();
  let lessonIds: number[] = [];

  if (scope === "all") {
    await db.delete(userLessonProgressTable).where(eq(userLessonProgressTable.userId, userId));
    await db.delete(userCourseEnrollmentsTable).where(eq(userCourseEnrollmentsTable.userId, userId));
  } else if (scope === "course") {
    const courseId = asNumber(body.courseId, NaN);
    if (!Number.isInteger(courseId)) {
      res.status(400).json({ error: "Course is required" });
      return;
    }

    const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, courseId));
    for (const courseModule of modules) {
      const moduleLessons = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, courseModule.id));
      lessonIds.push(...moduleLessons.map((lesson) => lesson.id));
    }

    if (lessonIds.length > 0) {
      await db.delete(userLessonProgressTable).where(and(
        eq(userLessonProgressTable.userId, userId),
        inArray(userLessonProgressTable.lessonId, lessonIds),
      ));
    }
    await db.delete(userCourseEnrollmentsTable).where(and(
      eq(userCourseEnrollmentsTable.userId, userId),
      eq(userCourseEnrollmentsTable.courseId, courseId),
    ));
  } else if (scope === "module") {
    const moduleId = asNumber(body.moduleId, NaN);
    if (!Number.isInteger(moduleId)) {
      res.status(400).json({ error: "Module is required" });
      return;
    }

    const [courseModule] = await db.select().from(modulesTable).where(eq(modulesTable.id, moduleId));
    if (!courseModule) {
      res.status(404).json({ error: "Module not found" });
      return;
    }

    affectedCourseIds.add(courseModule.courseId);
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, moduleId));
    lessonIds = lessons.map((lesson) => lesson.id);
    if (lessonIds.length > 0) {
      await db.delete(userLessonProgressTable).where(and(
        eq(userLessonProgressTable.userId, userId),
        inArray(userLessonProgressTable.lessonId, lessonIds),
      ));
    }
  } else if (scope === "lesson") {
    const lessonId = asNumber(body.lessonId, NaN);
    if (!Number.isInteger(lessonId)) {
      res.status(400).json({ error: "Lesson is required" });
      return;
    }

    const context = await getLessonContext(lessonId);
    if (!context) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    affectedCourseIds.add(context.course.id);
    lessonIds = [lessonId];
    await db.delete(userLessonProgressTable).where(and(
      eq(userLessonProgressTable.userId, userId),
      eq(userLessonProgressTable.lessonId, lessonId),
    ));
  } else {
    res.status(400).json({ error: "Invalid reset scope" });
    return;
  }

  if (clearAchievements) {
    await db.delete(userAchievementsTable).where(eq(userAchievementsTable.userId, userId));
  }

  for (const courseId of affectedCourseIds) {
    await syncCourseCompletion(userId, courseId);
  }

  const xp = await recalculateUserXP(userId);
  res.json({
    success: true,
    scope,
    resetLessons: lessonIds.length,
    achievementsCleared: clearAchievements,
    xp,
  });
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

// ── SUPPORT ──
router.get("/admin/support-messages", adminMiddleware, async (_req, res): Promise<void> => {
  await ensureSupportMessagesTable();

  const messages = await db.select().from(supportMessagesTable).orderBy(
    desc(supportMessagesTable.createdAt),
    desc(supportMessagesTable.id),
  );

  res.json(messages);
});

router.post("/admin/support-messages/:id/reply", adminMiddleware, async (req, res): Promise<void> => {
  const messageId = asRouteNumber(req.params.id);
  const body = asRecord(req.body);
  const reply = asString(body.message).trim();

  if (!Number.isInteger(messageId)) {
    res.status(400).json({ error: "Invalid support message ID" });
    return;
  }

  if (reply.length < 2 || reply.length > 2000) {
    res.status(400).json({ error: "Reply must be between 2 and 2000 characters" });
    return;
  }

  await ensureSupportMessagesTable();
  await ensureUserNotificationsTable();

  const [supportMessage] = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.id, messageId));
  if (!supportMessage) {
    res.status(404).json({ error: "Support message not found" });
    return;
  }

  if (!supportMessage.userId) {
    res.status(400).json({ error: "Support message has no user" });
    return;
  }

  const [notification] = await db.insert(userNotificationsTable).values({
    userId: supportMessage.userId,
    title: `Ответ поддержки: ${supportMessage.subject}`,
    message: reply,
    type: "support_reply",
    sourceSupportMessageId: supportMessage.id,
  }).returning();

  await db.delete(supportMessagesTable).where(eq(supportMessagesTable.id, messageId));

  res.status(201).json({ notification, deletedSupportMessageId: messageId });
});

router.post("/admin/notifications/broadcast", adminMiddleware, async (req, res): Promise<void> => {
  const body = asRecord(req.body);
  const title = asString(body.title).trim();
  const message = asString(body.message).trim();

  if (title.length < 2 || title.length > 120) {
    res.status(400).json({ error: "Title must be between 2 and 120 characters" });
    return;
  }

  if (message.length < 2 || message.length > 2000) {
    res.status(400).json({ error: "Message must be between 2 and 2000 characters" });
    return;
  }

  await ensureUserNotificationsTable();
  const users = await db.select({ id: usersTable.id }).from(usersTable);

  if (users.length === 0) {
    res.json({ success: true, sent: 0 });
    return;
  }

  await db.insert(userNotificationsTable).values(users.map((user) => ({
    userId: user.id,
    title,
    message,
    type: "broadcast",
  })));

  res.status(201).json({ success: true, sent: users.length });
});

router.patch("/admin/support-messages/:id", adminMiddleware, async (req, res): Promise<void> => {
  const messageId = asRouteNumber(req.params.id);
  const body = asRecord(req.body);
  const status = asString(body.status);

  if (!Number.isInteger(messageId)) {
    res.status(400).json({ error: "Invalid support message ID" });
    return;
  }

  if (status !== "new" && status !== "resolved") {
    res.status(400).json({ error: "Invalid support message status" });
    return;
  }

  await ensureSupportMessagesTable();
  const [message] = await db.update(supportMessagesTable)
    .set({
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
    })
    .where(eq(supportMessagesTable.id, messageId))
    .returning();

  if (!message) {
    res.status(404).json({ error: "Support message not found" });
    return;
  }

  res.json(message);
});

router.delete("/admin/support-messages/:id", adminMiddleware, async (req, res): Promise<void> => {
  const messageId = asRouteNumber(req.params.id);
  if (!Number.isInteger(messageId)) {
    res.status(400).json({ error: "Invalid support message ID" });
    return;
  }

  await ensureSupportMessagesTable();
  await db.delete(supportMessagesTable).where(eq(supportMessagesTable.id, messageId));
  res.json({ success: true });
});

// ── COURSES ──
router.get("/admin/courses", adminMiddleware, async (_req, res): Promise<void> => {
  const courses = await db.select().from(coursesTable).orderBy(asc(coursesTable.id));
  res.json(courses);
});

router.get("/admin/course-tree", adminMiddleware, async (_req, res): Promise<void> => {
  const courses = await db.select().from(coursesTable).orderBy(asc(coursesTable.id));
  const tree = await Promise.all(courses.map(async (course) => {
    const modules = await db.select().from(modulesTable)
      .where(eq(modulesTable.courseId, course.id))
      .orderBy(asc(modulesTable.orderIndex));

    const modulesWithLessons = await Promise.all(modules.map(async (courseModule) => {
      const lessons = await db.select().from(lessonsTable)
        .where(eq(lessonsTable.moduleId, courseModule.id))
        .orderBy(asc(lessonsTable.orderIndex));
      return { ...courseModule, lessons };
    }));

    return { ...course, modules: modulesWithLessons };
  }));

  res.json(tree);
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

async function deleteLessonData(lessonId: number, client: any = db, removeProgress = true) {
  const questions = await client.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.lessonId, lessonId));
  for (const q of questions) {
    await client.delete(quizOptionsTable).where(eq(quizOptionsTable.questionId, q.id));
  }
  await client.delete(quizQuestionsTable).where(eq(quizQuestionsTable.lessonId, lessonId));
  const [challenge] = await client.select().from(codingChallengesTable).where(eq(codingChallengesTable.lessonId, lessonId));
  if (challenge) {
    await client.delete(testCasesTable).where(eq(testCasesTable.challengeId, challenge.id));
    await client.delete(codingChallengesTable).where(eq(codingChallengesTable.id, challenge.id));
  }
  if (removeProgress) {
    await client.delete(userLessonProgressTable).where(eq(userLessonProgressTable.lessonId, lessonId));
  }
}

async function deleteModuleTree(moduleId: number, client: any = db) {
  const lessons = await client.select().from(lessonsTable).where(eq(lessonsTable.moduleId, moduleId));
  for (const lesson of lessons) {
    await deleteLessonData(lesson.id, client);
  }
  await client.delete(lessonsTable).where(eq(lessonsTable.moduleId, moduleId));
  await client.delete(modulesTable).where(eq(modulesTable.id, moduleId));
}

async function getCourseBuilder(courseId: number, client: any = db) {
  const [course] = await client.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) return null;

  const modules = await client.select().from(modulesTable)
    .where(eq(modulesTable.courseId, courseId))
    .orderBy(asc(modulesTable.orderIndex));

  const modulesWithLessons = await Promise.all(modules.map(async (mod: any) => {
    const lessons = await client.select().from(lessonsTable)
      .where(eq(lessonsTable.moduleId, mod.id))
      .orderBy(asc(lessonsTable.orderIndex));

    const lessonsWithData = await Promise.all(lessons.map(async (lesson: any) => {
      let quizData: any[] = [];
      let challengeData = null;

      if (lesson.type === "quiz") {
        const questions = await client.select().from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.lessonId, lesson.id))
          .orderBy(asc(quizQuestionsTable.orderIndex));

        quizData = await Promise.all(questions.map(async (question: any) => {
          const options = await client.select().from(quizOptionsTable)
            .where(eq(quizOptionsTable.questionId, question.id))
            .orderBy(asc(quizOptionsTable.orderIndex));
          return { ...question, options };
        }));
      }

      if (lesson.type === "challenge") {
        const [challenge] = await client.select().from(codingChallengesTable)
          .where(eq(codingChallengesTable.lessonId, lesson.id));
        if (challenge) {
          const testCases = await client.select().from(testCasesTable)
            .where(eq(testCasesTable.challengeId, challenge.id))
            .orderBy(asc(testCasesTable.orderIndex));
          challengeData = { ...challenge, testCases };
        }
      }

      return { ...lesson, quizData, challengeData };
    }));

    return { ...mod, lessons: lessonsWithData };
  }));

  return { ...course, modules: modulesWithLessons };
}

async function saveLessonExtras(client: any, lessonId: number, lesson: AdminLessonInput) {
  if (lesson.type === "quiz") {
    for (const question of lesson.quizData) {
      const [savedQuestion] = await client.insert(quizQuestionsTable).values({
        lessonId,
        question: question.question,
        explanation: question.explanation,
        orderIndex: question.orderIndex,
      }).returning();

      if (question.options.length > 0) {
        await client.insert(quizOptionsTable).values(question.options.map((option) => ({
          questionId: savedQuestion.id,
          text: option.text,
          isCorrect: option.isCorrect,
          orderIndex: option.orderIndex,
        })));
      }
    }
  }

  if (lesson.type === "challenge" && lesson.challengeData) {
    const [savedChallenge] = await client.insert(codingChallengesTable).values({
      lessonId,
      instructions: lesson.challengeData.instructions || "",
      starterCode: lesson.challengeData.starterCode || "",
      language: lesson.challengeData.language || "python",
      hints: lesson.challengeData.hints,
    }).returning();

    if (lesson.challengeData.testCases.length > 0) {
      await client.insert(testCasesTable).values(lesson.challengeData.testCases.map((testCase) => ({
        challengeId: savedChallenge.id,
        name: testCase.name,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        isHidden: testCase.isHidden,
        orderIndex: testCase.orderIndex,
      })));
    }
  }
}

async function syncBuilderLessons(client: any, moduleId: number, lessons: AdminLessonInput[]) {
  const existingLessons = await client.select().from(lessonsTable).where(eq(lessonsTable.moduleId, moduleId));
  const existingLessonIds = new Set(existingLessons.map((lesson: any) => lesson.id));
  const keptLessonIds = new Set<number>();

  for (const lesson of lessons) {
    let lessonId: number;
    const lessonValues = {
      moduleId,
      title: lesson.title,
      type: lesson.type,
      orderIndex: lesson.orderIndex,
      xpReward: lesson.xpReward,
      estimatedMinutes: lesson.estimatedMinutes,
      content: lesson.content,
    };

    if (lesson.id && existingLessonIds.has(lesson.id)) {
      lessonId = lesson.id;
      await deleteLessonData(lessonId, client, false);
      await client.update(lessonsTable).set(lessonValues).where(eq(lessonsTable.id, lessonId));
    } else {
      const [savedLesson] = await client.insert(lessonsTable).values(lessonValues).returning();
      lessonId = savedLesson.id;
    }

    keptLessonIds.add(lessonId);
    await saveLessonExtras(client, lessonId, lesson);
  }

  for (const existingLesson of existingLessons) {
    if (!keptLessonIds.has(existingLesson.id)) {
      await deleteLessonData(existingLesson.id, client);
      await client.delete(lessonsTable).where(eq(lessonsTable.id, existingLesson.id));
    }
  }
}

async function syncBuilderModules(client: any, courseId: number, modules: AdminModuleInput[]) {
  const existingModules = await client.select().from(modulesTable).where(eq(modulesTable.courseId, courseId));
  const existingModuleIds = new Set(existingModules.map((mod: any) => mod.id));
  const keptModuleIds = new Set<number>();

  for (const mod of modules) {
    let moduleId: number;
    const moduleValues = {
      courseId,
      title: mod.title,
      description: mod.description,
      orderIndex: mod.orderIndex,
    };

    if (mod.id && existingModuleIds.has(mod.id)) {
      moduleId = mod.id;
      await client.update(modulesTable).set(moduleValues).where(eq(modulesTable.id, moduleId));
    } else {
      const [savedModule] = await client.insert(modulesTable).values(moduleValues).returning();
      moduleId = savedModule.id;
    }

    keptModuleIds.add(moduleId);
    await syncBuilderLessons(client, moduleId, mod.lessons);
  }

  for (const existingModule of existingModules) {
    if (!keptModuleIds.has(existingModule.id)) {
      await deleteModuleTree(existingModule.id, client);
    }
  }
}

router.get("/admin/courses/:id/builder", adminMiddleware, async (req, res): Promise<void> => {
  const courseId = asRouteNumber(req.params.id);
  const course = await getCourseBuilder(courseId);

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json(course);
});

router.post("/admin/courses/builder", adminMiddleware, async (req, res): Promise<void> => {
  try {
    const payload = normalizeCourseBuilderPayload(req.body);
    const savedCourse = await db.transaction(async (tx: any) => {
      const [course] = await tx.insert(coursesTable).values({
        ...payload.course,
        totalLessons: payload.totalLessons,
      }).returning();
      await syncBuilderModules(tx, course.id, payload.modules);
      return getCourseBuilder(course.id, tx);
    });

    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid course payload" });
  }
});

router.put("/admin/courses/:id/builder", adminMiddleware, async (req, res): Promise<void> => {
  const courseId = asRouteNumber(req.params.id);
  const [existingCourse] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!existingCourse) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  try {
    const payload = normalizeCourseBuilderPayload(req.body);
    const savedCourse = await db.transaction(async (tx: any) => {
      await tx.update(coursesTable).set({
        ...payload.course,
        totalLessons: payload.totalLessons,
      }).where(eq(coursesTable.id, courseId));
      await syncBuilderModules(tx, courseId, payload.modules);
      return getCourseBuilder(courseId, tx);
    });

    res.json(savedCourse);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid course payload" });
  }
});

router.delete("/admin/courses/:id", adminMiddleware, async (req, res): Promise<void> => {
  const courseId = asRouteNumber(req.params.id);
  const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, courseId));
  for (const mod of modules) {
    await deleteModuleTree(mod.id);
  }
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
