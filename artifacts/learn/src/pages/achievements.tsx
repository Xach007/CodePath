import { useListAchievements, useGetGamificationProfile } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { isAchievementUnlocked } from "@/lib/achievements";
import { useTranslation } from "react-i18next";
import { translateAchievementDescription, translateAchievementTitle } from "@/lib/achievement-i18n";

const container = {
  hidden: { opacity: 0.96 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const item = {
  hidden: { opacity: 0, scale: 0.985, y: 14 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } }
};

export default function Achievements() {
  const { t } = useTranslation();
  const { data: allAchievements, isLoading: isAchLoading } = useListAchievements();
  const { data: profile, isLoading: isProfLoading } = useGetGamificationProfile();

  const isLoading = isAchLoading || isProfLoading;
  const unlockedAchievements = profile?.achievements?.filter(isAchievementUnlocked) ?? [];
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const displayedAchievements = allAchievements
    ? [
        ...allAchievements.filter((achievement) => unlockedIds.has(achievement.id)),
        ...allAchievements.filter((achievement) => !unlockedIds.has(achievement.id)),
      ]
    : [];

  return (
    <div className="achievements-page">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.54, ease: [0.16, 1, 0.3, 1] }}
        className="achievements-hero"
      >
        <div className="achievements-hero-icon-wrap">
          <Trophy className="achievements-hero-icon" />
        </div>
        <h1 className="achievements-title">{t("achievements.title")}</h1>
        <p className="achievements-subtitle">
          {t("achievements.subtitleLong")}
        </p>
        
        {!isLoading && profile && (
          <div className="achievements-counter">
            <span className="achievements-counter-label">{t("achievements.unlocked")}</span>
            <span className="achievements-counter-value">
              {unlockedIds.size} <span className="achievements-counter-total">/ {allAchievements?.length || 0}</span>
            </span>
          </div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="achievements-grid">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="achievements-skeleton" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="achievements-grid"
        >
          {displayedAchievements.map((ach) => {
            const isUnlocked = unlockedIds.has(ach.id);
            return (
              <motion.div key={ach.id} variants={item}>
                <Card className={`achievement-card ${
                  isUnlocked 
                    ? "achievement-card--unlocked"
                    : "achievement-card--locked"
                }`}>
                  <CardContent className="achievement-card-content">
                    {!isUnlocked && (
                      <div className="achievement-card-lock">
                        <Lock className="achievement-card-lock-icon" />
                      </div>
                    )}
                    <div className={`achievement-card-icon ${isUnlocked ? "achievement-card-icon--unlocked" : "achievement-card-icon--locked"}`}>
                      {ach.icon}
                    </div>
                    <h3 className={`achievement-card-title ${isUnlocked ? "" : "achievement-card-title--locked"}`}>
                      {translateAchievementTitle(t, ach)}
                    </h3>
                    <p className="achievement-card-description">
                      {translateAchievementDescription(t, ach)}
                    </p>
                    {isUnlocked ? (
                      <div className="achievement-card-badge achievement-card-badge--unlocked">
                        {t("achievements.unlocked")}
                      </div>
                    ) : (
                      <div className="achievement-card-badge achievement-card-badge--locked">
                        {t("achievements.locked")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
