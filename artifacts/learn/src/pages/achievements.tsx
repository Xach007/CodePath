import { useListAchievements, useGetGamificationProfile } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const item = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

export default function Achievements() {
  const { data: allAchievements, isLoading: isAchLoading } = useListAchievements();
  const { data: profile, isLoading: isProfLoading } = useGetGamificationProfile();

  const isLoading = isAchLoading || isProfLoading;
  const unlockedIds = new Set(profile?.achievements?.map(a => a.id) || []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/5 text-accent rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-3">Achievements</h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Complete courses, maintain your streak, and ace quizzes to unlock badges.
        </p>
        
        {!isLoading && profile && (
          <div className="mt-6 inline-flex items-center gap-3 bg-card px-5 py-2.5 rounded-full border border-border/50 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unlocked</span>
            <span className="text-xl font-display font-bold text-primary">{unlockedIds.size} <span className="text-muted-foreground text-sm font-normal">/ {allAchievements?.length || 0}</span></span>
          </div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {allAchievements?.map((ach) => {
            const isUnlocked = unlockedIds.has(ach.id);
            return (
              <motion.div key={ach.id} variants={item}>
                <Card className={`h-full rounded-3xl border text-center transition-all duration-500 ${
                  isUnlocked 
                    ? 'border-primary/20 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5' 
                    : 'border-border/30 border-dashed bg-muted/20 opacity-60 grayscale'
                }`}>
                  <CardContent className="p-5 flex flex-col items-center justify-center h-full relative">
                    {!isUnlocked && (
                      <div className="absolute top-3 right-3">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className={`text-4xl mb-3 ${!isUnlocked && 'opacity-40'} transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-110' : ''}`}>
                      {ach.icon}
                    </div>
                    <h3 className={`font-bold font-display text-sm leading-tight mb-1.5 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {ach.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {ach.description}
                    </p>
                    {isUnlocked && (
                      <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/8 px-2.5 py-1 rounded-full border border-primary/10">
                        Unlocked
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
