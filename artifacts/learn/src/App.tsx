import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Lesson from "@/pages/lesson";
import Profile from "@/pages/profile";
import Achievements from "@/pages/achievements";
import Leaderboard from "@/pages/leaderboard";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...pageTransition}>
      {children}
    </motion.div>
  );
}

function LayoutPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <Layout>
      <PageWrapper>
        <Component />
      </PageWrapper>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/admin">{() => <AdminPage />}</Route>
      <Route path="/lessons/:id" component={Lesson} />
      <Route path="/dashboard">{() => <LayoutPage component={Dashboard} />}</Route>
      <Route path="/courses/:id">{() => <LayoutPage component={CourseDetail} />}</Route>
      <Route path="/courses">{() => <LayoutPage component={Courses} />}</Route>
      <Route path="/profile">{() => <LayoutPage component={Profile} />}</Route>
      <Route path="/achievements">{() => <LayoutPage component={Achievements} />}</Route>
      <Route path="/leaderboard">{() => <LayoutPage component={Leaderboard} />}</Route>
      <Route>{() => <LayoutPage component={NotFound} />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
          <Router />
        </WouterRouter>
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
