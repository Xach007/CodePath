import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { lessonsTable } from "./courses";

export const codingChallengesTable = pgTable("coding_challenges", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id).unique(),
  instructions: text("instructions").notNull(),
  starterCode: text("starter_code").notNull().default(""),
  language: text("language").notNull().default("python"),
  hints: text("hints").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCodingChallengeSchema = createInsertSchema(codingChallengesTable).omit({ id: true, createdAt: true });
export type InsertCodingChallenge = z.infer<typeof insertCodingChallengeSchema>;
export type CodingChallenge = typeof codingChallengesTable.$inferSelect;

export const testCasesTable = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => codingChallengesTable.id),
  name: text("name").notNull(),
  input: text("input").notNull().default(""),
  expectedOutput: text("expected_output").notNull(),
  isHidden: integer("is_hidden").notNull().default(0),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertTestCaseSchema = createInsertSchema(testCasesTable).omit({ id: true });
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;
export type TestCase = typeof testCasesTable.$inferSelect;
