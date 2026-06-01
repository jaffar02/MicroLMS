import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-background text-foreground relative overflow-hidden">
      {/* background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/10 blur-3xl animate-pulse"></div>

      {/* subtle floating shapes */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl top-20 left-20"
      ></motion.div>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl bottom-20 right-20"
      ></motion.div>

      {/* content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="z-10"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-primary h-10 w-10 animate-pulse" />
            <h1 className="text-5xl font-bold">404</h1>
          </div>

          <p className="text-lg text-muted-foreground max-w-md">
            Oops! The page you’re looking for doesn’t exist or may have been
            moved.
          </p>

          <Button
            asChild
            className="mt-4 px-6 py-2 text-white !font-semibold !shadow-lg hover:!shadow-primary/40 hover:!scale-105 !transition-all !duration-200"
          >
            <Link to="/">Go Back Home</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
