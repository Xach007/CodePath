import { useListCourses } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { translateCourseDescription, translateCourseTitle } from "@/lib/course-i18n";

const container = {
  hidden: { opacity: 0.96 },
  show: { opacity: 1, transition: { staggerChildren: 0.085 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } }
};

function getCourseCoverClass(language: string) {
  const key = language.toLowerCase();

  switch (key) {
    case "python":
      return "courses-card-cover courses-card-cover--python";
    case "javascript":
      return "courses-card-cover courses-card-cover--javascript";
    case "html":
      return "courses-card-cover courses-card-cover--html";
    case "css":
      return "courses-card-cover courses-card-cover--css";
    case "sql":
      return "courses-card-cover courses-card-cover--sql";
    case "cpp":
      return "courses-card-cover courses-card-cover--cpp";
    case "java":
      return "courses-card-cover courses-card-cover--java";
    default:
      return "courses-card-cover courses-card-cover--default";
  }
}

export default function Courses() {
  const { t } = useTranslation();
  const { data: courses, isLoading } = useListCourses();

  return (
    <div className="courses-page">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.54, ease: [0.16, 1, 0.3, 1] }}
        className="courses-hero"
      >
        <h1 className="courses-title">{t("courses.title")}</h1>
        <p className="courses-subtitle">
          {t("courses.subtitleLong")}
        </p>
      </motion.div>

      {isLoading ? (
        <div className="courses-grid">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="courses-skeleton" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="courses-grid"
        >
          {courses?.map((course) => (
            <motion.div key={course.id} variants={item}>
              <Link href={`/courses/${course.id}`}>
                <Card className="courses-card">
                  <div className={getCourseCoverClass(course.language)}>
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.language} className="courses-card-image" />
                    ) : (
                      <div className="courses-card-emoji">💻</div>
                    )}
                    <Badge variant="secondary" className="courses-card-badge">
                      {t(`courses.${course.difficulty}`, { defaultValue: course.difficulty })}
                    </Badge>
                  </div>

                  <CardContent className="courses-card-body">
                    <div className="courses-card-copy">
                      <h3 className="courses-card-title">{translateCourseTitle(t, course)}</h3>
                      <p className="courses-card-description">{translateCourseDescription(t, course)}</p>
                    </div>

                    <div className="courses-card-stats">
                      <div className="courses-card-stat">
                        <BookOpen className="courses-card-stat-icon" />
                        <span className="courses-card-stat-value">{course.totalLessons}</span>
                        <span className="courses-card-stat-label">{t("courses.lessonsLabel")}</span>
                      </div>
                      <div className="courses-card-stat courses-card-stat--middle">
                        <Clock className="courses-card-stat-icon" />
                        <span className="courses-card-stat-value">{course.estimatedHours}{t("courses.hoursShort")}</span>
                        <span className="courses-card-stat-label">{t("courses.time")}</span>
                      </div>
                      <div className="courses-card-stat">
                        <Star className="courses-card-stat-icon courses-card-stat-icon--accent" />
                        <span className="courses-card-stat-value courses-card-stat-value--accent">{course.xpReward}</span>
                        <span className="courses-card-stat-label">XP</span>
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
