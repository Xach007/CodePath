import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/lib/i18n";

import { IntroAnimation } from "@/components/intro-animation";
import { getToken } from "@/lib/auth";
import Landing from "@/pages/landing";

const Layout = lazy(() => import("@/components/layout").then((module) => ({ default: module.Layout })));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Courses = lazy(() => import("@/pages/courses"));
const CourseDetail = lazy(() => import("@/pages/course-detail"));
const Lesson = lazy(() => import("@/pages/lesson"));
const Profile = lazy(() => import("@/pages/profile"));
const Settings = lazy(() => import("@/pages/settings"));
const Help = lazy(() => import("@/pages/help"));
const Achievements = lazy(() => import("@/pages/achievements"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const AdminPage = lazy(() => import("@/pages/admin"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const INTRO_SEEN_KEY = "codepath_intro_seen";
const INTRO_REQUEST_KEY = "codepath_show_intro";

function shouldShowIntroOnLoad() {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.includes("/admin")) return false;
  if (window.localStorage.getItem("admin_token")) return false;
  if (getToken()) return false;
  if (new URLSearchParams(window.location.search).has("auth")) return false;

  if (window.sessionStorage.getItem(INTRO_REQUEST_KEY) === "1") {
    window.sessionStorage.removeItem(INTRO_REQUEST_KEY);
    return true;
  }

  if (window.location.pathname === "/") return true;

  return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== "1";
}

function PageWrapper({
  children,
  skipInitialAnimation = false,
}: {
  children: React.ReactNode;
  skipInitialAnimation?: boolean;
}) {
  const [location] = useLocation();
  const skippedLocationRef = useRef(skipInitialAnimation ? location : null);
  const shouldAnimate = skippedLocationRef.current !== location;

  return (
    <div key={location} className={shouldAnimate ? "page-transition" : undefined}>
      {children}
    </div>
  );
}

function PageLoading() {
  return (
    <div className="min-h-[60vh] bg-background" />
  );
}

function RouteSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoading />}>
      {children}
    </Suspense>
  );
}

function LayoutPage({
  children,
  skipInitialAnimation = false,
}: {
  children: React.ReactNode;
  skipInitialAnimation?: boolean;
}) {
  return (
    <RouteSuspense>
      <Layout>
        <PageWrapper skipInitialAnimation={skipInitialAnimation}>
          {children}
        </PageWrapper>
      </Layout>
    </RouteSuspense>
  );
}

function Router({
  skipInitialPageAnimation = false,
  introActive = false,
}: {
  skipInitialPageAnimation?: boolean;
  introActive?: boolean;
}) {
  return (
    <Switch>
      <Route path="/">{() => <PageWrapper skipInitialAnimation={skipInitialPageAnimation}><Landing introActive={introActive} /></PageWrapper>}</Route>
      <Route path="/admin">{() => <RouteSuspense><PageWrapper skipInitialAnimation={skipInitialPageAnimation}><AdminPage /></PageWrapper></RouteSuspense>}</Route>
      <Route path="/lessons/:id">{() => <RouteSuspense><PageWrapper skipInitialAnimation={skipInitialPageAnimation}><Lesson /></PageWrapper></RouteSuspense>}</Route>
      <Route path="/dashboard">{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><Dashboard /></RouteSuspense></LayoutPage>}</Route>
      <Route path="/courses/:id">{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><CourseDetail /></RouteSuspense></LayoutPage>}</Route>
      <Route path="/courses">{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><Courses /></RouteSuspense></LayoutPage>}</Route>
      <Route path="/profile">{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><Profile /></RouteSuspense></LayoutPage>}</Route>
      <Route path="/settings">{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><Settings /></RouteSuspense></LayoutPage>}</Route>
      <Route path="/help">{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><Help /></RouteSuspense></LayoutPage>}</Route>
      <Route path="/achievements">{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><Achievements /></RouteSuspense></LayoutPage>}</Route>
      <Route path="/leaderboard">{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><Leaderboard /></RouteSuspense></LayoutPage>}</Route>
      <Route>{() => <LayoutPage skipInitialAnimation={skipInitialPageAnimation}><RouteSuspense><NotFound /></RouteSuspense></LayoutPage>}</Route>
    </Switch>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(shouldShowIntroOnLoad);
  const [skipInitialPageAnimation, setSkipInitialPageAnimation] = useState(showIntro);

  useEffect(() => {
    const handleShowIntro = () => {
      if (shouldShowIntroOnLoad()) {
        setSkipInitialPageAnimation(true);
        setShowIntro(true);
      }
    };

    window.addEventListener("codepath:show-intro", handleShowIntro);
    return () => window.removeEventListener("codepath:show-intro", handleShowIntro);
  }, []);

  useEffect(() => {
    if (showIntro || !skipInitialPageAnimation) return;
    const timer = window.setTimeout(() => setSkipInitialPageAnimation(false), 350);
    return () => window.clearTimeout(timer);
  }, [showIntro, skipInitialPageAnimation]);

  const handleIntroComplete = () => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    window.sessionStorage.removeItem(INTRO_REQUEST_KEY);
    setSkipInitialPageAnimation(true);
    setShowIntro(false);
    window.dispatchEvent(new Event("codepath:intro-complete"));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
          <Router
            skipInitialPageAnimation={showIntro || skipInitialPageAnimation}
            introActive={showIntro}
          />
        </WouterRouter>
        <Toaster richColors position="top-center" />
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
