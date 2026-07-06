'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'motion/react';
import {
  BarChart3, Eye, FileText, Clock, ArrowUpRight,
  TrendingUp, Globe, Shield, Settings, Loader2,
  Mail, CalendarDays, Fingerprint, ChevronRight,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';

// ─── Stat Card ───
function StatCard({
  label, value, icon: Icon, trend, color, delay,
}: {
  label: string; value: string; icon: typeof BarChart3;
  trend?: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 sm:p-5 hover:shadow-md dark:hover:shadow-stone-950/50 transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Quick Action Card ───
function QuickAction({
  title, description, icon: Icon, href, color, delay,
}: {
  title: string; description: string; icon: typeof Settings;
  href: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    >
      <Link
        href={href}
        className="group block bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 sm:p-5 hover:shadow-md dark:hover:shadow-stone-950/50 transition-all hover:border-stone-300 dark:hover:border-stone-700"
      >
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              {title}
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [lastSignIn, setLastSignIn] = useState('');
  const [totalSamples, setTotalSamples] = useState('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (!url || !key) { setLoading(false); return; }
        const supabase = createBrowserClient(url, key);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.user_metadata?.full_name || user.user_metadata?.name || '');
          setUserEmail(user.email || '');
          setUserAvatar(user.user_metadata?.avatar_url || '');
          setLastSignIn(user.last_sign_in_at
            ? new Date(user.last_sign_in_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '');
            
          // Fetch total samples count
          try {
            const { count } = await supabase
              .from('lipi_samples')
              .select('*', { count: 'exact', head: true });
            if (count !== null) {
              setTotalSamples(String(count));
            }
          } catch (e) {
            console.error('Error fetching sample count:', e);
          }
        }
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) {
    return (
      <AdminShell title="Dashboard">
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Dashboard" subtitle="Administrator overview">
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 dark:from-stone-100 dark:via-stone-200 dark:to-stone-100 rounded-2xl p-5 sm:p-7 text-white dark:text-stone-900 relative overflow-hidden"
        >
          {/* Decorative dots */}
          <div className="absolute top-4 right-4 opacity-10">
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-current" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full ring-2 ring-white/20 dark:ring-stone-900/20 object-cover" />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 dark:bg-stone-900/10 flex items-center justify-center text-lg sm:text-xl font-bold">
                {(userName || userEmail || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                {greeting}, {userName ? userName.split(' ')[0] : 'Admin'}
              </h2>
              <p className="text-xs sm:text-sm opacity-70 mt-0.5 truncate">
                {userEmail || 'Welcome to the LıPy Admin Portal'}
              </p>
            </div>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 dark:bg-stone-900/10 hover:bg-white/20 dark:hover:bg-stone-900/20 text-xs font-semibold transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              View Site
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 mb-3 px-0.5">Overview</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total Samples" value={totalSamples} icon={Database} color="bg-amber-50 dark:bg-amber-950/30 text-amber-500" delay={0.05} />
            <StatCard label="Total Pages" value="4" icon={FileText} color="bg-blue-50 dark:bg-blue-950/30 text-blue-500" delay={0.1} />
            <StatCard label="Auth Method" value="Supabase" icon={Shield} color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" delay={0.15} />
            <StatCard label="Last Login" value={lastSignIn ? lastSignIn.split(',')[0] : '—'} icon={Clock} color="bg-violet-50 dark:bg-violet-950/30 text-violet-500" delay={0.2} />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 mb-3 px-0.5">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <QuickAction
              title="Dataset Viewer"
              description="Browse, audit, and clean handwritten sample images"
              icon={Database}
              href="/admin/dataset"
              color="bg-amber-50 dark:bg-amber-950/30 text-amber-500"
              delay={0.1}
            />
            <QuickAction
              title="Security Settings"
              description="Manage password, linked accounts, and passkeys"
              icon={Settings}
              href="/admin/settings"
              color="bg-blue-50 dark:bg-blue-950/30 text-blue-500"
              delay={0.15}
            />
            <QuickAction
              title="View Main Site"
              description="Open the public-facing LıPy website"
              icon={Globe}
              href="/"
              color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"
              delay={0.2}
            />
          </div>
        </div>

        {/* Session Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 sm:p-5"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 mb-3">Session Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
              <Mail className="w-4 h-4 text-stone-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Email</p>
                <p className="text-sm font-medium truncate">{userEmail || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
              <CalendarDays className="w-4 h-4 text-stone-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Last Sign-in</p>
                <p className="text-sm font-medium truncate">{lastSignIn || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
              <Fingerprint className="w-4 h-4 text-stone-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Auth Provider</p>
                <p className="text-sm font-medium">Supabase SSR</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminShell>
  );
}
