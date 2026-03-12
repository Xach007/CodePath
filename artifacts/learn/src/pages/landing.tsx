import { useState, useEffect } from "react";
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
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,60%)] flex items-center justify-center text-white font-bold font-display text-lg shadow-lg shadow-primary/25">
              C
            </div>
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
                <form onSubmit={handleLogin} className="space-y-5 mt-6">
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
                <form onSubmit={handleRegister} className="space-y-5 mt-6">
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[hsl(280,80%,60%)] flex items-center justify-center text-white font-bold font-display text-xs">
              C
            </div>
            <span className="font-display font-semibold text-sm">CodePath</span>
          </div>
          <p className="text-xs text-muted-foreground">Built with passion for learning.</p>
        </div>
      </footer>
    </div>
  );
}
