import { Link, useLocation } from "wouter";
import { CodePathLogo } from "@/components/codepath-logo";
import { useGetMe, useGetGamificationProfile, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { removeToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Flame, 
  Star, 
  BookOpen, 
  LayoutDashboard, 
  Trophy, 
  Medal, 
  LogOut,
  User,
  Moon,
  Sun,
  Settings,
  HelpCircle,
  Bell,
  Trash2
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

type UserNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

function formatNotificationDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function NotificationsBell({ enabled }: { enabled: boolean }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith("ru") ? "ru" : "en";
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (!response.ok) return;
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadNotifications();
    if (!enabled) return;

    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [enabled, loadNotifications]);

  const clearAllNotifications = async () => {
    await fetch("/api/notifications", { method: "DELETE" });
    setUnreadCount(0);
    setItems([]);
  };

  const markOneRead = async (notification: UserNotification) => {
    if (notification.readAt) return;
    await fetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
    setUnreadCount((current) => Math.max(0, current - 1));
    setItems((current) => current.map((item) => (
      item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
    )));
  };

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) loadNotifications(); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="notifications-trigger"
          aria-label={t("notifications.title")}
          title={t("notifications.title")}
        >
          <Bell className="notifications-trigger-icon" />
          {unreadCount > 0 && (
            <span className="notifications-trigger-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="notifications-menu" sideOffset={8}>
        <div className="notifications-menu-header">
          <DropdownMenuLabel className="notifications-menu-title">
            {t("notifications.title")}
          </DropdownMenuLabel>
          <button
            type="button"
            onClick={clearAllNotifications}
            disabled={items.length === 0}
            className="notifications-menu-clear"
          >
            <Trash2 className="notifications-menu-clear-icon" />
            {t("notifications.clearAll")}
          </button>
        </div>
        <DropdownMenuSeparator />
        <div className="notifications-menu-list">
          {loading && items.length === 0 ? (
            <DropdownMenuItem disabled className="notifications-menu-empty">
              {t("notifications.loading")}
            </DropdownMenuItem>
          ) : items.length ? (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markOneRead(item)}
                className="notifications-item"
              >
                <div className="notifications-item-row">
                  <span className={`notifications-item-dot ${item.readAt ? "notifications-item-dot--read" : "notifications-item-dot--new"}`} />
                  <span className="notifications-item-content">
                    <span className="notifications-item-title">{item.title}</span>
                    <span className="notifications-item-message">{item.message}</span>
                    <span className="notifications-item-date">
                      {formatNotificationDate(item.createdAt, language)}
                    </span>
                  </span>
                </div>
              </button>
            ))
          ) : (
            <DropdownMenuItem disabled className="notifications-menu-empty">
              {t("notifications.empty")}
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: gamification } = useGetGamificationProfile({
    query: { enabled: !!user }
  });
  const logoutMutation = useLogout();
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return true;
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage?.startsWith("ru") ? "ru" : "en";
  }, [i18n.resolvedLanguage]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({});
    } catch (e) {}
    removeToken();
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    queryClient.clear();
    window.sessionStorage.setItem("codepath_show_intro", "1");
    window.dispatchEvent(new Event("codepath:show-intro"));
    setLocation("/");
  };

  const handleFastNav = useCallback((href: string, event: React.PointerEvent<HTMLAnchorElement>) => {
    if (location === href) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setLocation(href);
  }, [location, setLocation]);

  const navLinks = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/courses", label: t("nav.courses"), icon: BookOpen },
    { href: "/achievements", label: t("nav.achievements"), icon: Trophy },
    { href: "/leaderboard", label: t("nav.leaderboard"), icon: Medal },
  ];

  return (
    <div className="layout-root">
      <header className="layout-header">
        <div className="layout-header-inner">
          <div className="layout-header-start">
            <Link href={user ? "/dashboard" : "/"} className="layout-brand-link">
              <div className="layout-brand-logo-wrap">
                <CodePathLogo size={36} className="layout-brand-logo" />
                <div className="layout-brand-logo-dot" />
              </div>
              <span className="layout-brand-text">CodePath</span>
            </Link>

            {user && (
              <nav className="layout-desktop-nav">
                {navLinks.map((link) => {
                  const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      onPointerDown={(event) => handleFastNav(link.href, event)}
                      className={`layout-desktop-nav-link ${
                        isActive ? "layout-desktop-nav-link--active" : "layout-desktop-nav-link--idle"
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="layout-desktop-nav-link-bg"
                        />
                      )}
                      <link.icon className={`layout-desktop-nav-icon ${isActive ? "layout-desktop-nav-icon--active" : "layout-desktop-nav-icon--idle"}`} />
                      <span className="layout-desktop-nav-label">
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="layout-header-end">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="layout-theme-toggle"
            >
              {isDark ? <Sun className="layout-theme-toggle-icon" /> : <Moon className="layout-theme-toggle-icon" />}
            </button>

            {isLoadingUser ? (
              <div className="layout-user-loading">
                <Skeleton className="layout-user-loading-pill" />
                <Skeleton className="layout-user-loading-avatar" />
              </div>
            ) : user ? (
              <div className="layout-user-panel">
                <NotificationsBell enabled={!!user} />
                {gamification && (
                  <div className="layout-user-stats">
                    <div className="layout-user-stat-item" title={t("dashboard.streak")}>
                      <Flame className="layout-user-stat-icon layout-user-stat-icon--accent" />
                      <span className="layout-user-stat-value layout-user-stat-value--accent">{gamification.currentStreak}</span>
                    </div>
                    <div className="layout-user-stat-divider" />
                    <div className="layout-user-stat-item" title={t("dashboard.totalXP")}>
                      <Star className="layout-user-stat-icon layout-user-stat-icon--primary" />
                      <span className="layout-user-stat-value layout-user-stat-value--primary">{gamification.totalXP}</span>
                    </div>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="layout-avatar-trigger"
                    >
                      <Avatar className="layout-avatar">
                        <AvatarImage src={user.avatarUrl || ""} />
                        <AvatarFallback className="layout-avatar-fallback">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="layout-avatar-menu" sideOffset={8}>
                    <DropdownMenuLabel className="layout-avatar-menu-header">
                      <div className="layout-avatar-menu-user">
                        <p className="layout-avatar-menu-name">{user.displayName || user.username}</p>
                        <p className="layout-avatar-menu-email">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="layout-avatar-menu-item">
                        <User className="layout-avatar-menu-item-icon" />
                        <span>{t("nav.profile")}</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/settings">
                      <DropdownMenuItem className="layout-avatar-menu-item">
                        <Settings className="layout-avatar-menu-item-icon" />
                        <span>{t("nav.settings")}</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/help">
                      <DropdownMenuItem className="layout-avatar-menu-item">
                        <HelpCircle className="layout-avatar-menu-item-icon" />
                        <span>{t("support.title")}</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="layout-avatar-menu-item layout-avatar-menu-item--logout" onClick={handleLogout}>
                      <LogOut className="layout-avatar-menu-item-icon" />
                      <span>{t("nav.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </div>
            ) : (
              <div className="layout-guest-actions">
                <Link href="/?auth=login">
                  <Button variant="ghost" className="layout-guest-login">{t("nav.login")}</Button>
                </Link>
                <Link href="/?auth=register">
                  <Button className="layout-guest-register">{t("nav.getStarted")}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="layout-main">
        {children}
      </main>

      {user && (
        <nav className="layout-bottom-nav">
          <div className="layout-bottom-nav-inner">
            {navLinks.map((link) => {
              const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onPointerDown={(event) => handleFastNav(link.href, event)}
                  className="layout-bottom-nav-link"
                >
                  <link.icon className={`layout-bottom-nav-icon ${isActive ? "layout-bottom-nav-icon--active" : "layout-bottom-nav-icon--idle"}`} />
                  <span className={`layout-bottom-nav-label ${isActive ? "layout-bottom-nav-label--active" : "layout-bottom-nav-label--idle"}`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
