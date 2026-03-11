import { useGetMe, useGetUserProgress, useGetGamificationProfile } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Calendar, Flame, Star, Trophy, BookOpen, Clock } from "lucide-react";

export default function Profile() {
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: progress, isLoading: isLoadingProgress } = useGetUserProgress();
  const { data: gamification, isLoading: isLoadingGame } = useGetGamificationProfile();

  const isLoading = isLoadingUser || isLoadingProgress || isLoadingGame;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4"><Skeleton className="h-32 rounded-2xl"/><Skeleton className="h-32 rounded-2xl"/></div>
      </div>
    );
  }

  if (!user || !gamification) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      
      {/* Profile Header */}
      <Card className="rounded-3xl border-border overflow-hidden bg-card shadow-sm">
        <div className="h-32 bg-gradient-to-r from-primary to-accent opacity-20"></div>
        <div className="px-8 pb-8 relative">
          <Avatar className="w-24 h-24 border-4 border-card absolute -top-12 shadow-lg">
            <AvatarImage src={user.avatarUrl || `${import.meta.env.BASE_URL}images/avatar-placeholder.png`} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="pt-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">{user.displayName || user.username}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                @{user.username} <span className="opacity-50">•</span> <Calendar className="w-4 h-4"/> Joined {joinDate}
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="px-4 py-2 rounded-xl bg-muted/50 border border-border text-center">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Followers</p>
                <p className="font-bold text-lg">0</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-muted/50 border border-border text-center">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Following</p>
                <p className="font-bold text-lg">0</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Col: Stats */}
        <div className="space-y-8">
          <Card className="rounded-3xl border-border shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-xl mb-6">Statistics</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Flame className="w-6 h-6 fill-current"/></div>
                  <div><p className="font-bold text-xl leading-none">{gamification.currentStreak}</p><p className="text-sm text-muted-foreground">Day Streak</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Star className="w-6 h-6 fill-current"/></div>
                  <div><p className="font-bold text-xl leading-none">{gamification.totalXP}</p><p className="text-sm text-muted-foreground">Total XP</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500"><Trophy className="w-6 h-6"/></div>
                  <div><p className="font-bold text-xl leading-none">{gamification.achievements?.length || 0}</p><p className="text-sm text-muted-foreground">Achievements</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Level & Progress */}
        <div className="md:col-span-2 space-y-8">
          
          <Card className="rounded-3xl border-border shadow-sm">
            <CardContent className="p-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="font-display font-bold text-2xl">Level {gamification.currentLevel}</h3>
                  <p className="text-muted-foreground mt-1">Keep learning to level up!</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-black text-2xl shadow-lg shadow-primary/30">
                  {gamification.currentLevel}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-primary">{gamification.xpForCurrentLevel} XP</span>
                  <span className="text-muted-foreground">{gamification.xpForCurrentLevel + gamification.xpToNextLevel} XP</span>
                </div>
                <Progress 
                  value={(gamification.xpForCurrentLevel / (gamification.xpForCurrentLevel + gamification.xpToNextLevel)) * 100} 
                  className="h-4 rounded-full bg-muted" 
                  indicatorClassName="bg-gradient-to-r from-primary to-accent" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border shadow-sm">
            <CardContent className="p-8">
              <h3 className="font-display font-bold text-xl mb-6">Course Progress</h3>
              
              {progress?.coursesProgress?.length ? (
                <div className="space-y-6">
                  {progress.coursesProgress.map(cp => (
                    <div key={cp.courseId}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold">{cp.courseTitle}</p>
                        <p className="text-sm text-primary font-bold">{cp.percentComplete}%</p>
                      </div>
                      <Progress value={cp.percentComplete} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">{cp.completedLessons} / {cp.totalLessons} lessons completed</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>You haven't started any courses yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
