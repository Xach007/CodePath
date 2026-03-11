import { useListCourses } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Courses() {
  const { data: courses, isLoading } = useListCourses();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4">Course Library</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Choose a path and start mastering a new skill. Earn XP and unlock achievements as you progress.
        </p>
      </div>

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
                <Card className="h-full rounded-3xl overflow-hidden border border-border shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 cursor-pointer group flex flex-col">
                  {/* Card Header Image Area */}
                  <div className={`h-40 p-6 flex items-center justify-center relative overflow-hidden ${
                    course.language.toLowerCase() === 'python' ? 'bg-blue-500/10' : 
                    course.language.toLowerCase() === 'javascript' ? 'bg-yellow-500/10' : 
                    'bg-primary/10'
                  }`}>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-current to-transparent"></div>
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.title} 
                        className="h-24 object-contain group-hover:scale-110 transition-transform duration-500 relative z-10 drop-shadow-xl" 
                      />
                    ) : (
                      <div className="text-6xl group-hover:scale-110 transition-transform duration-500 relative z-10 drop-shadow-xl">
                        {course.language.toLowerCase() === 'python' ? '🐍' : 
                         course.language.toLowerCase() === 'javascript' ? '⚡' : '💻'}
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-4 right-4 z-20 font-bold capitalize bg-background/80 backdrop-blur-sm border-border">
                      {course.difficulty}
                    </Badge>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-6 flex-1 flex flex-col bg-card">
                    <h3 className="text-xl font-bold font-display mb-2 group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">{course.description}</p>
                    
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                      <div className="flex flex-col items-center justify-center text-center">
                        <BookOpen className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-xs font-bold">{course.totalLessons}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">Lessons</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center border-x border-border/50">
                        <Clock className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-xs font-bold">{course.estimatedHours}h</span>
                        <span className="text-[10px] text-muted-foreground uppercase">Time</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center">
                        <Star className="w-4 h-4 text-accent mb-1" />
                        <span className="text-xs font-bold text-accent">{course.xpReward}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">XP</span>
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
