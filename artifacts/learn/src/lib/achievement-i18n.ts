import type { TFunction } from "i18next";

type AchievementLike = {
  key?: string | null;
  title?: string | null;
  description?: string | null;
};

function getAchievementKey(achievement: AchievementLike | null | undefined) {
  return (achievement?.key ?? "").trim();
}

export function translateAchievementTitle(t: TFunction, achievement: AchievementLike | null | undefined) {
  const key = getAchievementKey(achievement);
  if (!key) return achievement?.title ?? "";
  return t(`achievementContent.${key}.title`, { defaultValue: achievement?.title ?? "" });
}

export function translateAchievementDescription(t: TFunction, achievement: AchievementLike | null | undefined) {
  const key = getAchievementKey(achievement);
  if (!key) return achievement?.description ?? "";
  return t(`achievementContent.${key}.description`, { defaultValue: achievement?.description ?? "" });
}
