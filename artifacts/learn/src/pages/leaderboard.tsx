import { useGetLeaderboard, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal, Flame, Star, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: currentUser } = useGetMe();

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case 2: return "text-gray-400 bg-gray-400/10 border-gray-400/30";
      case 3: return "text-amber-700 bg-amber-700/10 border-amber-700/30";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className="w-5 h-5 fill-current" />;
    return <span className="font-bold font-display text-lg">{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="text-center mb-12">
        <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-6">
          <Medal className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4">Top Learners</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Compete with the community. Earn XP by completing lessons and challenges to climb the ranks.
        </p>
      </div>

      <Card className="rounded-3xl border-border shadow-xl shadow-black/5 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 md:px-8">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-5 md:col-span-6">User</div>
          <div className="col-span-3 md:col-span-2 text-right">XP</div>
          <div className="col-span-2 text-right hidden md:block">Level</div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center p-6"><Skeleton className="h-12 w-full" /></div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaderboard?.map((entry, idx) => {
                const isMe = currentUser?.id === entry.userId;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={entry.userId} 
                    className={`grid grid-cols-12 gap-4 p-4 px-6 md:px-8 items-center transition-colors hover:bg-muted/30 ${isMe ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                  >
                    {/* Rank */}
                    <div className="col-span-2 flex justify-center">
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="col-span-5 md:col-span-6 flex items-center gap-4 min-w-0">
                      <Avatar className="w-12 h-12 border-2 border-background shadow-sm shrink-0">
                        <AvatarImage src={entry.avatarUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {entry.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold font-display text-lg truncate flex items-center gap-2">
                          {entry.displayName || entry.username}
                          {isMe && <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Flame className="w-3 h-3 text-accent fill-accent" /> {entry.currentStreak} day streak
                        </p>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-1.5 font-bold font-display text-lg">
                      {entry.totalXP.toLocaleString()}
                      <Star className="w-4 h-4 text-accent fill-accent shrink-0" />
                    </div>

                    {/* Level */}
                    <div className="col-span-2 justify-end hidden md:flex">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                        {entry.currentLevel}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          {!isLoading && (!leaderboard || leaderboard.length === 0) && (
            <div className="p-12 text-center text-muted-foreground">
              No users on the leaderboard yet. Be the first!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
