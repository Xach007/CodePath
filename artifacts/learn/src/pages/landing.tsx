import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLogin, useRegister, useGetMe } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { Code2, Trophy, Zap, Terminal } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useGetMe();
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  if (user && !isUserLoading) {
    setLocation("/dashboard");
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
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20">
                <Zap className="w-4 h-4 fill-primary" />
                <span>The new way to learn coding</span>
              </motion.div>
              
              <motion.h1 variants={item} className="text-5xl lg:text-7xl font-display font-extrabold leading-[1.1] text-foreground mb-6">
                Master code with <span className="gradient-text">interactive</span> lessons.
              </motion.h1>
              
              <motion.p variants={item} className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bite-sized theory, interactive quizzes, and real coding challenges. Build your streak, earn XP, and become a developer.
              </motion.p>
              
              <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="rounded-xl h-14 px-8 text-lg font-bold shadow-xl shadow-primary/25 hover:scale-105 transition-transform">
                      Start Learning for Free
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-display font-bold">Create your account</DialogTitle>
                      <DialogDescription>
                        Join thousands of learners on CodePath today.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegister} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          placeholder="johndoe" 
                          required 
                          className="h-12 rounded-xl"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="m@example.com" 
                          required 
                          className="h-12 rounded-xl"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          required 
                          className="h-12 rounded-xl"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      {registerMutation.error && (
                        <p className="text-sm text-destructive font-medium">Failed to create account. Please try again.</p>
                      )}
                      <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold mt-2" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? "Creating..." : "Sign up"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline" className="rounded-xl h-14 px-8 text-lg font-bold border-2 hover:bg-muted">
                      I already have an account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-display font-bold">Welcome back</DialogTitle>
                      <DialogDescription>
                        Enter your credentials to continue your journey.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input 
                          id="login-email" 
                          type="email" 
                          placeholder="m@example.com" 
                          required 
                          className="h-12 rounded-xl"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input 
                          id="login-password" 
                          type="password" 
                          required 
                          className="h-12 rounded-xl"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      {loginMutation.error && (
                        <p className="text-sm text-destructive font-medium">Invalid credentials. Please try again.</p>
                      )}
                      <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold mt-2" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? "Logging in..." : "Log in"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent/30 blur-3xl -z-10 rounded-full"></div>
              <img 
                src={`${import.meta.env.BASE_URL}images/hero-illustration.png`} 
                alt="Learn to code" 
                className="w-full h-auto drop-shadow-2xl animate-in float"
                style={{ animationDuration: '6s', animationIterationCount: 'infinite', animationName: 'float' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Why learn with CodePath?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We combined the best of game design and cognitive science to make learning to code addictive.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Terminal, title: "Interactive Coding", desc: "Write real code in your browser. Get instant feedback on your solutions." },
              { icon: Trophy, title: "Gamified Learning", desc: "Earn XP, level up, unlock achievements, and compete on the leaderboard." },
              { icon: Code2, title: "Bite-sized Lessons", desc: "Learn a little every day. Maintain your streak and build a habit that sticks." }
            ].map((feature, i) => (
              <div key={i} className="bg-card p-8 rounded-3xl border border-border shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold font-display mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
