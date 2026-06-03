type AchievementUnlockState = {
  unlockedAt?: string | Date | null;
};

export function isAchievementUnlocked(achievement: AchievementUnlockState): boolean {
  return achievement.unlockedAt != null;
}
