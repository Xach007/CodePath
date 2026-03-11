import { useListCourses } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function Courses() {
  const { data: courses, isLoading } = useListCourses();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 text-center md:text-left"
      >
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-3">Course Library</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Choose a path and start mastering a new skill.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {courses?.map((course) => (
            <motion.div key={course.id} variants={item}>
              <Link href={`/courses/${course.id}`}>
                <Card className="group h-full rounded-3xl overflow-hidden border-border/50 shadow-sm hover:shadow-xl card-hover cursor-pointer flex flex-col">
                  <div className={`h-44 p-6 flex items-center justify-center relative overflow-hidden ${
                    course.language.toLowerCase() === 'python' ? 'bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-cyan-500/10' : 
                    course.language.toLowerCase() === 'javascript' ? 'bg-gradient-to-br from-yellow-500/10 via-amber-400/5 to-orange-500/10' : 
                    'bg-gradient-to-br from-primary/10 to-primary/5'
                  }`}>
                    <div className="text-6xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 relative z-10 drop-shadow-sm">
                      {course.language.toLowerCase() === 'python' ? '🐍' : 
                       course.language.toLowerCase() === 'javascript' ? '⚡' : '💻'}
                    </div>
                    <Badge variant="secondary" className="absolute top-4 right-4 z-20 font-semibold capitalize bg-background/80 backdrop-blur-sm border-border/50 text-xs">
                      {course.difficulty}
                    </Badge>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col bg-card">
                    <h3 className="text-xl font-bold font-display mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">{course.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">{course.description}</p>
                    
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/30">
                      <div className="flex flex-col items-center justify-center text-center">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                        <span className="text-xs font-bold">{course.totalLessons}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Lessons</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center border-x border-border/30">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                        <span className="text-xs font-bold">{course.estimatedHours}h</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center">
                        <Star className="w-3.5 h-3.5 text-accent fill-accent mb-1" />
                        <span className="text-xs font-bold text-accent">{course.xpReward}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
