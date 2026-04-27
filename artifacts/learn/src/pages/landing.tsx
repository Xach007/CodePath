import { useState, useEffect } from "react";
import { CodePathLogo } from "@/components/codepath-logo";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLogin, useRegister, useGetMe } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { Code2, Trophy, Zap, Terminal, ArrowRight, Sparkles, Play, Users, Star, BookOpen, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

const GOOGLE_AUTH_URL = "/api/auth/google";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { t, i18n } = useTranslation();
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

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
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setToken(token);
      window.location.replace("/dashboard");
    }
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
    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } });
      setToken(res.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await registerMutation.mutateAsync({ data: { email, password, username, displayName: username } });
      setToken(res.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
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
    { value: "100%", label: "Free", icon: Star },
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
            <motion.button 
              whileTap={{ scale: 0.9, rotate: 15 }}
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors duration-300"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </motion.button>
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-xl font-medium hidden sm:inline-flex">{t("nav.login")}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] rounded-3xl p-8 border-border/50">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-2xl font-display font-bold">{t("auth.loginTitle")}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {t("auth.loginSubtitle")}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 space-y-4">
                  <a href={GOOGLE_AUTH_URL} className="block">
                    <Button type="button" variant="outline" className="w-full h-12 rounded-xl text-base font-semibold border-2 flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Войти через Google
                    </Button>
                  </a>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-3 text-muted-foreground font-medium">или</span>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">{t("auth.email")}</Label>
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
                    <Label htmlFor="login-password" className="text-sm font-medium">{t("auth.password")}</Label>
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
                    <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2.5 rounded-xl">Invalid credentials. Please try again.</p>
                  )}
                  <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold mt-2" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "..." : t("auth.signIn")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg shadow-primary/20 font-semibold">{t("nav.getStarted")}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] rounded-3xl p-8 border-border/50">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-2xl font-display font-bold">{t("auth.registerTitle")}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {t("auth.registerSubtitle")}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 space-y-4">
                  <a href={GOOGLE_AUTH_URL} className="block">
                    <Button type="button" variant="outline" className="w-full h-12 rounded-xl text-base font-semibold border-2 flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Зарегистрироваться через Google
                    </Button>
                  </a>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-3 text-muted-foreground font-medium">или</span>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">{t("auth.username")}</Label>
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
                    <Label htmlFor="email" className="text-sm font-medium">{t("auth.email")}</Label>
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
                    <Label htmlFor="password" className="text-sm font-medium">{t("auth.password")}</Label>
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
                  <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold mt-2" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "..." : t("auth.signUp")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-[hsl(280,80%,60%)]/5 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="max-w-xl"
            >
              <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 text-primary font-semibold text-sm mb-8 border border-primary/15">
                <Sparkles className="w-4 h-4" />
                <span>{t("landing.badge")}</span>
              </motion.div>
              
              <motion.h1 variants={item} className="text-5xl sm:text-6xl lg:text-[4.25rem] font-display font-extrabold leading-[1.08] text-foreground mb-6">
                {t("landing.title1")}{" "}
                <span className="gradient-text">{t("landing.titleHighlight")}</span>{" "}
                {t("landing.title2")}
              </motion.h1>
              
              <motion.p variants={item} className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
                {t("landing.subtitle")}
              </motion.p>
              
              <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  onClick={() => setIsRegisterOpen(true)}
                  className="rounded-2xl h-14 px-8 text-base font-bold shadow-xl shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  {t("landing.startFree")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setIsLoginOpen(true)}
                  className="rounded-2xl h-14 px-8 text-base font-bold border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  {t("landing.haveAccount")}
                </Button>
              </motion.div>

              <motion.div variants={item} className="flex items-center gap-6 mt-10 pt-8 border-t border-border/50">
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
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="relative hidden lg:block"
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
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="absolute -bottom-2 -right-2 bg-success text-success-foreground rounded-2xl px-4 py-2.5 shadow-xl shadow-success/30 flex items-center gap-2 font-sans font-bold text-sm border-4 border-background"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                  All tests passed!
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute -left-6 top-1/3 bg-card rounded-2xl px-4 py-3 shadow-xl shadow-black/10 border border-border/50 flex items-center gap-3 font-sans"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent fill-accent" />
                </div>
                <div>
                  <p className="font-bold text-sm">+25 XP</p>
                  <p className="text-xs text-muted-foreground">Challenge complete</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 -z-10 bg-muted/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Why learn with <span className="gradient-text">CodePath</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combined game design and cognitive science to make learning to code effective and fun.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={`group bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 h-full ${feature.border}`}>
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              Start building today
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join CodePath and start your journey from beginner to developer. No credit card required.
            </p>
            <Button 
              size="lg" 
              onClick={() => setIsRegisterOpen(true)}
              className="rounded-2xl h-14 px-10 text-base font-bold shadow-xl shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              {t("auth.signUp")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CodePathLogo size={28} className="rounded-lg" />
            <span className="font-display font-semibold text-sm">CodePath</span>
          </div>
          <p className="text-xs text-muted-foreground">Built with passion for learning.</p>
        </div>
      </footer>
    </div>
  );
}
