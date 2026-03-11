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
import { Play, Trophy, Flame, Star, ArrowRight } from "lucide-react";

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

  if (!user && !isLoadingUser) {
    setLocation("/");
    return null;
  }

  const isLoading = isLoadingUser || isLoadingProgress || isLoadingGame;

  // Find the course the user is currently working on (started but not completed, highest percent)
  const activeCourseProgress = progress?.coursesProgress
    ?.filter(c => c.startedAt && !c.completedAt)
    ?.sort((a, b) => b.percentComplete - a.percentComplete)[0];

  const activeCourse = activeCourseProgress 
    ? allCourses?.find(c => c.id === activeCourseProgress.courseId)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      {/* Header & Welcome */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">
            {isLoading ? <Skeleton className="h-10 w-64" /> : `Welcome back, ${user?.displayName || user?.username}!`}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Ready to continue your coding journey?
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Continue Learning & Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning Card */}
          <section>
            <h2 className="text-2xl font-display font-bold mb-4">Jump Back In</h2>
            {isLoading ? (
              <Skeleton className="w-full h-48 rounded-3xl" />
            ) : activeCourseProgress && activeCourse ? (
              <Card className="rounded-3xl border-border overflow-hidden shadow-lg shadow-primary/5 hover:shadow-xl transition-all duration-300">
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-card to-muted/30">
                  <div className="w-24 h-24 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
                    {activeCourse.imageUrl ? (
                      <img src={activeCourse.imageUrl} alt={activeCourse.title} className="w-16 h-16 object-contain" />
                    ) : (
                      <span className="text-4xl">🚀</span>
                    )}
                  </div>
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-3">
                      Course in Progress
                    </div>
                    <h3 className="text-2xl font-bold font-display mb-2">{activeCourse.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start mb-4">
                      <span>{activeCourseProgress.completedLessons} / {activeCourseProgress.totalLessons} lessons</span>
                      <div className="w-1 h-1 rounded-full bg-border"></div>
                      <span>{activeCourseProgress.percentComplete}% Complete</span>
                    </div>
                    <Progress value={activeCourseProgress.percentComplete} className="h-2 mb-6 w-full" indicatorClassName="bg-primary" />
                    <Link href={`/courses/${activeCourse.id}`}>
                      <Button className="w-full md:w-auto rounded-xl px-8 h-12 font-bold shadow-md shadow-primary/20 hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Continue Course
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="rounded-3xl border-dashed border-2 border-border bg-transparent p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold font-display mb-2">No active courses</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">Start a course to begin earning XP and unlocking achievements.</p>
                <Link href="/courses">
                  <Button className="rounded-xl px-8 font-bold">Browse Courses</Button>
                </Link>
              </Card>
            )}
          </section>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total XP", value: progress?.totalXP || 0, icon: Star, color: "text-primary", bg: "bg-primary/10" },
              { label: "Day Streak", value: gamification?.currentStreak || 0, icon: Flame, color: "text-accent", bg: "bg-accent/10" },
              { label: "Completed", value: progress?.completedLessons || 0, icon: BookOpen, color: "text-success", bg: "bg-success/10" },
              { label: "Courses", value: progress?.completedCourses || 0, icon: Trophy, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((stat, i) => (
              <Card key={i} className="rounded-2xl border-border hover:-translate-y-1 transition-transform duration-200">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color} ${stat.icon === Star || stat.icon === Flame ? 'fill-current' : ''}`} />
                  </div>
                  <div className="text-2xl font-display font-bold leading-none mb-1">{isLoading ? <Skeleton className="w-8 h-8 mx-auto" /> : stat.value}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>

        {/* Right Column: Profile & Gamification */}
        <div className="space-y-8">
          <Card className="rounded-3xl border-border shadow-lg shadow-black/5 overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <h3 className="font-display font-bold text-lg relative z-10">Your Level</h3>
              <div className="text-6xl font-display font-black mt-2 mb-1 relative z-10">{gamification?.currentLevel || 1}</div>
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span>{gamification?.xpForCurrentLevel || 0} XP</span>
                <span className="text-muted-foreground">Next: {(gamification?.xpForCurrentLevel || 0) + (gamification?.xpToNextLevel || 100)} XP</span>
              </div>
              <Progress 
                value={
                  gamification 
                    ? (gamification.xpForCurrentLevel / (gamification.xpForCurrentLevel + gamification.xpToNextLevel)) * 100 
                    : 0
                } 
                className="h-3 w-full bg-muted" 
                indicatorClassName="bg-accent" 
              />
              <p className="text-center text-sm text-muted-foreground mt-4 font-medium">
                {gamification?.xpToNextLevel || 0} XP to level up!
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border shadow-lg shadow-black/5">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-display font-bold text-lg">Recent Achievements</h3>
              <Link href="/achievements" className="text-primary text-sm font-bold hover:underline">View All</Link>
            </div>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : gamification?.achievements?.length ? (
                <div className="divide-y divide-border">
                  {gamification.achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-2xl shrink-0">
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Complete lessons to earn your first achievement!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Ensure icons import is at top
import { BookOpen } from "lucide-react";
