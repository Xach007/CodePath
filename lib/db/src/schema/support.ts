import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const supportMessagesTable = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  username: text("username").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  pageUrl: text("page_url"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export type SupportMessage = typeof supportMessagesTable.$inferSelect;
