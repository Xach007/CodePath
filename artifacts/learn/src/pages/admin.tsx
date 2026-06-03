import { Fragment, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Bell, BookOpen, CheckCircle2, Clock, Eye, EyeOff, Layers3, MessageCircle, PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Search, Trash2, Trophy, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateCourseTitle, translateModuleTitle } from "@/lib/course-i18n";
import { translateAchievementDescription, translateAchievementTitle } from "@/lib/achievement-i18n";
import { translateLessonTitle } from "@/lib/lesson-i18n";
import AdminCourseBuilder from "@/components/admin-course-builder";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const ADMIN_TOKEN_KEY = "admin_token";

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function adminFetch(path: string, opts: RequestInit = {}) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    throw new Error("Unauthorized");
  }
  return res;
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("admin.loginFailed"));
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      onLogin();
    } catch {
      setError(t("admin.connectionFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">{t("admin.panel")}</h1>
          <p className="text-white/50 text-sm mt-1">{t("admin.administration")}</p>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">{t("admin.email")}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" placeholder="admin@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">{t("admin.password")}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50">
            {loading ? t("admin.signingIn") : t("admin.signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}

type Tab = "dashboard" | "users" | "courses" | "achievements" | "support";

function AdminLanguageToggle({ collapsed }: { collapsed: boolean }) {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage?.startsWith("en") ? "en" : "ru";
  const isEnglish = activeLanguage === "en";

  const setLanguage = (language: "ru" | "en") => {
    localStorage.setItem("language", language);
    void i18n.changeLanguage(language);
  };

  if (collapsed) {
    const nextLanguage = isEnglish ? "ru" : "en";

    return (
      <button
        type="button"
        onClick={() => setLanguage(nextLanguage)}
        title={isEnglish ? t("admin.switchToRussian") : t("admin.switchToEnglish")}
        aria-label={isEnglish ? t("admin.switchToRussian") : t("admin.switchToEnglish")}
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
      >
        {isEnglish ? "🇺🇸" : "🇷🇺"}
      </button>
    );
  }

  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">
        {t("admin.language")}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isEnglish}
        aria-label={isEnglish ? t("admin.switchToRussian") : t("admin.switchToEnglish")}
        onClick={() => setLanguage(isEnglish ? "ru" : "en")}
        className="relative flex h-10 w-full items-center overflow-hidden rounded-full border border-white/10 bg-slate-950/70 p-1 transition hover:border-indigo-400/40"
      >
        <span
          aria-hidden="true"
          className={`absolute left-1 top-1 h-8 w-[calc(50%-0.25rem)] rounded-full bg-indigo-600 shadow-lg shadow-indigo-950/30 transition-transform duration-300 ease-out ${isEnglish ? "translate-x-full" : "translate-x-0"}`}
        />
        <span className={`relative z-10 flex h-8 w-1/2 items-center justify-center text-lg transition ${isEnglish ? "opacity-45" : "opacity-100"}`}>
          🇷🇺
        </span>
        <span className={`relative z-10 flex h-8 w-1/2 items-center justify-center text-lg transition ${isEnglish ? "opacity-100" : "opacity-45"}`}>
          🇺🇸
        </span>
      </button>
    </div>
  );
}

function Sidebar({
  tab,
  setTab,
  onLogout,
  collapsed,
  onToggleCollapsed,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const { t } = useTranslation();
  const items: { key: Tab; label: string; icon: string }[] = [
    { key: "dashboard", label: t("admin.nav.dashboard"), icon: "📊" },
    { key: "courses", label: t("admin.nav.courses"), icon: "📚" },
    { key: "users", label: t("admin.nav.users"), icon: "👥" },
    { key: "achievements", label: t("admin.nav.achievements"), icon: "🏆" },
    { key: "support", label: t("admin.nav.support"), icon: "✉️" },
  ];
  const collapseLabel = collapsed ? t("admin.expandSidebar") : t("admin.collapseSidebar");

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} sticky top-0 h-screen shrink-0 bg-slate-900/80 border-r border-white/10 flex flex-col transition-[width] duration-300 ease-out`}>
      <div className={`${collapsed ? "p-3" : "p-5"} border-b border-white/10`}>
        <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "gap-3"}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex shrink-0 items-center justify-center text-white font-bold text-sm">C</div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold text-sm truncate">CodePath</div>
              <div className="text-white/40 text-xs truncate">{t("admin.panel")}</div>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapseLabel}
            aria-label={collapseLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(i => (
          <button
            key={i.key}
            onClick={() => setTab(i.key)}
            title={collapsed ? i.label : undefined}
            aria-label={i.label}
            className={`w-full flex items-center rounded-lg text-sm transition-all ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"} ${tab === i.key ? "bg-indigo-600/20 text-indigo-300 font-medium" : "text-white/60 hover:bg-white/5 hover:text-white/80"}`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">{i.icon}</span>
            {!collapsed && <span className="truncate">{i.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <AdminLanguageToggle collapsed={collapsed} />
        <button
          onClick={onLogout}
          title={collapsed ? t("admin.logout") : undefined}
          aria-label={t("admin.logout")}
          className={`w-full flex items-center rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"}`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">🚪</span>
          {!collapsed && <span className="truncate">{t("admin.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}

function StatsCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-white/50 text-sm mt-1">{label}</div>
    </div>
  );
}

function DashboardTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    adminFetch("/admin/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div className="text-white/50 p-8">{t("common.loading")}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">{t("admin.dashboardOverview")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard icon="👥" label={t("admin.stats.users")} value={stats.users} />
        <StatsCard icon="📚" label={t("admin.stats.courses")} value={stats.courses} />
        <StatsCard icon="📖" label={t("admin.stats.lessons")} value={stats.lessons} />
        <StatsCard icon="📦" label={t("admin.stats.modules")} value={stats.modules} />
        <StatsCard icon="🏆" label={t("admin.stats.achievements")} value={stats.achievements} />
        <StatsCard icon="🎓" label={t("admin.stats.enrollments")} value={stats.enrollments} />
      </div>
    </div>
  );
}

type AdminUserActivity = {
  user: {
    id: number;
    username: string;
    email: string;
    displayName: string | null;
    totalXP: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
  };
  summary: {
    enrolledCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    completedLessons: number;
    unlockedAchievements: number;
    totalAchievements: number;
  };
  courses: Array<{
    courseId: number;
    courseTitle: string;
    language: string;
    status: "started" | "in_progress" | "completed";
    completedLessons: number;
    totalLessons: number;
    percentComplete: number;
    xpEarned: number;
    startedAt: string | null;
    completedAt: string | null;
    lastActivityAt: string | null;
    currentLesson: AdminLessonPointer | null;
    lastCompletedLesson: AdminLessonPointer | null;
  }>;
  achievements: Array<{
    id: number;
    key: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    unlockedAt: string | null;
  }>;
  recentLessons: Array<{
    id: number;
    title: string;
    type: string;
    moduleTitle: string;
    courseTitle: string;
    xpEarned: number;
    completedAt: string | null;
  }>;
};

type AdminLessonPointer = {
  id: number;
  title: string;
  type: string;
  moduleId?: number;
  moduleTitle: string;
  completedAt: string | null;
};

type AdminLessonOption = {
  id: number;
  title: string;
  type: string;
  xpReward: number;
  orderIndex: number;
};

type AdminModuleOption = {
  id: number;
  title: string;
  courseId: number;
  orderIndex: number;
  lessons: AdminLessonOption[];
};

type AdminCourseOption = {
  id: number;
  title: string;
  language: string;
  difficulty: string;
  isPublished: boolean;
  modules: AdminModuleOption[];
};

type AdminResetPayload = {
  scope: "all" | "course" | "module" | "lesson";
  courseId?: number;
  moduleId?: number;
  lessonId?: number;
  clearAchievements?: boolean;
};

function formatAdminDate(value: string | null | undefined, language = "en") {
  if (!value) return null;
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function courseStatusLabel(t: ReturnType<typeof useTranslation>["t"], status: AdminUserActivity["courses"][number]["status"]) {
  if (status === "completed") return t("admin.users.status.completed");
  if (status === "in_progress") return t("admin.users.status.inProgress");
  return t("admin.users.status.started");
}

function courseStatusClass(status: AdminUserActivity["courses"][number]["status"]) {
  if (status === "completed") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "in_progress") return "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
  return "border-white/10 bg-white/5 text-white/55";
}

function UserActivityPanel({
  activity,
  loading,
  error,
  courseOptions,
  actionLoading,
  onUnlockAchievement,
  onRemoveAchievement,
  onAddCourse,
  onAddModule,
  onAddLesson,
  onResetProgress,
}: {
  activity?: AdminUserActivity;
  loading: boolean;
  error: string;
  courseOptions: AdminCourseOption[];
  actionLoading: string;
  onUnlockAchievement: (userId: number, achievementId: number) => Promise<void>;
  onRemoveAchievement: (userId: number, achievementId: number) => Promise<void>;
  onAddCourse: (userId: number, courseId: number) => Promise<void>;
  onAddModule: (userId: number, moduleId: number) => Promise<void>;
  onAddLesson: (userId: number, lessonId: number) => Promise<void>;
  onResetProgress: (userId: number, payload: AdminResetPayload) => Promise<void>;
}) {
  const { t, i18n } = useTranslation();
  const adminDateLanguage = i18n.resolvedLanguage?.startsWith("ru") ? "ru" : "en";
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [actionMode, setActionMode] = useState<"achievement" | "course" | "module" | "lesson">("achievement");
  const [resetScope, setResetScope] = useState<AdminResetPayload["scope"]>("course");
  const [clearAchievements, setClearAchievements] = useState(false);
  const [selectedAchievementId, setSelectedAchievementId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");

  if (loading) {
    return <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-sm text-white/45">{t("admin.users.loadingActivity")}</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>;
  }

  if (!activity) {
    return <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-sm text-white/45">{t("admin.users.noActivityLoaded")}</div>;
  }

  const unlockedAchievements = activity.achievements.filter((achievement) => achievement.unlockedAt);
  const lockedAchievements = activity.achievements.filter((achievement) => !achievement.unlockedAt);
  const enrolledCourseIds = new Set(activity.courses.map((course) => course.courseId));
  const availableCourses = courseOptions.filter((course) => !enrolledCourseIds.has(course.id));
  const selectedCourse = courseOptions.find((course) => String(course.id) === selectedCourseId) ?? null;
  const moduleOptions = selectedCourse?.modules ?? [];
  const selectedModule = moduleOptions.find((courseModule) => String(courseModule.id) === selectedModuleId) ?? null;
  const lessonOptions = selectedModule?.lessons ?? [];
  const unlockingAchievement = actionLoading === `achievement:${activity.user.id}`;
  const addingCourse = actionLoading === `course:${activity.user.id}`;
  const addingModule = actionLoading === `module:${activity.user.id}`;
  const addingLesson = actionLoading === `lesson:${activity.user.id}`;
  const resettingProgress = actionLoading === `reset:${activity.user.id}`;

  const resetActionState = () => {
    setSelectedAchievementId("");
    setSelectedCourseId("");
    setSelectedModuleId("");
    setSelectedLessonId("");
    setClearAchievements(false);
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId("");
    setSelectedLessonId("");
  };

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId("");
  };

  const buildResetPayload = (): AdminResetPayload | null => {
    if (resetScope === "all") {
      return { scope: "all", clearAchievements };
    }
    if (resetScope === "course" && selectedCourseId) {
      return { scope: "course", courseId: Number(selectedCourseId), clearAchievements };
    }
    if (resetScope === "module" && selectedModuleId) {
      return { scope: "module", moduleId: Number(selectedModuleId), clearAchievements };
    }
    if (resetScope === "lesson" && selectedLessonId) {
      return { scope: "lesson", lessonId: Number(selectedLessonId), clearAchievements };
    }
    return null;
  };

  const resetPayload = buildResetPayload();

  return (
    <div className="space-y-5 rounded-lg border border-white/10 bg-black/20 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("admin.users.userActivity")}</div>
          <h3 className="mt-1 text-lg font-bold text-white">{activity.user.displayName || activity.user.username}</h3>
          <p className="text-xs text-white/45">@{activity.user.username} / {activity.user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-lg font-bold text-white">{activity.summary.inProgressCourses}</div>
            <div className="text-[11px] uppercase tracking-wide text-white/40">{t("admin.users.inProgress")}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-lg font-bold text-white">{activity.summary.completedCourses}</div>
            <div className="text-[11px] uppercase tracking-wide text-white/40">{t("admin.users.completed")}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-lg font-bold text-white">{activity.summary.completedLessons}</div>
            <div className="text-[11px] uppercase tracking-wide text-white/40">{t("admin.users.lessons")}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-lg font-bold text-white">{activity.summary.unlockedAchievements}/{activity.summary.totalAchievements}</div>
            <div className="text-[11px] uppercase tracking-wide text-white/40">{t("admin.users.achievements")}</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("admin.users.adminActions")}</div>
            <p className="mt-1 text-xs text-white/35">{t("admin.users.adminActionsDesc")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddPanel((current) => !current);
                setShowResetPanel(false);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" /> {t("admin.users.add")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowResetPanel((current) => !current);
                setShowAddPanel(false);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
            >
              <RotateCcw className="h-4 w-4" /> {t("admin.users.resetResult")}
            </button>
          </div>
        </div>

        {showAddPanel && (
          <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-slate-950/60 p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
              <select
                value={actionMode}
                onChange={(event) => {
                  setActionMode(event.target.value as "achievement" | "course" | "module" | "lesson");
                  resetActionState();
                }}
                className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="achievement">{t("admin.users.achievement")}</option>
                <option value="course">{t("admin.users.course")}</option>
                <option value="module">{t("admin.users.module")}</option>
                <option value="lesson">{t("admin.users.lesson")}</option>
              </select>

              {actionMode === "achievement" && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <select
                    value={selectedAchievementId}
                    onChange={(event) => setSelectedAchievementId(event.target.value)}
                    disabled={lockedAchievements.length === 0}
                    className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition disabled:opacity-50 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">{lockedAchievements.length ? t("admin.users.chooseLockedAchievement") : t("admin.users.allAchievementsUnlocked")}</option>
                    {lockedAchievements.map((achievement) => (
                      <option key={achievement.id} value={achievement.id}>
                        {translateAchievementTitle(t, achievement)} / {achievement.xpReward} XP
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedAchievementId || unlockingAchievement}
                    onClick={async () => {
                      if (!selectedAchievementId) return;
                      await onUnlockAchievement(activity.user.id, Number(selectedAchievementId));
                      setSelectedAchievementId("");
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trophy className="h-3.5 w-3.5" /> {unlockingAchievement ? t("admin.users.opening") : t("admin.users.open")}
                  </button>
                </div>
              )}

              {actionMode === "course" && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <select
                    value={selectedCourseId}
                    onChange={(event) => handleCourseChange(event.target.value)}
                    disabled={availableCourses.length === 0}
                    className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition disabled:opacity-50 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">{availableCourses.length ? t("admin.users.chooseCourseToAdd") : t("admin.users.allCoursesAdded")}</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {translateCourseTitle(t, course)} / {course.language}{course.isPublished ? "" : ` / ${t("admin.builder.inactive")}`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedCourseId || addingCourse}
                    onClick={async () => {
                      if (!selectedCourseId) return;
                      await onAddCourse(activity.user.id, Number(selectedCourseId));
                      resetActionState();
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> {addingCourse ? t("admin.users.adding") : t("admin.users.add")}
                  </button>
                </div>
              )}

              {(actionMode === "module" || actionMode === "lesson") && (
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <select
                    value={selectedCourseId}
                    onChange={(event) => handleCourseChange(event.target.value)}
                    className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">{t("admin.users.chooseCourse")}</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.id}>
                        {translateCourseTitle(t, course)} / {course.language}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedModuleId}
                    onChange={(event) => handleModuleChange(event.target.value)}
                    disabled={!selectedCourseId || moduleOptions.length === 0}
                    className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition disabled:opacity-50 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">{moduleOptions.length ? t("admin.users.chooseModule") : t("admin.users.noModules")}</option>
                    {moduleOptions.map((courseModule) => (
                      <option key={courseModule.id} value={courseModule.id}>
                        {translateModuleTitle(t, courseModule)}
                      </option>
                    ))}
                  </select>
                  {actionMode === "lesson" ? (
                    <select
                      value={selectedLessonId}
                      onChange={(event) => setSelectedLessonId(event.target.value)}
                      disabled={!selectedModuleId || lessonOptions.length === 0}
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition disabled:opacity-50 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">{lessonOptions.length ? t("admin.users.chooseLesson") : t("admin.users.noLessons")}</option>
                      {lessonOptions.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {translateLessonTitle(t, lesson)} / {t(`lesson.${lesson.type}`, { defaultValue: lesson.type })} / {lesson.xpReward} XP
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="hidden xl:block" />
                  )}
                  <button
                    type="button"
                    disabled={(actionMode === "module" ? !selectedModuleId || addingModule : !selectedLessonId || addingLesson)}
                    onClick={async () => {
                      if (actionMode === "module" && selectedModuleId) {
                        await onAddModule(activity.user.id, Number(selectedModuleId));
                      }
                      if (actionMode === "lesson" && selectedLessonId) {
                        await onAddLesson(activity.user.id, Number(selectedLessonId));
                      }
                      resetActionState();
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Layers3 className="h-3.5 w-3.5" /> {addingModule || addingLesson ? t("admin.users.adding") : t("admin.users.add")}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {showResetPanel && (
          <div className="mt-4 space-y-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] p-4">
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <select
                value={resetScope}
                onChange={(event) => {
                  setResetScope(event.target.value as AdminResetPayload["scope"]);
                  resetActionState();
                }}
                className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
              >
                <option value="all">{t("admin.users.allProgress")}</option>
                <option value="course">{t("admin.users.course")}</option>
                <option value="module">{t("admin.users.module")}</option>
                <option value="lesson">{t("admin.users.lesson")}</option>
              </select>
              <select
                value={selectedCourseId}
                onChange={(event) => handleCourseChange(event.target.value)}
                disabled={resetScope === "all"}
                className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition disabled:opacity-50 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">{resetScope === "all" ? t("admin.users.allCourses") : t("admin.users.chooseCourse")}</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {translateCourseTitle(t, course)} / {course.language}
                  </option>
                ))}
              </select>
              <select
                value={selectedModuleId}
                onChange={(event) => handleModuleChange(event.target.value)}
                disabled={resetScope === "all" || resetScope === "course" || !selectedCourseId || moduleOptions.length === 0}
                className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition disabled:opacity-50 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">{moduleOptions.length ? t("admin.users.chooseModule") : t("admin.users.noModules")}</option>
                {moduleOptions.map((courseModule) => (
                  <option key={courseModule.id} value={courseModule.id}>
                    {translateModuleTitle(t, courseModule)}
                  </option>
                ))}
              </select>
              <select
                value={selectedLessonId}
                onChange={(event) => setSelectedLessonId(event.target.value)}
                disabled={resetScope !== "lesson" || !selectedModuleId || lessonOptions.length === 0}
                className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition disabled:opacity-50 focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">{lessonOptions.length ? t("admin.users.chooseLesson") : t("admin.users.noLessons")}</option>
                {lessonOptions.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {translateLessonTitle(t, lesson)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!resetPayload || resettingProgress}
                onClick={async () => {
                  if (!resetPayload) return;
                  await onResetProgress(activity.user.id, resetPayload);
                  resetActionState();
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {resettingProgress ? t("admin.users.resetting") : t("admin.users.reset")}
              </button>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-white/45">
              <input
                type="checkbox"
                checked={clearAchievements}
                onChange={(event) => setClearAchievements(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-slate-950"
              />
              {t("admin.users.clearAchievements")}
            </label>
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <BookOpen className="h-4 w-4 text-indigo-300" /> {t("admin.users.courses")}
        </div>
        {activity.courses.length ? (
          <div className="space-y-3">
            {activity.courses.map((course) => (
              <div key={course.courseId} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-white">{translateCourseTitle(t, course.courseTitle)}</h4>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${courseStatusClass(course.status)}`}>
                        {courseStatusLabel(t, course.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      {course.language} / {t("admin.users.lessonsProgress", { completed: course.completedLessons, total: course.totalLessons })} / {course.xpEarned} XP
                    </p>
                  </div>
                  <div className="text-sm font-bold text-indigo-300">{course.percentComplete}%</div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${course.percentComplete}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-white/50 xl:grid-cols-3">
                  <div>
                    <span className="text-white/35">{t("admin.users.stoppedAt")} </span>
                    {course.status === "completed"
                      ? t("admin.users.courseCompleted")
                      : course.currentLesson
                        ? `${translateModuleTitle(t, course.currentLesson.moduleTitle)} / ${translateLessonTitle(t, course.currentLesson.title)}`
                        : t("admin.users.noNextLesson")}
                  </div>
                  <div>
                    <span className="text-white/35">{t("admin.users.lastCompleted")} </span>
                    {course.lastCompletedLesson ? translateLessonTitle(t, course.lastCompletedLesson.title) : t("admin.users.nothingYet")}
                  </div>
                  <div>
                    <span className="text-white/35">{t("admin.users.lastActivity")} </span>
                    {formatAdminDate(course.lastActivityAt, adminDateLanguage) ?? t("admin.users.notYet")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/40">{t("admin.users.noStartedCourses")}</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Trophy className="h-4 w-4 text-amber-300" /> {t("admin.users.achievements")}
          </div>
          {unlockedAchievements.length ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {unlockedAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-xl">{achievement.icon}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{translateAchievementTitle(t, achievement)}</div>
                    <div className="text-xs text-white/40">{formatAdminDate(achievement.unlockedAt, adminDateLanguage) ?? t("admin.users.notYet")} / {achievement.xpReward} XP</div>
                  </div>
                  <button
                    type="button"
                    title={t("admin.users.removeAchievement")}
                    aria-label={`${t("admin.users.removeAchievement")}: ${translateAchievementTitle(t, achievement)}`}
                    disabled={actionLoading === `remove-achievement:${activity.user.id}:${achievement.id}`}
                    onClick={() => onRemoveAchievement(activity.user.id, achievement.id)}
                    className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/40">{t("admin.users.noUnlockedAchievements")}</div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Clock className="h-4 w-4 text-sky-300" /> {t("admin.users.recentLessons")}
          </div>
          {activity.recentLessons.length ? (
            <div className="space-y-2">
              {activity.recentLessons.map((lesson) => (
                <div key={`${lesson.id}-${lesson.completedAt}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{translateLessonTitle(t, lesson.title)}</div>
                      <div className="text-xs text-white/40">{translateCourseTitle(t, lesson.courseTitle)} / {translateModuleTitle(t, lesson.moduleTitle)}</div>
                      <div className="mt-1 text-xs text-white/35">{formatAdminDate(lesson.completedAt, adminDateLanguage) ?? t("admin.users.notYet")} / {lesson.xpEarned} XP</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/40">{t("admin.users.noCompletedLessons")}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const ADMIN_USER_ERROR_KEYS: Record<string, string> = {
  "Username must be at least 3 characters": "admin.users.errors.usernameShort",
  "Valid email is required": "admin.users.errors.invalidEmail",
  "Password must be at least 6 characters": "admin.users.errors.passwordShort",
  "Email already registered": "admin.users.errors.emailRegistered",
  "Username already taken": "admin.users.errors.usernameTaken",
  "Invalid user ID": "admin.users.errors.invalidUserId",
  "Invalid user or achievement ID": "admin.users.errors.invalidUserOrAchievement",
  "Invalid user or course ID": "admin.users.errors.invalidUserOrCourse",
  "Invalid user or module ID": "admin.users.errors.invalidUserOrModule",
  "Invalid user or lesson ID": "admin.users.errors.invalidUserOrLesson",
  "Course is required": "admin.users.errors.courseRequired",
  "Module is required": "admin.users.errors.moduleRequired",
  "Lesson is required": "admin.users.errors.lessonRequired",
  "Invalid reset scope": "admin.users.errors.invalidResetScope",
};

function UsersTab() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [courseOptions, setCourseOptions] = useState<AdminCourseOption[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    email: "",
    displayName: "",
    password: "",
    isAdmin: false,
  });
  const [createUserError, setCreateUserError] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activityByUserId, setActivityByUserId] = useState<Record<number, AdminUserActivity>>({});
  const [activityLoadingId, setActivityLoadingId] = useState<number | null>(null);
  const [activityError, setActivityError] = useState("");
  const [activityAction, setActivityAction] = useState("");
  const [emailSearch, setEmailSearch] = useState("");

  const loadUsers = useCallback(async () => {
    const res = await adminFetch("/admin/users");
    setUsers(await res.json());
  }, []);

  const loadCourseOptions = useCallback(async () => {
    const res = await adminFetch("/admin/course-tree");
    setCourseOptions(await res.json());
  }, []);

  useEffect(() => {
    loadUsers().catch(() => {});
    loadCourseOptions().catch(() => {});
  }, [loadUsers, loadCourseOptions]);

  const normalizedEmailSearch = emailSearch.trim().toLowerCase();
  const filteredUsers = normalizedEmailSearch
    ? users.filter((user) => String(user.email ?? "").toLowerCase().includes(normalizedEmailSearch))
    : users;
  const translateUserError = useCallback((message: string | undefined, fallbackKey: string) => {
    const key = message ? ADMIN_USER_ERROR_KEYS[message] : undefined;
    return key ? t(key) : (message || t(fallbackKey));
  }, [t]);

  const handleDelete = async (id: number) => {
    if (!confirm(t("admin.users.deleteConfirm"))) return;
    await adminFetch(`/admin/users/${id}`, { method: "DELETE" });
    setSelectedUserId((current) => current === id ? null : current);
    setActivityByUserId((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    loadUsers();
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({ username: user.username, email: user.email, displayName: user.displayName || "", isAdmin: user.isAdmin });
  };

  const handleSave = async () => {
    if (editingId === null) return;
    await adminFetch(`/admin/users/${editingId}`, { method: "PATCH", body: JSON.stringify(editForm) });
    setEditingId(null);
    loadUsers();
  };

  const handleCreateUser = async () => {
    setCreateUserError("");
    setCreatingUser(true);

    try {
      const res = await adminFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(createUserForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(translateUserError(data.error, "admin.users.createFailed"));

      setCreateUserForm({ username: "", email: "", displayName: "", password: "", isAdmin: false });
      setShowCreateUser(false);
      await loadUsers();
    } catch (err) {
      setCreateUserError(err instanceof Error ? err.message : t("admin.users.createFailed"));
    } finally {
      setCreatingUser(false);
    }
  };

  const loadUserActivity = async (userId: number, showLoading = true) => {
    if (showLoading) setActivityLoadingId(userId);
    setActivityError("");

    try {
      const res = await adminFetch(`/admin/users/${userId}/activity`);
      const data = await res.json();
      if (!res.ok) throw new Error(translateUserError(data.error, "admin.users.errors.loadActivity"));
      setActivityByUserId((current) => ({ ...current, [userId]: data }));
      return data as AdminUserActivity;
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : t("admin.users.errors.loadActivity"));
      return null;
    } finally {
      if (showLoading) setActivityLoadingId(null);
    }
  };

  const handleViewActivity = async (userId: number) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setActivityError("");
      return;
    }

    setSelectedUserId(userId);
    setActivityError("");
    if (activityByUserId[userId]) return;

    await loadUserActivity(userId);
  };

  const handleUnlockAchievement = async (userId: number, achievementId: number) => {
    setActivityAction(`achievement:${userId}`);
    setActivityError("");
    try {
      const res = await adminFetch(`/admin/users/${userId}/achievements/${achievementId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(translateUserError(data.error, "admin.users.errors.unlockAchievement"));
      await loadUserActivity(userId, false);
      await loadUsers();
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : t("admin.users.errors.unlockAchievement"));
    } finally {
      setActivityAction("");
    }
  };

  const handleRemoveAchievement = async (userId: number, achievementId: number) => {
    setActivityAction(`remove-achievement:${userId}:${achievementId}`);
    setActivityError("");
    try {
      const res = await adminFetch(`/admin/users/${userId}/achievements/${achievementId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(translateUserError(data.error, "admin.users.errors.removeAchievement"));
      await loadUserActivity(userId, false);
      await loadUsers();
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : t("admin.users.errors.removeAchievement"));
    } finally {
      setActivityAction("");
    }
  };

  const handleAddCourse = async (userId: number, courseId: number) => {
    setActivityAction(`course:${userId}`);
    setActivityError("");
    try {
      const res = await adminFetch(`/admin/users/${userId}/courses/${courseId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(translateUserError(data.error, "admin.users.errors.addCourse"));
      await loadUserActivity(userId, false);
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : t("admin.users.errors.addCourse"));
    } finally {
      setActivityAction("");
    }
  };

  const handleAddModule = async (userId: number, moduleId: number) => {
    setActivityAction(`module:${userId}`);
    setActivityError("");
    try {
      const res = await adminFetch(`/admin/users/${userId}/modules/${moduleId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(translateUserError(data.error, "admin.users.errors.addModule"));
      await loadUserActivity(userId, false);
      await loadUsers();
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : t("admin.users.errors.addModule"));
    } finally {
      setActivityAction("");
    }
  };

  const handleAddLesson = async (userId: number, lessonId: number) => {
    setActivityAction(`lesson:${userId}`);
    setActivityError("");
    try {
      const res = await adminFetch(`/admin/users/${userId}/lessons/${lessonId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(translateUserError(data.error, "admin.users.errors.addLesson"));
      await loadUserActivity(userId, false);
      await loadUsers();
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : t("admin.users.errors.addLesson"));
    } finally {
      setActivityAction("");
    }
  };

  const handleResetProgress = async (userId: number, payload: AdminResetPayload) => {
    setActivityAction(`reset:${userId}`);
    setActivityError("");
    try {
      const res = await adminFetch(`/admin/users/${userId}/reset-progress`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(translateUserError(data.error, "admin.users.errors.resetProgress"));
      await loadUserActivity(userId, false);
      await loadUsers();
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : t("admin.users.errors.resetProgress"));
    } finally {
      setActivityAction("");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl font-bold text-white">{t("admin.users.title")}</h2>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <button
            type="button"
            onClick={() => {
              setShowCreateUser((current) => !current);
              setCreateUserError("");
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {t("admin.users.createUser")}
          </button>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={emailSearch}
              onChange={(event) => setEmailSearch(event.target.value)}
              placeholder={t("admin.users.searchByEmail")}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-10 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            {emailSearch && (
              <button
                type="button"
                onClick={() => setEmailSearch("")}
                aria-label={t("admin.users.clearSearch")}
                title={t("admin.users.clearSearch")}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/45 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="whitespace-nowrap text-xs text-white/40">
            {t("admin.users.count", { filtered: filteredUsers.length, total: users.length })}
          </div>
        </div>
      </div>

      {showCreateUser && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">{t("admin.users.newUser")}</h3>
              <p className="mt-1 text-xs text-white/40">{t("admin.users.newUserSubtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateUser(false)}
              aria-label={t("common.cancel")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {createUserError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {createUserError}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={createUserForm.username}
              onChange={(event) => setCreateUserForm({ ...createUserForm, username: event.target.value })}
              placeholder={t("admin.users.username")}
              className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            <input
              type="email"
              value={createUserForm.email}
              onChange={(event) => setCreateUserForm({ ...createUserForm, email: event.target.value })}
              placeholder={t("admin.users.email")}
              className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            <input
              value={createUserForm.displayName}
              onChange={(event) => setCreateUserForm({ ...createUserForm, displayName: event.target.value })}
              placeholder={t("admin.users.displayName")}
              className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            <input
              type="password"
              value={createUserForm.password}
              onChange={(event) => setCreateUserForm({ ...createUserForm, password: event.target.value })}
              placeholder={t("admin.users.password")}
              className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={createUserForm.isAdmin}
                onChange={(event) => setCreateUserForm({ ...createUserForm, isAdmin: event.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-slate-950"
              />
              {t("admin.users.admin")}
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCreateUser}
              disabled={creatingUser}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingUser ? t("admin.users.creating") : t("admin.users.createUser")}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateUser(false)}
              className="rounded-lg px-4 py-2 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.users.username")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.users.email")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.users.level")}</th>
                <th className="text-left px-4 py-3 font-medium">XP</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.users.admin")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.users.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const isSelected = selectedUserId === u.id;

                return (
                  <Fragment key={u.id}>
                    <tr className={`border-b border-white/5 text-white/80 ${isSelected ? "bg-indigo-500/10" : "hover:bg-white/5"}`}>
                      <td className="px-4 py-3">{u.id}</td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-28" />
                        ) : u.username}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-44" />
                        ) : u.email}
                      </td>
                      <td className="px-4 py-3">{u.currentLevel}</td>
                      <td className="px-4 py-3">{u.totalXP}</td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <input type="checkbox" checked={editForm.isAdmin} onChange={e => setEditForm({ ...editForm, isAdmin: e.target.checked })} />
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.isAdmin ? "bg-indigo-500/20 text-indigo-300" : "bg-white/10 text-white/40"}`}>
                            {u.isAdmin ? t("common.yes") : t("common.no")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <div className="flex flex-wrap gap-2">
                            <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-xs">{t("common.save")}</button>
                            <button onClick={() => setEditingId(null)} className="text-white/40 hover:text-white/60 text-xs">{t("common.cancel")}</button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            <button onClick={() => handleViewActivity(u.id)} className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 text-xs">
                              {isSelected ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              {isSelected ? t("admin.users.hideActivity") : t("admin.users.viewActivity")}
                            </button>
                            <button onClick={() => handleEdit(u)} className="text-indigo-400 hover:text-indigo-300 text-xs">{t("common.edit")}</button>
                            <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 text-xs">{t("common.delete")}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isSelected && (
                      <tr className="border-b border-white/10">
                        <td colSpan={7} className="bg-slate-950/40 p-4">
                          <UserActivityPanel
                            activity={activityByUserId[u.id]}
                            loading={activityLoadingId === u.id}
                            error={activityError}
                            courseOptions={courseOptions}
                            actionLoading={activityAction}
                            onUnlockAchievement={handleUnlockAchievement}
                            onRemoveAchievement={handleRemoveAchievement}
                            onAddCourse={handleAddCourse}
                            onAddModule={handleAddModule}
                            onAddLesson={handleAddLesson}
                            onResetProgress={handleResetProgress}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-white/40">
                    {t("admin.users.noUsersFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CoursesTab() {
  return <AdminCourseBuilder adminFetch={adminFetch} />;
}

function AchievementsTab() {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newAch, setNewAch] = useState({ key: "", title: "", description: "", icon: "🎯", xpReward: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const loadAchievements = useCallback(() => {
    adminFetch("/admin/achievements").then(r => r.json()).then(setAchievements).catch(() => {});
  }, []);

  useEffect(() => { loadAchievements(); }, [loadAchievements]);

  const handleCreate = async () => {
    await adminFetch("/admin/achievements", { method: "POST", body: JSON.stringify(newAch) });
    setShowNew(false);
    setNewAch({ key: "", title: "", description: "", icon: "🎯", xpReward: 0 });
    loadAchievements();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this achievement?")) return;
    await adminFetch(`/admin/achievements/${id}`, { method: "DELETE" });
    loadAchievements();
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setEditForm({ key: a.key, title: a.title, description: a.description, icon: a.icon, xpReward: a.xpReward });
  };

  const handleSave = async () => {
    if (editingId === null) return;
    await adminFetch(`/admin/achievements/${editingId}`, { method: "PATCH", body: JSON.stringify(editForm) });
    setEditingId(null);
    loadAchievements();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{t("admin.achievements.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + {t("admin.achievements.new")}
        </button>
      </div>

      {showNew && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={newAch.key} onChange={e => setNewAch({ ...newAch, key: e.target.value })} placeholder={t("admin.achievements.keyPlaceholder")} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
            <input value={newAch.title} onChange={e => setNewAch({ ...newAch, title: e.target.value })} placeholder={t("admin.achievements.titlePlaceholder")} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
            <input value={newAch.icon} onChange={e => setNewAch({ ...newAch, icon: e.target.value })} placeholder={t("admin.achievements.iconPlaceholder")} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
            <input type="number" value={newAch.xpReward} onChange={e => setNewAch({ ...newAch, xpReward: parseInt(e.target.value) || 0 })} placeholder={t("admin.achievements.xpPlaceholder")} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
          </div>
          <input value={newAch.description} onChange={e => setNewAch({ ...newAch, description: e.target.value })} placeholder={t("admin.achievements.descriptionPlaceholder")} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg">{t("common.create")}</button>
            <button onClick={() => setShowNew(false)} className="text-white/50 text-sm px-4 py-2">{t("common.cancel")}</button>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="text-left px-4 py-3 font-medium">{t("admin.achievements.icon")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.achievements.key")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.achievements.achievementTitle")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.achievements.description")}</th>
              <th className="text-left px-4 py-3 font-medium">XP</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.achievements.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map(a => (
              <tr key={a.id} className="border-b border-white/5 text-white/80 hover:bg-white/5">
                <td className="px-4 py-3 text-xl">
                  {editingId === a.id ? (
                    <input value={editForm.icon} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-12" />
                  ) : a.icon}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{a.key}</td>
                <td className="px-4 py-3">
                  {editingId === a.id ? (
                    <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-32" />
                  ) : translateAchievementTitle(t, a)}
                </td>
                <td className="px-4 py-3 text-white/50 text-xs max-w-[200px] truncate">
                  {editingId === a.id ? (
                    <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-full" />
                  ) : translateAchievementDescription(t, a)}
                </td>
                <td className="px-4 py-3">
                  {editingId === a.id ? (
                    <input type="number" value={editForm.xpReward} onChange={e => setEditForm({ ...editForm, xpReward: parseInt(e.target.value) || 0 })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-16" />
                  ) : a.xpReward}
                </td>
                <td className="px-4 py-3">
                  {editingId === a.id ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-xs">{t("common.save")}</button>
                      <button onClick={() => setEditingId(null)} className="text-white/40 text-xs">{t("common.cancel")}</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(a)} className="text-indigo-400 hover:text-indigo-300 text-xs">{t("common.edit")}</button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 text-xs">{t("common.delete")}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type AdminSupportMessage = {
  id: number;
  userId: number | null;
  username: string;
  email: string;
  displayName: string | null;
  subject: string;
  message: string;
  pageUrl: string | null;
  status: "new" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
};

function SupportTab() {
  const { t, i18n } = useTranslation();
  const adminDateLanguage = i18n.resolvedLanguage?.startsWith("ru") ? "ru" : "en";
  const [messages, setMessages] = useState<AdminSupportMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "resolved">("all");
  const [replyByMessageId, setReplyByMessageId] = useState<Record<number, string>>({});
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await adminFetch("/admin/support-messages");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("admin.support.errors.load"));
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.support.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 2500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const filteredMessages = statusFilter === "all"
    ? messages
    : messages.filter((message) => message.status === statusFilter);
  const newMessages = messages.filter((message) => message.status === "new").length;

  const updateStatus = async (message: AdminSupportMessage) => {
    const nextStatus = message.status === "new" ? "resolved" : "new";
    setActionId(message.id);
    setError("");

    try {
      const res = await adminFetch(`/admin/support-messages/${message.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("admin.support.errors.update"));
      setMessages((current) => current.map((item) => item.id === message.id ? data : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.support.errors.update"));
    } finally {
      setActionId(null);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!confirm(t("admin.support.deleteConfirm"))) return;
    setActionId(messageId);
    setError("");

    try {
      const res = await adminFetch(`/admin/support-messages/${messageId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("admin.support.errors.delete"));
      setMessages((current) => current.filter((message) => message.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.support.errors.delete"));
    } finally {
      setActionId(null);
    }
  };

  const sendReply = async (message: AdminSupportMessage) => {
    const reply = (replyByMessageId[message.id] ?? "").trim();
    if (reply.length < 2) {
      setError(t("admin.support.errors.replyTooShort"));
      setSuccess("");
      return;
    }

    setActionId(message.id);
    setError("");
    setSuccess("");

    try {
      const res = await adminFetch(`/admin/support-messages/${message.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: reply }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("admin.support.errors.reply"));
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setReplyByMessageId((current) => {
        const next = { ...current };
        delete next[message.id];
        return next;
      });
      setSuccess(t("admin.support.replySent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.support.errors.reply"));
      setSuccess("");
    } finally {
      setActionId(null);
    }
  };

  const sendBroadcast = async () => {
    const title = broadcastTitle.trim();
    const message = broadcastMessage.trim();
    if (title.length < 2 || message.length < 2) {
      setError(t("admin.support.errors.broadcastTooShort"));
      return;
    }

    setBroadcasting(true);
    setError("");

    try {
      const res = await adminFetch("/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("admin.support.errors.broadcast"));
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.support.errors.broadcast"));
    } finally {
      setBroadcasting(false);
    }
  };

  const filters: Array<{ key: "all" | "new" | "resolved"; label: string }> = [
    { key: "all", label: t("admin.support.filters.all") },
    { key: "new", label: t("admin.support.filters.new") },
    { key: "resolved", label: t("admin.support.filters.resolved") },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t("admin.support.title")}</h2>
          <p className="mt-1 text-sm text-white/45">{t("admin.support.subtitle", { count: newMessages })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`h-9 rounded-md px-3 text-xs font-semibold transition ${statusFilter === filter.key ? "bg-indigo-600 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={loadMessages}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t("admin.support.refresh")}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t("admin.support.broadcastTitle")}</h3>
            <p className="mt-1 text-xs text-white/40">{t("admin.support.broadcastDesc")}</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)_auto]">
          <input
            value={broadcastTitle}
            onChange={(event) => setBroadcastTitle(event.target.value.slice(0, 120))}
            placeholder={t("admin.support.broadcastSubject")}
            className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            value={broadcastMessage}
            onChange={(event) => setBroadcastMessage(event.target.value.slice(0, 2000))}
            placeholder={t("admin.support.broadcastMessage")}
            className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={sendBroadcast}
            disabled={broadcasting || broadcastTitle.trim().length < 2 || broadcastMessage.trim().length < 2}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bell className="h-3.5 w-3.5" />
            {broadcasting ? t("admin.support.sending") : t("admin.support.sendBroadcast")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/45">
          {t("admin.support.loading")}
        </div>
      ) : filteredMessages.length ? (
        <div className="space-y-3">
          {filteredMessages.map((message) => {
            const isResolved = message.status === "resolved";

            return (
              <article key={message.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${isResolved ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
                        {isResolved ? t("admin.support.status.resolved") : t("admin.support.status.new")}
                      </span>
                      <span className="text-xs text-white/35">
                        {formatAdminDate(message.createdAt, adminDateLanguage)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{message.subject}</h3>
                    <p className="mt-1 text-xs text-white/45">
                      {message.displayName || message.username} (@{message.username}) / <a className="text-indigo-300 hover:text-indigo-200" href={`mailto:${message.email}`}>{message.email}</a>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(message)}
                      disabled={actionId === message.id}
                      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isResolved ? "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isResolved ? t("admin.support.markNew") : t("admin.support.markResolved")}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMessage(message.id)}
                      disabled={actionId === message.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={t("admin.support.delete")}
                      title={t("admin.support.delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/45 p-4 text-sm leading-6 text-white/75">
                  {message.message}
                </p>
                {message.pageUrl && (
                  <div className="mt-3 truncate text-xs text-white/35">
                    {t("admin.support.page")} <span className="text-white/55">{message.pageUrl}</span>
                  </div>
                )}
                <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/35 p-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/35">
                    {t("admin.support.reply")}
                  </label>
                  <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <textarea
                      value={replyByMessageId[message.id] ?? ""}
                      onChange={(event) => setReplyByMessageId((current) => ({
                        ...current,
                        [message.id]: event.target.value.slice(0, 2000),
                      }))}
                      placeholder={t("admin.support.replyPlaceholder")}
                      className="min-h-20 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => sendReply(message)}
                      disabled={actionId === message.id || (replyByMessageId[message.id] ?? "").trim().length < 2}
                      className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {actionId === message.id ? t("admin.support.sending") : t("admin.support.sendReply")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/15 p-8 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-white/25" />
          <div className="text-sm font-semibold text-white/60">{t("admin.support.empty")}</div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Sidebar
        tab={tab}
        setTab={setTab}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
      />
      <main className="min-w-0 flex-1 p-8 overflow-y-auto">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "users" && <UsersTab />}
        {tab === "courses" && <CoursesTab />}
        {tab === "achievements" && <AchievementsTab />}
        {tab === "support" && <SupportTab />}
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      adminFetch("/admin/stats")
        .then(r => { if (r.ok) setAuthenticated(true); })
        .catch(() => {});
    }
  }, []);

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard />;
}
