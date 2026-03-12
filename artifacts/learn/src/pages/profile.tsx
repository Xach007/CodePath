import { useGetMe, useGetUserProgress, useGetGamificationProfile } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Calendar, Flame, Star, Trophy, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

export default function Profile() {
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: progress, isLoading: isLoadingProgress } = useGetUserProgress();
  const { data: gamification, isLoading: isLoadingGame } = useGetGamificationProfile();
  const { t } = useTranslation();

  const isLoading = isLoadingUser || isLoadingProgress || isLoadingGame;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>
      </div>
    );
  }

  if (!user || !gamification) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8"
    >
      <motion.div variants={fadeUp}>
        <Card className="rounded-3xl border-border/50 overflow-hidden bg-card shadow-sm">
          <div className="h-28 bg-gradient-to-r from-primary/20 via-[hsl(280,80%,60%)]/15 to-accent/15" />
          <div className="px-8 pb-8 relative">
            <Avatar className="w-20 h-20 border-4 border-card absolute -top-10 shadow-lg">
              <AvatarImage src={user.avatarUrl || ""} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-2xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="pt-14">
              <h1 className="text-2xl font-display font-bold">{user.displayName || user.username}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                @{user.username} <span className="opacity-30">·</span> <Calendar className="w-3.5 h-3.5" /> {t("profile.joined")} {joinDate}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div variants={fadeUp} className="space-y-6">
          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-base mb-5">{t("profile.stats")}</h3>
              <div className="space-y-5">
                {[
                  { icon: Flame, label: t("dashboard.streak"), value: gamification.currentStreak, color: "text-accent", bg: "bg-accent/10" },
                  { icon: Star, label: t("dashboard.totalXP"), value: gamification.totalXP, color: "text-primary", bg: "bg-primary/10" },
                  { icon: Trophy, label: t("achievements.title"), value: gamification.achievements?.length || 0, color: "text-purple-500", bg: "bg-purple-500/10" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                      <stat.icon className={`w-5 h-5 ${stat.icon === Flame || stat.icon === Star ? 'fill-current' : ''}`} />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="md:col-span-2 space-y-6">
          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardContent className="p-7">
              <div className="flex justify-between items-end mb-5">
                <div>
                  <h3 className="font-display font-bold text-xl">{t("dashboard.level")} {gamification.currentLevel}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{t("profile.keepLearning")}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[hsl(280,80%,60%)] flex items-center justify-center text-white font-display font-black text-xl shadow-lg shadow-primary/25">
                  {gamification.currentLevel}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-primary">{gamification.xpForCurrentLevel} XP</span>
                  <span className="text-muted-foreground">{gamification.xpForCurrentLevel + gamification.xpToNextLevel} XP</span>
                </div>
                <Progress 
                  value={(gamification.xpForCurrentLevel / (gamification.xpForCurrentLevel + gamification.xpToNextLevel)) * 100} 
                  className="h-3 rounded-full bg-muted" 
                  indicatorClassName="bg-gradient-to-r from-primary to-[hsl(280,80%,60%)]" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardContent className="p-7">
              <h3 className="font-display font-bold text-base mb-5">{t("profile.courseProgress")}</h3>
              
              {progress?.coursesProgress?.length ? (
                <div className="space-y-5">
                  {progress.coursesProgress.map((cp: any) => (
                    <div key={cp.courseId}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-sm">{cp.courseTitle}</p>
                        <p className="text-xs text-primary font-bold">{cp.percentComplete}%</p>
                      </div>
                      <Progress value={cp.percentComplete} className="h-2 mb-1.5" indicatorClassName="bg-gradient-to-r from-primary to-[hsl(280,80%,60%)]" />
                      <p className="text-xs text-muted-foreground">{cp.completedLessons} / {cp.totalLessons} {t("courses.lessons")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t("profile.noCourses")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
