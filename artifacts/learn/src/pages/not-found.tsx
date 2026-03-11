import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-[120px] md:text-[160px] font-display font-black gradient-text leading-none mb-2">404</div>
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-3">Page not found</h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md">
          Looks like you've wandered off the learning path. Let's get you back on track.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-xl px-8 font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
