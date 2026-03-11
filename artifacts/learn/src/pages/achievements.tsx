import { useListAchievements, useGetGamificationProfile } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Achievements() {
  const { data: allAchievements, isLoading: isAchLoading } = useListAchievements();
  const { data: profile, isLoading: isProfLoading } = useGetGamificationProfile();

  const isLoading = isAchLoading || isProfLoading;

  // Create a map of unlocked achievement IDs for easy lookup
  const unlockedIds = new Set(profile?.achievements?.map(a => a.id) || []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10">
          <Trophy className="w-10 h-10 fill-current" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4">Achievements</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Complete courses, maintain your streak, and ace quizzes to unlock badges and show off your skills.
        </p>
        
        {!isLoading && profile && (
          <div className="mt-8 inline-flex items-center gap-4 bg-card px-6 py-3 rounded-full border border-border shadow-sm">
            <span className="font-bold text-muted-foreground uppercase tracking-wide text-sm">Unlocked</span>
            <span className="text-2xl font-display font-black text-primary">{unlockedIds.size} <span className="text-muted-foreground text-lg">/ {allAchievements?.length || 0}</span></span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
        >
          {allAchievements?.map((ach) => {
            const isUnlocked = unlockedIds.has(ach.id);
            return (
              <motion.div key={ach.id} variants={item}>
                <Card className={`h-full rounded-3xl border text-center transition-all duration-300 ${
                  isUnlocked 
                    ? 'border-primary/30 shadow-lg shadow-primary/5 bg-gradient-to-b from-card to-primary/5 hover:-translate-y-1' 
                    : 'border-border border-dashed bg-muted/30 opacity-70 grayscale'
                }`}>
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full relative">
                    {!isUnlocked && (
                      <div className="absolute top-4 right-4">
                        <Lock className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className={`text-5xl mb-4 ${!isUnlocked && 'opacity-50'}`}>
                      {ach.icon}
                    </div>
                    <h3 className={`font-bold font-display leading-tight mb-2 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {ach.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {ach.description}
                    </p>
                    {isUnlocked && (
                      <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
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
