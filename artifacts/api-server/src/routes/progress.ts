import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  userLessonProgressTable,
  userCourseEnrollmentsTable,
  userXPTable,
  userStreaksTable,
  coursesTable,
  lessonsTable,
  modulesTable,
} from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import {
  GetUserProgressResponse,
  GetCourseProgressParams,
  GetCourseProgressResponse,
} from "@workspace/api-zod";
import { authMiddleware, getAuthUserId } from "../lib/auth";
import { calculateLevel } from "../lib/gamification";

const router: IRouter = Router();

router.get("/progress", authMiddleware, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);

  const xpRow = await db.select().from(userXPTable).where(eq(userXPTable.userId, userId));
  const streakRow = await db.select().from(userStreaksTable).where(eq(userStreaksTable.userId, userId));

  const totalXP = xpRow[0]?.totalXP ?? 0;
  const currentLevel = xpRow[0]?.currentLevel ?? 1;
  const currentStreak = streakRow[0]?.currentStreak ?? 0;
  const longestStreak = streakRow[0]?.longestStreak ?? 0;

  const completedLessonsResult = await db.select({ count: count() }).from(userLessonProgressTable)
    .where(eq(userLessonProgressTable.userId, userId));
  const completedLessons = Number(completedLessonsResult[0]?.count ?? 0);

  const enrollments = await db.select().from(userCourseEnrollmentsTable)
    .where(eq(userCourseEnrollmentsTable.userId, userId));

  const coursesProgress = await Promise.all(enrollments.map(async (enrollment) => {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, enrollment.courseId));
    if (!course) return null;

    const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, course.id));
    const lessonIds: number[] = [];
    for (const mod of modules) {
      const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, mod.id));
      lessonIds.push(...lessons.map(l => l.id));
    }

    const userCompleted = await db.select().from(userLessonProgressTable)
      .where(eq(userLessonProgressTable.userId, userId));
    const completedInCourse = userCompleted.filter(p => lessonIds.includes(p.lessonId));
    const xpEarned = completedInCourse.reduce((sum, p) => sum + p.xpEarned, 0);
    const percentComplete = lessonIds.length > 0
      ? Math.round((completedInCourse.length / lessonIds.length) * 100)
      : 0;

    return {
      courseId: course.id,
      courseTitle: course.title,
      completedLessons: completedInCourse.length,
      totalLessons: lessonIds.length,
      percentComplete,
      xpEarned,
      startedAt: enrollment.startedAt?.toISOString() ?? null,
      completedAt: enrollment.completedAt?.toISOString() ?? null,
    };
  }));

  const validProgress = coursesProgress.filter(Boolean) as any[];

  res.json(GetUserProgressResponse.parse({
    userId,
    enrolledCourses: enrollments.length,
    completedCourses: enrollments.filter(e => e.completedAt !== null).length,
    completedLessons,
    totalXP,
    currentLevel,
    currentStreak,
    longestStreak,
    coursesProgress: validProgress,
  }));
});

router.get("/progress/course/:courseId", authMiddleware, async (req, res): Promise<void> => {
  const params = GetCourseProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const userId = getAuthUserId(req);
  const courseId = params.data.courseId;

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, courseId));
  const lessonIds: number[] = [];
  for (const mod of modules) {
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, mod.id));
    lessonIds.push(...lessons.map(l => l.id));
  }

  const userCompleted = await db.select().from(userLessonProgressTable)
    .where(eq(userLessonProgressTable.userId, userId));
  const completedInCourse = userCompleted.filter(p => lessonIds.includes(p.lessonId));
  const xpEarned = completedInCourse.reduce((sum, p) => sum + p.xpEarned, 0);
  const percentComplete = lessonIds.length > 0
    ? Math.round((completedInCourse.length / lessonIds.length) * 100)
    : 0;

  const [enrollment] = await db.select().from(userCourseEnrollmentsTable)
    .where(and(
      eq(userCourseEnrollmentsTable.userId, userId),
      eq(userCourseEnrollmentsTable.courseId, courseId),
    ));

  res.json(GetCourseProgressResponse.parse({
    courseId,
    courseTitle: course.title,
    completedLessons: completedInCourse.length,
    totalLessons: lessonIds.length,
    percentComplete,
    xpEarned,
    startedAt: enrollment?.startedAt?.toISOString() ?? null,
    completedAt: enrollment?.completedAt?.toISOString() ?? null,
  }));
});

export default router;
