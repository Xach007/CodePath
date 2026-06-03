import { useParams, Link } from "wouter";
import { useGetCourse, useGetCourseProgress } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Play, Lock, CheckCircle2, Star, Clock, BookOpen, FileText, HelpCircle, Code2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { translateCourseDescription, translateCourseTitle, translateModuleDescription, translateModuleTitle } from "@/lib/course-i18n";
import { translateLessonTitle } from "@/lib/lesson-i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function CourseDetail() {
  const params = useParams();
  const { t } = useTranslation();
  const courseId = parseInt(params.id || "0");
  
  const { data: course, isLoading: isLoadingCourse } = useGetCourse(courseId, { query: { enabled: !!courseId } });
  const { data: progress } = useGetCourseProgress(courseId, { query: { enabled: !!courseId, retry: false } });

  if (isLoadingCourse) {
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
    return <div className="text-center py-20 text-xl font-bold">{t("courses.notFound")}</div>;
  }

  const completedIds = new Set(progress?.completedLessonIds || []);
  const allLessons: { id: number; index: number }[] = [];
  let nextLessonId: number | null = null;
  if (course.modules) {
    let flatIndex = 0;
    for (const module of course.modules) {
      if (module.lessons) {
        for (const lesson of module.lessons) {
          allLessons.push({ id: lesson.id, index: flatIndex });
          if (!nextLessonId && !completedIds.has(lesson.id)) {
            nextLessonId = lesson.id;
          }
          flatIndex++;
        }
      }
    }
    if (!nextLessonId && allLessons.length > 0) {
      nextLessonId = allLessons[0].id;
    }
  }

  const completedCount = progress?.completedLessons || 0;
  const lessonIndexMap = new Map(allLessons.map(l => [l.id, l.index]));

  const LessonIcon = ({ type, isCompleted }: { type: string, isCompleted: boolean }) => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-success" />;
    switch (type) {
      case 'theory': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'quiz': return <HelpCircle className="w-5 h-5 text-purple-500" />;
      case 'challenge': return <Code2 className="w-5 h-5 text-orange-500" />;
      default: return <BookOpen className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="pb-24">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-card border-b border-border/50 pt-8 pb-12"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/courses" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-6 group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t("courses.backToCourses")}
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:flex-row gap-8 items-start md:items-center"
          >
            <div className={`w-28 h-28 rounded-3xl shrink-0 flex items-center justify-center shadow-lg ${
              course.language.toLowerCase() === 'python' ? 'bg-gradient-to-br from-blue-500/15 to-cyan-500/10 shadow-blue-500/10' : 
              course.language.toLowerCase() === 'javascript' ? 'bg-gradient-to-br from-yellow-500/15 to-orange-500/10 shadow-yellow-500/10' :
              course.language.toLowerCase() === 'html' ? 'bg-gradient-to-br from-orange-500/15 to-red-500/10 shadow-orange-500/10' :
              course.language.toLowerCase() === 'css' ? 'bg-gradient-to-br from-blue-600/15 to-indigo-500/10 shadow-blue-500/10' :
              course.language.toLowerCase() === 'sql' ? 'bg-gradient-to-br from-sky-500/15 to-blue-500/10 shadow-sky-500/10' :
              course.language.toLowerCase() === 'cpp' ? 'bg-gradient-to-br from-blue-700/15 to-blue-500/10 shadow-blue-700/10' :
              course.language.toLowerCase() === 'java' ? 'bg-gradient-to-br from-red-500/15 to-orange-500/10 shadow-red-500/10' :
              'bg-gradient-to-br from-primary/15 to-primary/5 shadow-primary/10'
            }`}>
              {course.imageUrl ? (
                <img src={course.imageUrl} alt={course.language} className="w-16 h-16 object-contain drop-shadow-sm" />
              ) : (
                <span className="text-5xl drop-shadow-sm">💻</span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="font-semibold text-xs">{course.language}</Badge>
                <Badge variant="outline" className="font-semibold text-xs capitalize">{t(`courses.${course.difficulty}`, { defaultValue: course.difficulty })}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-3">{translateCourseTitle(t, course)}</h1>
              <p className="text-base text-muted-foreground leading-relaxed">{translateCourseDescription(t, course)}</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 bg-background rounded-2xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/8 rounded-xl"><BookOpen className="w-5 h-5 text-primary" /></div>
              <div><p className="text-sm font-bold">{course.totalLessons}</p><p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("courses.lessonsLabel")}</p></div>
            </div>
            <div className="flex items-center gap-3 md:border-l md:border-border/50 md:pl-4">
              <div className="p-2.5 bg-blue-500/8 rounded-xl"><Clock className="w-5 h-5 text-blue-500" /></div>
              <div><p className="text-sm font-bold">{course.estimatedHours}{t("courses.hoursShort")}</p><p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("courses.estimated")}</p></div>
            </div>
            <div className="flex items-center gap-3 md:border-l md:border-border/50 md:pl-4">
              <div className="p-2.5 bg-accent/8 rounded-xl"><Star className="w-5 h-5 text-accent fill-accent" /></div>
              <div><p className="text-sm font-bold text-accent">{course.xpReward}</p><p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("courses.totalXP")}</p></div>
            </div>
            <div className="flex items-center justify-end md:pl-4">
              {nextLessonId ? (
                <Link href={`/lessons/${nextLessonId}`}>
                  <Button className="rounded-xl font-semibold shadow-lg shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full md:w-auto">
                    {progress?.percentComplete && progress.percentComplete > 0 ? t("courses.continue") : t("courses.start")}
                    <Play className="w-4 h-4 ml-1.5 fill-current" />
                  </Button>
                </Link>
              ) : (
                <Button disabled className="rounded-xl font-semibold w-full md:w-auto opacity-50">
                  {t("courses.noLessons")}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {progress && progress.percentComplete > 0 && (
          <motion.section {...fadeUp}>
            <div className="flex justify-between font-semibold mb-2.5 items-end">
              <h2 className="text-lg font-display font-bold">{t("dashboard.yourProgress")}</h2>
              <span className="text-primary text-sm">{progress.percentComplete}%</span>
            </div>
            <Progress value={progress.percentComplete} className="h-3 rounded-full bg-muted" indicatorClassName="bg-gradient-to-r from-primary to-[hsl(280,80%,60%)]" />
          </motion.section>
        )}

        <motion.section 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-xl font-display font-bold mb-6">{t("courses.syllabus")}</h2>
          <Accordion type="multiple" defaultValue={course.modules?.map((_, i) => `item-${i}`)} className="space-y-3">
            {course.modules?.map((module, mIndex) => (
              <AccordionItem key={module.id} value={`item-${mIndex}`} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm px-1 data-[state=open]:shadow-md transition-shadow duration-300">
                <AccordionTrigger className="hover:no-underline px-5 py-5 group">
                  <div className="flex items-start text-left gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 text-primary font-bold font-display flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      {mIndex + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display">{translateModuleTitle(t, module)}</h3>
                      <p className="text-sm text-muted-foreground font-normal mt-0.5">{translateModuleDescription(t, module)}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-0">
                  <div className="space-y-2 mt-3 ml-14">
                    {module.lessons?.map((lesson, lIndex) => {
                      const flatIdx = lessonIndexMap.get(lesson.id) ?? 0;
                      const isCompleted = progress ? flatIdx < completedCount : false;
                      const isLocked = !isCompleted && flatIdx > completedCount;

                      return (
                        <motion.div 
                          key={lesson.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: lIndex * 0.05, duration: 0.3 }}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                            isCompleted ? 'bg-success/5 border-success/15' : 
                            isLocked ? 'bg-muted/20 border-transparent opacity-60' : 
                            'bg-background border-border/50 hover:border-primary/20 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <LessonIcon type={lesson.type} isCompleted={isCompleted} />
                            <div>
                              <p className="font-semibold text-sm">{translateLessonTitle(t, lesson)}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span>{t(`lesson.${lesson.type}`, { defaultValue: lesson.type })}</span>
                                <span className="opacity-30">·</span>
                                <span>{lesson.estimatedMinutes} {t("courses.min")}</span>
                                <span className="opacity-30">·</span>
                                <span className="flex items-center text-accent font-semibold"><Star className="w-3 h-3 mr-0.5 fill-current" /> {lesson.xpReward}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-muted-foreground/40" />
                            ) : (
                              <Link href={`/lessons/${lesson.id}`}>
                                <Button variant={isCompleted ? "outline" : "default"} size="sm" className="rounded-lg font-semibold text-xs h-8">
                                  {isCompleted ? t("courses.review") : t("courses.start")}
                                </Button>
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.section>
      </div>
    </div>
  );
}
