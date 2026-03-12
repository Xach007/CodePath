import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  useGetMe, 
  useGetUserProgress, 
  useGetGamificationProfile,
  useListCourses
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Play, Trophy, Flame, Star, ArrowRight, BookOpen, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: progress, isLoading: isLoadingProgress } = useGetUserProgress({
    query: { enabled: !!user }
  });
  const { data: gamification, isLoading: isLoadingGame } = useGetGamificationProfile({
    query: { enabled: !!user }
  });
  const { data: allCourses } = useListCourses({
    query: { enabled: !!user }
  });

  useEffect(() => {
    if (!user && !isLoadingUser) {
      setLocation("/");
    }
  }, [user, isLoadingUser, setLocation]);

  if (!user && !isLoadingUser) {
    return null;
  }

  const isLoading = isLoadingUser || isLoadingProgress || isLoadingGame;

  const activeCourseProgress = progress?.coursesProgress
    ?.filter(c => c.startedAt && !c.completedAt)
    ?.sort((a, b) => b.percentComplete - a.percentComplete)[0];

  const activeCourse = activeCourseProgress 
    ? allCourses?.find(c => c.id === activeCourseProgress.courseId)
    : null;

  const statCards = [
    { label: "Total XP", value: progress?.totalXP || 0, icon: Star, color: "text-primary", bg: "bg-primary/10", glow: "group-hover:shadow-primary/10" },
    { label: "Day Streak", value: gamification?.currentStreak || 0, icon: Flame, color: "text-accent", bg: "bg-accent/10", glow: "group-hover:shadow-accent/10" },
    { label: "Completed", value: progress?.completedLessons || 0, icon: BookOpen, color: "text-success", bg: "bg-success/10", glow: "group-hover:shadow-success/10" },
    { label: "Level", value: gamification?.currentLevel || 1, icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10", glow: "group-hover:shadow-purple-500/10" },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10"
    >
      <motion.section variants={fadeUp}>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">
          {isLoading ? <Skeleton className="h-10 w-64" /> : (
            <>Welcome back, <span className="gradient-text">{user?.displayName || user?.username}</span></>
          )}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Ready to continue your coding journey?</p>
      </motion.section>

      <motion.section variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className={`group rounded-2xl border-border/50 bg-card hover:-translate-y-0.5 transition-all duration-500 hover:shadow-xl ${stat.glow}`}>
            <CardContent className="p-5 flex flex-col items-center justify-center text-center">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className={`w-5 h-5 ${stat.color} ${stat.icon === Star || stat.icon === Flame ? 'fill-current' : ''}`} />
              </div>
              <div className="text-2xl font-display font-bold leading-none mb-1">
                {isLoading ? <Skeleton className="w-8 h-7 mx-auto rounded-lg" /> : stat.value}
              </div>
              <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.section variants={fadeUp}>
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Jump Back In
            </h2>
            {isLoading ? (
              <Skeleton className="w-full h-52 rounded-3xl" />
            ) : activeCourseProgress && activeCourse ? (
              <Card className="group rounded-3xl border-border/50 overflow-hidden shadow-lg shadow-black/[0.03] hover:shadow-xl transition-all duration-500">
                <div className="p-7 md:p-8 flex flex-col md:flex-row gap-8 items-center relative">
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.03] to-transparent pointer-events-none" />
                  <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
                    {activeCourse.imageUrl ? (
                      <img src={activeCourse.imageUrl} alt={activeCourse.language} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-4xl">💻</span>
                    )}
                  </div>
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold tracking-wide uppercase mb-3 border border-primary/10">
                      In Progress
                    </div>
                    <h3 className="text-2xl font-bold font-display mb-2">{activeCourse.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start mb-4">
                      <span>{activeCourseProgress.completedLessons} / {activeCourseProgress.totalLessons} lessons</span>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <span className="font-semibold text-primary">{activeCourseProgress.percentComplete}%</span>
                    </div>
                    <Progress value={activeCourseProgress.percentComplete} className="h-2 mb-6 w-full bg-muted" indicatorClassName="bg-gradient-to-r from-primary to-[hsl(280,80%,60%)]" />
                    <Link href={`/courses/${activeCourse.id}`}>
                      <Button className="w-full md:w-auto rounded-xl px-8 h-11 font-semibold shadow-lg shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Continue Course
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="rounded-3xl border-dashed border-2 border-border/50 bg-transparent p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold font-display mb-2">No active courses</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">Start a course to begin earning XP and unlocking achievements.</p>
                <Link href="/courses">
                  <Button className="rounded-xl px-8 font-semibold">Browse Courses</Button>
                </Link>
              </Card>
            )}
          </motion.section>

          {allCourses && allCourses.length > 0 && (
            <motion.section variants={fadeUp}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold">Explore Courses</h2>
                <Link href="/courses" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allCourses.slice(0, 2).map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card className="group rounded-2xl border-border/50 overflow-hidden card-hover cursor-pointer h-full">
                      <div className={`h-28 p-5 flex items-center justify-center relative overflow-hidden ${
                        course.language.toLowerCase() === 'python' ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5' : 
                        course.language.toLowerCase() === 'javascript' ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/5' :
                        course.language.toLowerCase() === 'html' ? 'bg-gradient-to-br from-orange-500/10 to-red-500/5' :
                        course.language.toLowerCase() === 'css' ? 'bg-gradient-to-br from-blue-600/10 to-indigo-500/5' :
                        'bg-gradient-to-br from-primary/10 to-primary/5'
                      }`}>
                        {course.imageUrl ? (
                          <img src={course.imageUrl} alt={course.language} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <span className="text-5xl group-hover:scale-110 transition-transform duration-500">💻</span>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-bold font-display text-base mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{course.totalLessons} lessons</span>
                          <span className="flex items-center text-accent font-semibold"><Star className="w-3 h-3 mr-0.5 fill-current" /> {course.xpReward} XP</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        <div className="space-y-6">
          <motion.div variants={fadeUp}>
            <Card className="rounded-3xl border-border/50 shadow-lg shadow-black/[0.03] overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-[hsl(280,80%,60%)] p-6 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_white/10,_transparent_50%)]" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-80 relative z-10">Your Level</h3>
                <div className="text-6xl font-display font-black mt-1 mb-1 relative z-10">{gamification?.currentLevel || 1}</div>
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-primary">{gamification?.xpForCurrentLevel || 0} XP</span>
                  <span className="text-muted-foreground">{(gamification?.xpForCurrentLevel || 0) + (gamification?.xpToNextLevel || 100)} XP</span>
                </div>
                <Progress 
                  value={
                    gamification 
                      ? (gamification.xpForCurrentLevel / (gamification.xpForCurrentLevel + gamification.xpToNextLevel)) * 100 
                      : 0
                  } 
                  className="h-2.5 w-full bg-muted" 
                  indicatorClassName="bg-gradient-to-r from-primary to-[hsl(280,80%,60%)]" 
                />
                <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                  {gamification?.xpToNextLevel || 0} XP to level up
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="rounded-3xl border-border/50 shadow-lg shadow-black/[0.03]">
              <div className="p-5 border-b border-border/50 flex justify-between items-center">
                <h3 className="font-display font-bold">Recent Achievements</h3>
                <Link href="/achievements" className="text-primary text-xs font-semibold hover:text-primary/80 transition-colors">View All</Link>
              </div>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : gamification?.achievements?.length ? (
                  <div className="divide-y divide-border/50">
                    {gamification.achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="p-4 flex items-center gap-3.5 hover:bg-muted/30 transition-colors duration-300">
                        <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-xl shrink-0">
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{achievement.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Complete lessons to earn achievements!
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
