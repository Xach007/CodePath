import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  coursesTable, modulesTable, lessonsTable,
  userLessonProgressTable,
} from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  ListCoursesResponse,
  GetCourseResponse,
  GetCourseParams,
  GetModuleResponse,
  GetModuleParams,
} from "@workspace/api-zod";
import { authMiddleware, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

router.get("/courses", async (_req, res): Promise<void> => {
  const courses = await db.select().from(coursesTable)
    .where(eq(coursesTable.isPublished, true))
    .orderBy(asc(coursesTable.id));
  res.json(ListCoursesResponse.parse(courses));
});

router.get("/courses/:courseId", async (req, res): Promise<void> => {
  const params = GetCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const [course] = await db.select().from(coursesTable)
    .where(eq(coursesTable.id, params.data.courseId));
  if (!course || !course.isPublished) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const modules = await db.select().from(modulesTable)
    .where(eq(modulesTable.courseId, course.id))
    .orderBy(asc(modulesTable.orderIndex));

  const modulesWithLessons = await Promise.all(modules.map(async (mod) => {
    const lessons = await db.select().from(lessonsTable)
      .where(eq(lessonsTable.moduleId, mod.id))
      .orderBy(asc(lessonsTable.orderIndex));
    return {
      id: mod.id,
      courseId: mod.courseId,
      title: mod.title,
      description: mod.description,
      orderIndex: mod.orderIndex,
      lessonCount: lessons.length,
      lessons: lessons.map(l => ({
        id: l.id,
        moduleId: l.moduleId,
        title: l.title,
        type: l.type,
        orderIndex: l.orderIndex,
        xpReward: l.xpReward,
        estimatedMinutes: l.estimatedMinutes,
      })),
    };
  }));

  res.json(GetCourseResponse.parse({
    ...course,
    modules: modulesWithLessons,
  }));
});

router.get("/modules/:moduleId", authMiddleware, async (req, res): Promise<void> => {
  const params = GetModuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid module ID" });
    return;
  }

  const [mod] = await db.select().from(modulesTable)
    .where(eq(modulesTable.id, params.data.moduleId));
  if (!mod) {
    res.status(404).json({ error: "Module not found" });
    return;
  }

  const lessons = await db.select().from(lessonsTable)
    .where(eq(lessonsTable.moduleId, mod.id))
    .orderBy(asc(lessonsTable.orderIndex));

  res.json(GetModuleResponse.parse({
    id: mod.id,
    courseId: mod.courseId,
    title: mod.title,
    description: mod.description,
    orderIndex: mod.orderIndex,
    lessons: lessons.map(l => ({
      id: l.id,
      moduleId: l.moduleId,
      title: l.title,
      type: l.type,
      orderIndex: l.orderIndex,
      xpReward: l.xpReward,
      estimatedMinutes: l.estimatedMinutes,
    })),
  }));
});

export default router;
