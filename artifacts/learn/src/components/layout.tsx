import { Link, useLocation } from "wouter";
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
  Menu,
  Moon,
  Sun,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: gamification } = useGetGamificationProfile({
    query: { enabled: !!user }
  });
  const logoutMutation = useLogout();
  
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

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({});
    } catch (e) {}
    removeToken();
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    queryClient.clear();
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,60%)] flex items-center justify-center text-white font-bold font-display text-lg shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300">
                  C
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight hidden sm:block">CodePath</span>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-0.5">
                {navLinks.map((link) => {
                  const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className="relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
                    >
                      <link.icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`transition-colors duration-300 ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        {link.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute inset-0 bg-primary/8 rounded-xl border border-primary/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.9, rotate: 15 }}
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors duration-300"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? "dark" : "light"}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {isLoadingUser ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {gamification && (
                  <div className="hidden sm:flex items-center gap-3 bg-muted/60 rounded-full px-4 py-1.5 border border-border/50">
                    <div className="flex items-center gap-1.5 font-bold text-sm" title="Day Streak">
                      <Flame className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-accent">{gamification.currentStreak}</span>
                    </div>
                    <div className="w-px h-3.5 bg-border" />
                    <div className="flex items-center gap-1.5 font-bold text-sm" title="Total XP">
                      <Star className="w-4 h-4 text-primary fill-primary" />
                      <span className="text-primary">{gamification.totalXP}</span>
                    </div>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full ring-offset-2 ring-offset-background"
                    >
                      <Avatar className="w-9 h-9 border-2 border-border hover:border-primary/50 transition-colors duration-300">
                        <AvatarImage src={user.avatarUrl || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl shadow-black/10 border border-border/50" sideOffset={8}>
                    <DropdownMenuLabel className="font-normal px-2 py-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold font-display">{user.displayName || user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5">
                        <User className="mr-2.5 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive rounded-xl py-2.5" onClick={handleLogout}>
                      <LogOut className="mr-2.5 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[360px] border-l border-border/50">
                      <nav className="flex flex-col gap-2 mt-8">
                        {gamification && (
                          <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-2xl mb-4 border border-border/50">
                            <div className="flex items-center gap-2 text-accent font-bold text-sm">
                              <Flame className="w-5 h-5 fill-accent" />
                              <span>{gamification.currentStreak} Day Streak</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                              <Star className="w-5 h-5 fill-primary" />
                              <span>{gamification.totalXP} XP</span>
                            </div>
                          </div>
                        )}
                        {navLinks.map((link) => {
                          const isActive = location === link.href;
                          return (
                            <Link 
                              key={link.href} 
                              href={link.href}
                              className={`px-4 py-3.5 rounded-2xl text-base font-medium transition-all duration-300 flex items-center gap-3 ${
                                isActive 
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                  : "text-foreground hover:bg-muted"
                              }`}
                            >
                              <link.icon className="w-5 h-5" />
                              {link.label}
                            </Link>
                          );
                        })}
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/">
                  <Button variant="ghost" className="hidden sm:inline-flex rounded-xl font-medium">Log in</Button>
                </Link>
                <Link href="/">
                  <Button className="rounded-xl shadow-lg shadow-primary/20 font-semibold">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
