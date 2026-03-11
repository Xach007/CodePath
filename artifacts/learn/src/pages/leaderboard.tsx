import { useGetLeaderboard, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal, Flame, Star, Trophy, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: currentUser } = useGetMe();

  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return { bg: "bg-gradient-to-r from-yellow-500/15 to-amber-500/10", border: "border-yellow-500/20", text: "text-yellow-500", icon: <Crown className="w-5 h-5 fill-yellow-500 text-yellow-500" /> };
      case 2: return { bg: "bg-gradient-to-r from-gray-400/10 to-gray-300/5", border: "border-gray-400/20", text: "text-gray-400", icon: <Trophy className="w-5 h-5 text-gray-400" /> };
      case 3: return { bg: "bg-gradient-to-r from-amber-700/10 to-amber-600/5", border: "border-amber-700/20", text: "text-amber-600", icon: <Trophy className="w-5 h-5 text-amber-600" /> };
      default: return { bg: "bg-transparent", border: "border-border/30", text: "text-muted-foreground", icon: <span className="font-bold font-display text-sm">{rank}</span> };
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-10"
      >
        <div className="inline-flex p-3.5 rounded-2xl bg-primary/8 text-primary mb-5 border border-primary/10">
          <Medal className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-3">Top Learners</h1>
        <p className="text-base text-muted-foreground max-w-md mx-auto">
          Earn XP by completing lessons and challenges to climb the ranks.
        </p>
      </motion.div>

      <Card className="rounded-3xl border-border/50 shadow-lg shadow-black/[0.03] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-6">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-6">Learner</div>
          <div className="col-span-2 text-right">XP</div>
          <div className="col-span-2 text-right hidden md:block">Level</div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border/30">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center p-5 px-6"><Skeleton className="h-12 w-full rounded-xl" /></div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {leaderboard?.map((entry, idx) => {
                const isMe = currentUser?.id === entry.userId;
                const rank = getRankStyle(entry.rank);
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    key={entry.userId} 
                    className={`grid grid-cols-12 gap-4 py-4 px-6 items-center transition-colors duration-300 hover:bg-muted/20 ${isMe ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <div className="col-span-2 flex justify-center">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${rank.bg} ${rank.border} ${rank.text}`}>
                        {rank.icon}
                      </div>
                    </div>

                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10 border-2 border-background shadow-sm shrink-0">
                        <AvatarImage src={entry.avatarUrl || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-bold text-sm">
                          {entry.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate flex items-center gap-2">
                          {entry.displayName || entry.username}
                          {isMe && <span className="bg-primary text-primary-foreground text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">You</span>}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Flame className="w-3 h-3 text-accent fill-accent" /> {entry.currentStreak} day streak
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-1 font-bold text-sm">
                      {entry.totalXP.toLocaleString()}
                      <Star className="w-3.5 h-3.5 text-accent fill-accent shrink-0" />
                    </div>

                    <div className="col-span-2 justify-end hidden md:flex">
                      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center font-bold text-xs border border-border/30">
                        {entry.currentLevel}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          {!isLoading && (!leaderboard || leaderboard.length === 0) && (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No users on the leaderboard yet. Be the first!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
