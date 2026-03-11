import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <div className="text-9xl font-display font-black text-primary/20 mb-4">404</div>
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Page not found</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Looks like you've wandered off the learning path. Let's get you back on track.
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-xl px-8 font-bold">Return Home</Button>
      </Link>
    </div>
  );
}
