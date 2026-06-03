import { Router, type IRouter } from "express";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, userNotificationsTable } from "@workspace/db";
import { authMiddleware, getAuthUserId } from "../lib/auth";
import { ensureUserNotificationsTable } from "../lib/notifications";

const router: IRouter = Router();

router.get("/notifications", authMiddleware, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  await ensureUserNotificationsTable();

  const [unread] = await db.select({ value: count() })
    .from(userNotificationsTable)
    .where(and(
      eq(userNotificationsTable.userId, userId),
      isNull(userNotificationsTable.readAt),
    ));

  const items = await db.select()
    .from(userNotificationsTable)
    .where(eq(userNotificationsTable.userId, userId))
    .orderBy(desc(userNotificationsTable.createdAt), desc(userNotificationsTable.id))
    .limit(30);

  res.json({
    unreadCount: Number(unread?.value ?? 0),
    items,
  });
});

router.patch("/notifications/:id/read", authMiddleware, async (req, res): Promise<void> => {
  const notificationId = Number.parseInt(req.params.id, 10);
  const userId = getAuthUserId(req);

  if (!Number.isInteger(notificationId)) {
    res.status(400).json({ error: "Invalid notification ID" });
    return;
  }

  await ensureUserNotificationsTable();
  const [notification] = await db.update(userNotificationsTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(userNotificationsTable.id, notificationId),
      eq(userNotificationsTable.userId, userId),
    ))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(notification);
});

router.post("/notifications/read-all", authMiddleware, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  await ensureUserNotificationsTable();

  await db.update(userNotificationsTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(userNotificationsTable.userId, userId),
      isNull(userNotificationsTable.readAt),
    ));

  res.json({ success: true });
});

router.delete("/notifications", authMiddleware, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  await ensureUserNotificationsTable();

  await db.delete(userNotificationsTable)
    .where(eq(userNotificationsTable.userId, userId));

  res.json({ success: true });
});

export default router;
