"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Home, Users, Info } from "lucide-react";

export default function NotFoundClient() {
  return (
    <div className="min-h-[calc(100dvh-4.5rem)] flex items-center justify-center px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 mx-auto flex max-w-sm flex-col items-center p-6 text-center"
      >
        <h1 className="mb-2 bg-linear-to-r from-verdigris-400 to-[#d4a055] bg-clip-text text-7xl font-black tracking-tighter text-transparent">
          404
        </h1>

        <h2 className="mb-3 text-xl font-bold tracking-tight text-white">
          Page Not Found
        </h2>

        <p className="mb-6 max-w-70 text-sm text-slate-400">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            aria-label="Home"
            title="Home"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-verdigris-100 text-slate-900 shadow-sm transition-all hover:bg-verdigris-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdigris-500 active:scale-95"
          >
            <Home className="h-5 w-5" />
          </Link>

          <span className="text-xl font-light text-white/20">
            |
          </span>

          <Link
            href="/team"
            aria-label="Our Team"
            title="Our Team"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdigris-500 active:scale-95 sm:hidden"
          >
            <Users className="h-5 w-5" />
          </Link>

          <Link
            href="/about"
            aria-label="About"
            title="About"
            className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdigris-500 active:scale-95 sm:flex"
          >
            <Info className="h-5 w-5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}