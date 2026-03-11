import { db } from "@workspace/db";
import {
  userXPTable,
  userStreaksTable,
  achievementsTable,
  userAchievementsTable,
  userLessonProgressTable,
  userCourseEnrollmentsTable,
} from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / 100) + 1;
}

export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

export function xpForCurrentLevelStart(currentLevel: number): number {
  return (currentLevel - 1) * 100;
}

export async function awardXP(userId: number, xp: number): Promise<number> {
  const existing = await db.select().from(userXPTable).where(eq(userXPTable.userId, userId));

  if (existing.length === 0) {
    const [row] = await db.insert(userXPTable).values({
      userId,
      totalXP: xp,
      currentLevel: calculateLevel(xp),
    }).returning();
    return row.totalXP;
  }

  const newTotal = existing[0].totalXP + xp;
  const [row] = await db.update(userXPTable)
    .set({ totalXP: newTotal, currentLevel: calculateLevel(newTotal) })
    .where(eq(userXPTable.userId, userId))
    .returning();
  return row.totalXP;
}

export async function updateStreak(userId: number): Promise<{ updated: boolean; currentStreak: number }> {
  const existing = await db.select().from(userStreaksTable).where(eq(userStreaksTable.userId, userId));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (existing.length === 0) {
    await db.insert(userStreaksTable).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: now,
    });
    return { updated: true, currentStreak: 1 };
  }

  const streak = existing[0];
  const lastActivity = streak.lastActivityDate;

  if (!lastActivity) {
    await db.update(userStreaksTable).set({
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: now,
    }).where(eq(userStreaksTable.userId, userId));
    return { updated: true, currentStreak: 1 };
  }

  const lastDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
  const diffMs = today.getTime() - lastDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { updated: false, currentStreak: streak.currentStreak };
  }

  let newStreak: number;
  if (diffDays === 1) {
    newStreak = streak.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(streak.longestStreak, newStreak);
  await db.update(userStreaksTable).set({
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActivityDate: now,
  }).where(eq(userStreaksTable.userId, userId));

  return { updated: true, currentStreak: newStreak };
}

export async function checkAndUnlockAchievements(userId: number): Promise<Array<{
  id: number; key: string; title: string; description: string; icon: string; xpReward: number; unlockedAt: Date | null;
}>> {
  const allAchievements = await db.select().from(achievementsTable);
  const userAchievements = await db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId));
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

  const completedLessonsResult = await db.select({ count: count() }).from(userLessonProgressTable)
    .where(eq(userLessonProgressTable.userId, userId));
  const completedLessons = completedLessonsResult[0]?.count ?? 0;

  const xpRow = await db.select().from(userXPTable).where(eq(userXPTable.userId, userId));
  const totalXP = xpRow[0]?.totalXP ?? 0;

  const streakRow = await db.select().from(userStreaksTable).where(eq(userStreaksTable.userId, userId));
  const currentStreak = streakRow[0]?.currentStreak ?? 0;

  const completedCoursesResult = await db.select({ count: count() }).from(userCourseEnrollmentsTable)
    .where(and(eq(userCourseEnrollmentsTable.userId, userId)));
  const enrollments = await db.select().from(userCourseEnrollmentsTable)
    .where(eq(userCourseEnrollmentsTable.userId, userId));
  const completedCourses = enrollments.filter(e => e.completedAt !== null).length;

  const newlyUnlocked: typeof allAchievements = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;
    switch (achievement.key) {
      case "first_lesson": shouldUnlock = Number(completedLessons) >= 1; break;
      case "lesson_5": shouldUnlock = Number(completedLessons) >= 5; break;
      case "lesson_25": shouldUnlock = Number(completedLessons) >= 25; break;
      case "lesson_100": shouldUnlock = Number(completedLessons) >= 100; break;
      case "streak_3": shouldUnlock = currentStreak >= 3; break;
      case "streak_7": shouldUnlock = currentStreak >= 7; break;
      case "streak_30": shouldUnlock = currentStreak >= 30; break;
      case "xp_100": shouldUnlock = totalXP >= 100; break;
      case "xp_500": shouldUnlock = totalXP >= 500; break;
      case "xp_1000": shouldUnlock = totalXP >= 1000; break;
      case "first_course": shouldUnlock = completedCourses >= 1; break;
    }

    if (shouldUnlock) {
      await db.insert(userAchievementsTable).values({
        userId,
        achievementId: achievement.id,
      });
      newlyUnlocked.push(achievement);
      if (achievement.xpReward > 0) {
        await awardXP(userId, achievement.xpReward);
      }
    }
  }

  return newlyUnlocked.map(a => ({
    id: a.id,
    key: a.key,
    title: a.title,
    description: a.description,
    icon: a.icon,
    xpReward: a.xpReward,
    unlockedAt: new Date(),
  }));
}
