import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { lessonsTable, coursesTable } from "./courses";

export const userLessonProgressTable = pgTable("user_lesson_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  xpEarned: integer("xp_earned").notNull().default(0),
});

export const insertUserLessonProgressSchema = createInsertSchema(userLessonProgressTable).omit({ id: true });
export type InsertUserLessonProgress = z.infer<typeof insertUserLessonProgressSchema>;
export type UserLessonProgress = typeof userLessonProgressTable.$inferSelect;

export const userCourseEnrollmentsTable = pgTable("user_course_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertUserCourseEnrollmentSchema = createInsertSchema(userCourseEnrollmentsTable).omit({ id: true });
export type InsertUserCourseEnrollment = z.infer<typeof insertUserCourseEnrollmentSchema>;
export type UserCourseEnrollment = typeof userCourseEnrollmentsTable.$inferSelect;
