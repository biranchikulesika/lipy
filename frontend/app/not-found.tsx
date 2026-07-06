"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Home, Users, Info } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-4.5rem)] w-full flex flex-col items-center justify-center font-sans px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center text-center p-6 max-w-md mx-auto relative z-10"
      >
        <h1 className="text-7xl font-black mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-verdigris-600 to-[#d4a055] dark:from-verdigris-400 dark:to-[#d4a055]">
          404
        </h1>
        <h2 className="text-xl font-bold mb-3 tracking-tight text-slate-900 dark:text-white">
          Page Not Found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[280px]">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex justify-center items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center justify-center w-12 h-12 rounded-full bg-verdigris-900 dark:bg-verdigris-100 text-white dark:text-slate-900 hover:bg-verdigris-800 dark:hover:bg-verdigris-200 transition-all active:scale-95 shadow-sm"
            aria-label="Home"
            title="Home"
          >
            <Home className="w-5 h-5" />
          </Link>
          <span className="text-verdigris-900/20 dark:text-white/20 font-light text-xl">|</span>
          <Link 
            href="/team" 
            className="flex sm:hidden items-center justify-center w-12 h-12 rounded-full border border-verdigris-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-verdigris-900/5 dark:hover:bg-white/5 transition-all active:scale-95 shadow-inner"
            aria-label="Our Team"
            title="Our Team"
          >
            <Users className="w-5 h-5" />
          </Link>
          <Link 
            href="/about" 
            className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full border border-verdigris-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-verdigris-900/5 dark:hover:bg-white/5 transition-all active:scale-95 shadow-inner"
            aria-label="About Us"
            title="About Us"
          >
            <Info className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
