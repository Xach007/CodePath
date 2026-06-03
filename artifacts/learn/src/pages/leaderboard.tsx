import { useGetLeaderboard, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal, Flame, Star, Trophy, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Leaderboard() {
  const { t } = useTranslation();
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: currentUser } = useGetMe();

  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1:
        return {
          badgeClass: "leaderboard-rank-badge leaderboard-rank-badge--first",
          icon: <Crown className="leaderboard-rank-icon leaderboard-rank-icon--first" />,
        };
      case 2:
        return {
          badgeClass: "leaderboard-rank-badge leaderboard-rank-badge--second",
          icon: <Trophy className="leaderboard-rank-icon leaderboard-rank-icon--second" />,
        };
      case 3:
        return {
          badgeClass: "leaderboard-rank-badge leaderboard-rank-badge--third",
          icon: <Trophy className="leaderboard-rank-icon leaderboard-rank-icon--third" />,
        };
      default:
        return {
          badgeClass: "leaderboard-rank-badge leaderboard-rank-badge--default",
          icon: <span className="leaderboard-rank-number">{rank}</span>,
        };
    }
  };

  return (
    <div className="leaderboard-page">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.54, ease: [0.16, 1, 0.3, 1] }}
        className="leaderboard-hero"
      >
        <div className="leaderboard-hero-icon-wrap">
          <Medal className="leaderboard-hero-icon" />
        </div>
        <h1 className="leaderboard-title">{t("leaderboard.titleTop")}</h1>
        <p className="leaderboard-subtitle">
          {t("leaderboard.subtitleLong")}
        </p>
      </motion.div>

      <Card className="leaderboard-card">
        <div className="leaderboard-head">
          <div className="leaderboard-head-rank">{t("leaderboard.rank")}</div>
          <div className="leaderboard-head-learner">{t("leaderboard.learner")}</div>
          <div className="leaderboard-head-xp">{t("leaderboard.xp")}</div>
          <div className="leaderboard-head-level">{t("leaderboard.level")}</div>
        </div>

        <CardContent className="leaderboard-card-content">
          {isLoading ? (
            <div className="leaderboard-loading">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="leaderboard-loading-row">
                  <Skeleton className="leaderboard-loading-skeleton" />
                </div>
              ))}
            </div>
          ) : (
            <div className="leaderboard-list">
              {leaderboard?.map((entry, idx) => {
                const isMe = currentUser?.id === entry.userId;
                const rank = getRankStyle(entry.rank);
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.055, duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
                    key={entry.userId} 
                    className={`leaderboard-row ${isMe ? "leaderboard-row--me" : ""}`}
                  >
                    <div className="leaderboard-col-rank">
                      <div className={rank.badgeClass}>
                        {rank.icon}
                      </div>
                    </div>

                    <div className="leaderboard-col-user">
                      <Avatar className="leaderboard-user-avatar">
                        <AvatarImage src={entry.avatarUrl || ""} />
                        <AvatarFallback className="leaderboard-user-avatar-fallback">
                          {entry.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leaderboard-user-meta">
                        <p className="leaderboard-user-name">
                          {entry.displayName || entry.username}
                          {isMe && <span className="leaderboard-you-badge">{t("leaderboard.you")}</span>}
                        </p>
                        <p className="leaderboard-user-streak">
                          <Flame className="leaderboard-user-streak-icon" /> {t("leaderboard.dayStreak", { count: entry.currentStreak })}
                        </p>
                      </div>
                    </div>

                    <div className="leaderboard-col-xp">
                      {entry.totalXP.toLocaleString()}
                      <Star className="leaderboard-col-xp-icon" />
                    </div>

                    <div className="leaderboard-col-level">
                      <div className="leaderboard-level-badge">
                        {entry.currentLevel}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          {!isLoading && (!leaderboard || leaderboard.length === 0) && (
            <div className="leaderboard-empty">
              {t("leaderboard.empty")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
