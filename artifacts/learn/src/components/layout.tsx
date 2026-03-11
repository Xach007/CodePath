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
  Sun
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
    } catch (e) {
      // Ignore errors, force local logout anyway
    }
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
      <header className="sticky top-0 z-50 glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold font-display text-xl shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                C
              </div>
              <span className="font-display font-bold text-xl tracking-tight hidden sm:block">CodePath</span>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      location === link.href 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isLoadingUser ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 sm:gap-6">
                {/* Gamification Stats */}
                {gamification && (
                  <div className="hidden sm:flex items-center gap-4 bg-muted/50 rounded-full px-4 py-1.5 border border-border/50">
                    <div className="flex items-center gap-1.5 text-accent font-bold" title="Day Streak">
                      <Flame className="w-5 h-5 fill-accent" />
                      <span>{gamification.currentStreak}</span>
                    </div>
                    <div className="w-px h-4 bg-border"></div>
                    <div className="flex items-center gap-1.5 text-primary font-bold" title="Total XP">
                      <Star className="w-5 h-5 fill-primary" />
                      <span>{gamification.totalXP}</span>
                    </div>
                  </div>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full ring-offset-background">
                      <Avatar className="w-9 h-9 border-2 border-border hover:border-primary transition-colors">
                        <AvatarImage src={user.avatarUrl || `${import.meta.env.BASE_URL}images/avatar-placeholder.png`} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none font-display">{user.displayName || user.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer rounded-lg">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive rounded-lg" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu */}
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                      <nav className="flex flex-col gap-2 mt-8">
                        {gamification && (
                          <div className="flex items-center gap-6 p-4 bg-muted rounded-xl mb-4">
                            <div className="flex items-center gap-2 text-accent font-bold">
                              <Flame className="w-5 h-5 fill-accent" />
                              <span>{gamification.currentStreak} Day Streak</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-bold">
                              <Star className="w-5 h-5 fill-primary" />
                              <span>{gamification.totalXP} XP</span>
                            </div>
                          </div>
                        )}
                        {navLinks.map((link) => (
                          <Link 
                            key={link.href} 
                            href={link.href}
                            className={`px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-3 ${
                              location === link.href 
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <link.icon className="w-5 h-5" />
                            {link.label}
                          </Link>
                        ))}
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="ghost" className="hidden sm:inline-flex rounded-xl">Log in</Button>
                </Link>
                <Link href="/">
                  <Button className="rounded-xl shadow-lg shadow-primary/20">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
