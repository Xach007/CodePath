import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  userXPTable,
  userStreaksTable,
  achievementsTable,
  userAchievementsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetGamificationProfileResponse,
  ListAchievementsResponse,
  GetLeaderboardResponse,
} from "@workspace/api-zod";
import { authMiddleware, getAuthUserId } from "../lib/auth";
import { calculateLevel, xpForNextLevel, xpForCurrentLevelStart } from "../lib/gamification";

const router: IRouter = Router();

router.get("/gamification/profile", authMiddleware, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);

  const xpRow = await db.select().from(userXPTable).where(eq(userXPTable.userId, userId));
  const streakRow = await db.select().from(userStreaksTable).where(eq(userStreaksTable.userId, userId));

  const totalXP = xpRow[0]?.totalXP ?? 0;
  const currentLevel = xpRow[0]?.currentLevel ?? 1;
  const currentStreak = streakRow[0]?.currentStreak ?? 0;
  const longestStreak = streakRow[0]?.longestStreak ?? 0;
  const lastActivityDate = streakRow[0]?.lastActivityDate ?? null;

  const levelStart = xpForCurrentLevelStart(currentLevel);
  const levelEnd = xpForNextLevel(currentLevel);
  const xpToNextLevel = levelEnd - (totalXP - levelStart);

  const allAchievements = await db.select().from(achievementsTable);
  const userAchievements = await db.select().from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));
  const unlockedMap = new Map(userAchievements.map(ua => [ua.achievementId, ua.unlockedAt]));

  const achievements = allAchievements.map(a => ({
    id: a.id,
    key: a.key,
    title: a.title,
    description: a.description,
    icon: a.icon,
    xpReward: a.xpReward,
    unlockedAt: unlockedMap.get(a.id) ?? null,
  }));

  res.json(GetGamificationProfileResponse.parse({
    userId,
    totalXP,
    currentLevel,
    xpToNextLevel,
    xpForCurrentLevel: levelEnd,
    currentStreak,
    longestStreak,
    lastActivityDate: lastActivityDate?.toISOString() ?? null,
    achievements,
    dailyGoalMinutes: 20,
    todayMinutes: 0,
  }));
});

router.get("/gamification/achievements", authMiddleware, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);

  const allAchievements = await db.select().from(achievementsTable);
  const userAchievements = await db.select().from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));
  const unlockedMap = new Map(userAchievements.map(ua => [ua.achievementId, ua.unlockedAt]));

  const achievements = allAchievements.map(a => ({
    id: a.id,
    key: a.key,
    title: a.title,
    description: a.description,
    icon: a.icon,
    xpReward: a.xpReward,
    unlockedAt: unlockedMap.get(a.id) ?? null,
  }));

  res.json(ListAchievementsResponse.parse(achievements));
});

router.get("/leaderboard", authMiddleware, async (_req, res): Promise<void> => {
  const allXP = await db.select().from(userXPTable)
    .orderBy(desc(userXPTable.totalXP))
    .limit(20);

  const entries = await Promise.all(allXP.map(async (xpRow, index) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, xpRow.userId));
    const [streak] = await db.select().from(userStreaksTable).where(eq(userStreaksTable.userId, xpRow.userId));

    return {
      rank: index + 1,
      userId: xpRow.userId,
      username: user?.username ?? "unknown",
      displayName: user?.displayName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      totalXP: xpRow.totalXP,
      currentLevel: xpRow.currentLevel,
      currentStreak: streak?.currentStreak ?? 0,
    };
  }));

  res.json(GetLeaderboardResponse.parse(entries));
});

export default router;
