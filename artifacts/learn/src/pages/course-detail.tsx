import { useParams } from "wouter";
import { Link } from "wouter";
import { useGetCourse, useGetCourseProgress } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Play, Lock, CheckCircle2, Star, Clock, BookOpen, FileText, HelpCircle, Code2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function CourseDetail() {
  const params = useParams();
  const courseId = parseInt(params.id || "0");
  
  const { data: course, isLoading: isLoadingCourse } = useGetCourse(courseId, { query: { enabled: !!courseId } });
  const { data: progress, isLoading: isLoadingProgress } = useGetCourseProgress(courseId, { query: { enabled: !!courseId } });

  if (isLoadingCourse || isLoadingProgress) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-20 text-xl font-bold">Course not found</div>;
  }

  // Determine the next unlocked lesson. 
  // In a real app, backend determines `isUnlocked`. Here we derive it simply:
  // Find the first module/lesson that is not completed.
  let nextLessonId: number | null = null;
  
  if (course.modules) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        // Mocking completion status based on total completed lessons count for simplicity
        // Ideally, progress endpoint returns an array of completed lesson IDs.
        // If we don't have detailed lesson status, we just offer starting at module 1, lesson 1.
        if (!nextLessonId) nextLessonId = lesson.id;
      }
    }
  }

  const LessonIcon = ({ type, isCompleted }: { type: string, isCompleted: boolean }) => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-success fill-success/20" />;
    switch (type) {
      case 'theory': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'quiz': return <HelpCircle className="w-5 h-5 text-purple-500" />;
      case 'challenge': return <Code2 className="w-5 h-5 text-orange-500" />;
      default: return <BookOpen className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="pb-24">
      {/* Hero Header */}
      <div className="bg-card border-b border-border pt-8 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/courses" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-6">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Courses
          </Link>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className={`w-32 h-32 rounded-3xl shrink-0 flex items-center justify-center border-4 border-background shadow-xl ${
              course.language.toLowerCase() === 'python' ? 'bg-blue-500/10' : 
              course.language.toLowerCase() === 'javascript' ? 'bg-yellow-500/10' : 
              'bg-primary/10'
            }`}>
              {course.imageUrl ? (
                <img src={course.imageUrl} alt="" className="w-20 h-20 object-contain drop-shadow-md" />
              ) : (
                <span className="text-5xl drop-shadow-md">
                  {course.language.toLowerCase() === 'python' ? '🐍' : '💻'}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="font-bold">{course.language}</Badge>
                <Badge variant="outline" className="font-bold">{course.difficulty}</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground">{course.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 bg-background rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><BookOpen className="w-5 h-5 text-primary" /></div>
              <div><p className="text-sm font-bold">{course.totalLessons}</p><p className="text-xs text-muted-foreground uppercase">Lessons</p></div>
            </div>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Clock className="w-5 h-5 text-blue-500" /></div>
              <div><p className="text-sm font-bold">{course.estimatedHours}h</p><p className="text-xs text-muted-foreground uppercase">Estimated</p></div>
            </div>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <div className="p-2 bg-accent/10 rounded-lg"><Star className="w-5 h-5 text-accent fill-current" /></div>
              <div><p className="text-sm font-bold text-accent">{course.xpReward}</p><p className="text-xs text-muted-foreground uppercase">Total XP</p></div>
            </div>
            <div className="flex items-center justify-end pl-4">
               <Link href={`/lessons/${nextLessonId}`}>
                <Button size="lg" className="rounded-xl font-bold shadow-lg shadow-primary/20 w-full md:w-auto hover:scale-105 transition-transform">
                  {progress?.percentComplete && progress.percentComplete > 0 ? "Continue Course" : "Start Course"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Syllabus */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        
        {progress && progress.percentComplete > 0 && (
          <section>
            <div className="flex justify-between font-bold mb-2">
              <h2 className="text-xl font-display">Your Progress</h2>
              <span className="text-primary">{progress.percentComplete}%</span>
            </div>
            <Progress value={progress.percentComplete} className="h-4 rounded-full" indicatorClassName="bg-primary" />
          </section>
        )}

        <section>
          <h2 className="text-2xl font-display font-bold mb-6">Course Syllabus</h2>
          <Accordion type="multiple" defaultValue={course.modules?.map((_, i) => `item-${i}`)} className="space-y-4">
            {course.modules?.map((module, mIndex) => (
              <AccordionItem key={module.id} value={`item-${mIndex}`} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm px-2">
                <AccordionTrigger className="hover:no-underline px-4 py-5 group">
                  <div className="flex items-start text-left gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold font-display flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {mIndex + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display">{module.title}</h3>
                      <p className="text-sm text-muted-foreground font-normal mt-1">{module.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2 mt-4 ml-14">
                    {module.lessons?.map((lesson, lIndex) => {
                      // Simplified completed logic for UI mockup
                      const isCompleted = progress ? (mIndex * 10 + lIndex) < progress.completedLessons : false;
                      const isLocked = !isCompleted && (mIndex * 10 + lIndex) > (progress?.completedLessons || 0);

                      return (
                        <div key={lesson.id} className={`flex items-center justify-between p-4 rounded-xl border ${isCompleted ? 'bg-success/5 border-success/20' : isLocked ? 'bg-muted/30 border-transparent opacity-70' : 'bg-card border-border hover:border-primary/30'} transition-colors`}>
                          <div className="flex items-center gap-4">
                            <LessonIcon type={lesson.type} isCompleted={isCompleted} />
                            <div>
                              <p className={`font-bold ${isCompleted ? 'text-foreground' : isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="capitalize">{lesson.type}</span>
                                <span>•</span>
                                <span>{lesson.estimatedMinutes} min</span>
                                <span>•</span>
                                <span className="flex items-center text-accent"><Star className="w-3 h-3 inline mr-0.5 fill-current"/> {lesson.xpReward}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            {isLocked ? (
                              <Lock className="w-5 h-5 text-muted-foreground/50" />
                            ) : (
                              <Link href={`/lessons/${lesson.id}`}>
                                <Button variant={isCompleted ? "outline" : "default"} size="sm" className="rounded-lg font-bold">
                                  {isCompleted ? "Review" : "Start"}
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}
