import { useState, useEffect, useRef } from "react";
import { createPortal, flushSync } from "react-dom";
import { CodePathLogo } from "@/components/codepath-logo";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGetMeQueryKey, useLogin, useRegister, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken, setToken } from "@/lib/auth";
import { Code2, Trophy, Terminal, ArrowRight, Sparkles, Star, BookOpen, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

function FastAuthModal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const modal = (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ transition: "opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
        className={`relative w-full max-w-[420px] rounded-3xl border border-border/50 bg-background p-8 shadow-2xl shadow-black/35 ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
        }`}
        style={{ transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          ×
        </button>
        <div className="space-y-2">
          <h2 id="auth-modal-title" className="text-2xl font-display font-bold">{title}</h2>
          <p id="auth-modal-description" className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(modal, document.body);
}


export default function Landing({ introActive = false }: { introActive?: boolean }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const hasAuthToken = typeof window !== "undefined" && !!getToken();
  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: { enabled: hasAuthToken },
  });
  const { t } = useTranslation();
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loginNotBot, setLoginNotBot] = useState(false);
  const [registerNotBot, setRegisterNotBot] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [heroPanelVisible, setHeroPanelVisible] = useState(false);
  const lastScrollYRef = useRef(0);

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
    let frame = 0;
    const revealHeroPanel = () => {
      frame = window.requestAnimationFrame(() => setHeroPanelVisible(true));
    };

    if (!introActive) {
      revealHeroPanel();
      return () => window.cancelAnimationFrame(frame);
    }

    setHeroPanelVisible(false);
    const handleIntroComplete = () => {
      revealHeroPanel();
    };

    window.addEventListener("codepath:intro-complete", handleIntroComplete, { once: true });

    return () => {
      window.removeEventListener("codepath:intro-complete", handleIntroComplete);
      window.cancelAnimationFrame(frame);
    };
  }, [introActive]);

  useEffect(() => {
    const section = document.getElementById("landing-features");
    if (!section) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollYRef.current + 1;
      const scrollingUp = currentScrollY < lastScrollYRef.current - 1;
      lastScrollYRef.current = currentScrollY;

      const rect = section.getBoundingClientRect();
      const triggerPoint = window.innerHeight * 0.82;
      const inRevealZone = rect.top <= triggerPoint && rect.bottom >= window.innerHeight * 0.18;

      if (scrollingDown && inRevealZone) {
        setFeaturesVisible(true);
        return;
      }

      if (scrollingUp && rect.top > triggerPoint) {
        setFeaturesVisible(false);
      }
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const openLogin = () => {
    if (isLoginOpen && !isRegisterOpen) return;
    flushSync(() => {
      setIsRegisterOpen(false);
      setIsLoginOpen(true);
    });
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    setLoginNotBot(false);
  };

  const openRegister = () => {
    if (isRegisterOpen && !isLoginOpen) return;
    flushSync(() => {
      setIsLoginOpen(false);
      setIsRegisterOpen(true);
    });
  };

  const closeRegister = () => {
    setIsRegisterOpen(false);
    setRegisterNotBot(false);
  };

  const handleAuthPress = (event: React.PointerEvent<HTMLButtonElement>, openAuth: () => void) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    openAuth();
  };

  useEffect(() => {
    const authMode = new URLSearchParams(window.location.search).get("auth");
    if (authMode === "login") {
      openLogin();
    } else if (authMode === "register") {
      openRegister();
    } else {
      return;
    }

    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
  }, []);

  useEffect(() => {
    if (user && !isUserLoading) {
      setLocation("/dashboard");
    }
  }, [user, isUserLoading, setLocation]);

  if (user && !isUserLoading) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginNotBot) return;

    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } });
      setToken(res.token);
      queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
      setLocation("/dashboard");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerNotBot) return;

    try {
      const res = await registerMutation.mutateAsync({ data: { email, password, username, displayName: username } });
      setToken(res.token);
      queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
      setLocation("/dashboard");
    } catch (err: any) {
      console.error(err);
    }
  };

  const features = [
    { 
      icon: Terminal, 
      title: t("landing.features.interactive"), 
      desc: t("landing.features.interactiveDesc"),
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-500",
      border: "hover:border-blue-500/30"
    },
    { 
      icon: Trophy, 
      title: t("landing.features.gamified"), 
      desc: t("landing.features.gamifiedDesc"),
      gradient: "from-primary/10 to-purple-500/10",
      iconColor: "text-primary",
      border: "hover:border-primary/30"
    },
    { 
      icon: Sparkles, 
      title: t("landing.features.multiLang"), 
      desc: t("landing.features.multiLangDesc"),
      gradient: "from-accent/10 to-orange-500/10",
      iconColor: "text-accent",
      border: "hover:border-accent/30"
    }
  ];

  const stats = [
    { value: "50+", label: t("landing.stats.lessons"), icon: BookOpen },
    { value: "100%", label: t("landing.stats.free"), icon: Star },
    { value: "5", label: t("landing.stats.courses"), icon: Code2 },
  ];

  return (
    <div className="overflow-hidden bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CodePathLogo size={36} className="shadow-lg shadow-primary/25 rounded-xl" />
            <span className="font-display font-bold text-lg tracking-tight">CodePath</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors duration-300"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <button
              type="button"
              onPointerDown={(event) => handleAuthPress(event, openLogin)}
              onClick={openLogin}
              className="hidden min-h-9 items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:inline-flex"
            >
              {t("nav.login")}
            </button>
            <button
              type="button"
              onPointerDown={(event) => handleAuthPress(event, openRegister)}
              onClick={openRegister}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-primary-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              {t("nav.getStarted")}
            </button>
          </div>
        </div>
      </nav>

      <FastAuthModal
        open={isLoginOpen}
        onOpenChange={(open) => { if (!open) closeLogin(); }}
        title={t("auth.loginTitle")}
        description={t("auth.loginSubtitle")}
      >
        <form onSubmit={handleLogin} className="space-y-5 mt-6">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium">{t("auth.email")}</label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              required
              className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium">{t("auth.password")}</label>
            <Input
              id="login-password"
              type="password"
              required
              className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {loginMutation.error && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2.5 rounded-xl">{t("auth.invalidCredentials")}</p>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/50">
            <input
              type="checkbox"
              checked={loginNotBot}
              onChange={(event) => setLoginNotBot(event.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span>{t("auth.notBot")}</span>
          </label>
          <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold mt-2" disabled={loginMutation.isPending || !loginNotBot}>
            {loginMutation.isPending ? "..." : t("auth.signIn")}
          </Button>
        </form>
      </FastAuthModal>

      <FastAuthModal
        open={isRegisterOpen}
        onOpenChange={(open) => { if (!open) closeRegister(); }}
        title={t("auth.registerTitle")}
        description={t("auth.registerSubtitle")}
      >
        <form onSubmit={handleRegister} className="space-y-5 mt-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">{t("auth.username")}</label>
            <Input
              id="username"
              placeholder="johndoe"
              required
              className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">{t("auth.email")}</label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">{t("auth.password")}</label>
            <Input
              id="password"
              type="password"
              required
              className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {registerMutation.error && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2.5 rounded-xl">Failed to create account. Please try again.</p>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/50">
            <input
              type="checkbox"
              checked={registerNotBot}
              onChange={(event) => setRegisterNotBot(event.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span>{t("auth.notBot")}</span>
          </label>
          <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold mt-2" disabled={registerMutation.isPending || !registerNotBot}>
            {registerMutation.isPending ? "..." : t("auth.signUp")}
          </Button>
        </form>
      </FastAuthModal>

      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-[hsl(280,80%,60%)]/5 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 text-primary font-semibold text-sm mb-8 border border-primary/15">
                <Sparkles className="w-4 h-4" />
                <span>{t("landing.badge")}</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-display font-extrabold leading-[1.08] text-foreground mb-6">
                {t("landing.title1")}{" "}
                <span className="gradient-text">{t("landing.titleHighlight")}</span>{" "}
                {t("landing.title2")}
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
                {t("landing.subtitle")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onPointerDown={(event) => handleAuthPress(event, openRegister)}
                  onClick={openRegister}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-primary-border bg-primary px-8 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-transform duration-75 hover:bg-primary/90 hover:shadow-primary/35 active:scale-[0.98]"
                >
                  {t("landing.startFree")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <button
                  type="button"
                  onPointerDown={(event) => handleAuthPress(event, openLogin)}
                  onClick={openLogin}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border px-8 text-base font-bold transition-colors duration-75 hover:border-primary/30 hover:bg-primary/5"
                >
                  {t("landing.haveAccount")}
                </button>
              </div>

              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-border/50">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                      <stat.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div
              className={`relative hidden lg:block transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none ${
                heroPanelVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.96] opacity-0"
              }`}
            >
              <div className="absolute -inset-8 bg-gradient-to-r from-primary/15 via-[hsl(280,80%,60%)]/10 to-accent/15 blur-[80px] -z-10 rounded-full" />
              
              <div className="relative bg-card rounded-3xl border border-border/50 shadow-2xl shadow-black/10 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/50 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-accent/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground font-mono">lesson.py</span>
                  </div>
                </div>
                <div className="p-6 font-mono text-sm leading-relaxed">
                  <div className="text-muted-foreground/60"># Your first Python program</div>
                  <div className="mt-2">
                    <span className="text-purple-500 dark:text-purple-400">def</span>{" "}
                    <span className="text-blue-500 dark:text-blue-400">greet</span>
                    <span className="text-foreground">(name):</span>
                  </div>
                  <div className="ml-6">
                    <span className="text-purple-500 dark:text-purple-400">return</span>{" "}
                    <span className="text-success">f"Hello, </span>
                    <span className="text-accent">{"{name}"}</span>
                    <span className="text-success">! Welcome to CodePath"</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-foreground">result = greet(</span>
                    <span className="text-success">"World"</span>
                    <span className="text-foreground">)</span>
                  </div>
                  <div>
                    <span className="text-blue-500 dark:text-blue-400">print</span>
                    <span className="text-foreground">(result)</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2 text-success">
                      <span className="text-xs">▶</span>
                      <span className="text-xs font-sans">Hello, World! Welcome to CodePath</span>
                    </div>
                  </div>
                </div>
                
                <div
                  className={`absolute -bottom-2 -right-2 bg-success text-success-foreground rounded-2xl px-4 py-2.5 shadow-xl shadow-success/30 flex items-center gap-2 font-sans font-bold text-sm border-4 border-background transition-all duration-500 delay-500 ease-out motion-reduce:transition-none ${
                    heroPanelVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                  All tests passed!
                </div>
              </div>

              <div
                className={`absolute -left-6 top-1/3 bg-card rounded-2xl px-4 py-3 shadow-xl shadow-black/10 border border-border/50 flex items-center gap-3 font-sans transition-all duration-500 delay-700 ease-out motion-reduce:transition-none ${
                  heroPanelVisible ? "translate-x-0 opacity-100" : "-translate-x-5 opacity-0"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent fill-accent" />
                </div>
                <div>
                  <p className="font-bold text-sm">+25 XP</p>
                  <p className="text-xs text-muted-foreground">Challenge complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="landing-features" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 -z-10 bg-muted/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${featuresVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              {t("landing.whyTitlePrefix")} <span className="gradient-text">CodePath</span>{t("landing.whyTitleSuffix")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.whySubtitle")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`transition-all duration-[1250ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  featuresVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                }`}
                style={{ transitionDelay: featuresVisible ? `${i * 170 + 220}ms` : "0ms" }}
              >
                <div className={`group bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 h-full ${feature.border}`}>
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              {t("landing.ctaTitle")}
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              {t("landing.ctaSubtitle")}
            </p>
            <button
              type="button"
              onPointerDown={(event) => handleAuthPress(event, openRegister)}
              onClick={openRegister}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-primary-border bg-primary px-10 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-transform duration-75 hover:bg-primary/90 hover:shadow-primary/35 active:scale-[0.98]"
            >
              {t("auth.signUp")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CodePathLogo size={28} className="rounded-lg" />
            <span className="font-display font-semibold text-sm">CodePath</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("landing.footerNote")}</p>
        </div>
      </footer>
    </div>
  );
}
