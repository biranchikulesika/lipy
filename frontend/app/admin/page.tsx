'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3, Eye, FileText, Clock, ArrowUpRight,
  TrendingUp, Shield, Settings, Loader2,
  Mail, CalendarDays, Fingerprint, ChevronRight,
  Database, UserCheck, Users, AlertCircle, Github,
  CheckCircle2, Hash
} from 'lucide-react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';

interface RecentSessionActivity {
  contributor_id: string;
  contributor_name: string;
  session_id: string;
  total_chars: number;
  start_at: string;
  end_at: string;
  created_at: string;
}

function formatRecentActivityDate(dateValue: string) {
  const date = new Date(dateValue);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = String(date.getFullYear()).slice(-2);
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${day} ${month} ${year}, ${time}`;
}

// ─── Stat Card ───
function StatCard({
  label, value, icon: Icon, trend, color, delay,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  trend?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-4 sm:p-5 hover:shadow-md hover:shadow-stone-950/50 transition-shadow select-none"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="hidden sm:block text-[11px] font-bold uppercase tracking-widest text-stone-500">{label}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{value}</p>
          {trend && (
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
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
  title, description, icon: Icon, href, color, delay, external = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  delay: number;
  external?: boolean;
}) {
  const sharedClassName = "group block bg-[#0F0F0F] border border-stone-900 rounded-xl p-4 sm:p-5 hover:shadow-md hover:shadow-stone-950/50 transition-all hover:border-amber-400/50 active:scale-[0.98] hover:-translate-y-[1px] duration-200 ease-out";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    >
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className={sharedClassName}>
          <div className="flex items-center gap-3.5">
            <div className={`flex p-2.5 rounded-xl shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-stone-200">
                {title}
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="hidden sm:block text-xs text-stone-400 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
        </a>
      ) : (
        <Link href={href} className={sharedClassName}>
          <div className="flex items-center gap-3.5">
            <div className={`flex p-2.5 rounded-xl shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-stone-200">
                {title}
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="hidden sm:block text-xs text-stone-400 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
        </Link>
      )}
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [lastSignIn, setLastSignIn] = useState('');
  
  const [totalSamples, setTotalSamples] = useState(0);
  const [verifiedSamples, setVerifiedSamples] = useState(0);
  const [pendingSamples, setPendingSamples] = useState(0);
  const [totalContributors, setTotalContributors] = useState(0);
  const [recentSessions, setRecentSessions] = useState<RecentSessionActivity[]>([]);
  
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const [maxGridHeight, setMaxGridHeight] = useState<number>(400);
  const [isDesktop, setIsDesktop] = useState(false);

  const updateMaxGridHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    setIsDesktop(window.innerWidth >= 1024);
    
    if (!containerRef.current || !overviewRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const overviewRect = overviewRef.current.getBoundingClientRect();
    
    // Remaining height from bottom of overview to bottom of container minus padding
    const availableHeight = containerRect.bottom - overviewRect.bottom - 24;
    setMaxGridHeight(Math.max(250, availableHeight));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    updateMaxGridHeight();
    window.addEventListener('resize', updateMaxGridHeight);
    return () => window.removeEventListener('resize', updateMaxGridHeight);
  }, [updateMaxGridHeight]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(updateMaxGridHeight, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, updateMaxGridHeight]);

  useEffect(() => {
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (!url || !key) { setLoading(false); return; }
        const supabase = createClient();
        
        // 1. Fetch user auth metadata
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.user_metadata?.full_name || user.user_metadata?.name || '');
          setUserEmail(user.email || '');
          setUserAvatar(user.user_metadata?.avatar_url || '');
          setLastSignIn(user.last_sign_in_at
            ? new Date(user.last_sign_in_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '');
        }

        // 2. Fetch dataset statistics in parallel
        const [
          totalRes,
          verifiedRes,
          contributorsRes,
          recentRes
        ] = await Promise.all([
          // Total samples count
          supabase.from('lipy_samples').select('*', { count: 'exact', head: true }),
          // Verified samples count
          supabase.from('lipy_samples').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
          // Contributors count data
          supabase.from('lipy_samples').select('contributor_id, contributor_name'),
          // Recent samples to aggregate into contributor sessions
          supabase.from('lipy_samples').select('contributor_id, contributor_name, session_id, created_at').order('created_at', { ascending: false }).limit(50)
        ]);

        const total = totalRes.count || 0;
        const verified = verifiedRes.count || 0;
        setTotalSamples(total);
        setVerifiedSamples(verified);
        setPendingSamples(Math.max(0, total - verified));

        // Deduplicate contributors
        const uniqueContributors = new Set<string>();
        if (contributorsRes.data) {
          contributorsRes.data.forEach((row: any) => {
            if (row.contributor_id) {
              uniqueContributors.add(row.contributor_id);
            } else if (row.contributor_name) {
              uniqueContributors.add(row.contributor_name);
            }
          });
        }
        setTotalContributors(uniqueContributors.size);

        if (recentRes.data) {
          const sessionMap = new Map<string, RecentSessionActivity>();
          recentRes.data.forEach((row: any) => {
            const sessionKey = `${row.contributor_id || row.contributor_name || 'anonymous'}::${row.session_id || 'session'}`;
            const current = sessionMap.get(sessionKey);
            if (!current) {
              sessionMap.set(sessionKey, {
                contributor_id: row.contributor_id || '',
                contributor_name: row.contributor_name || 'Anonymous',
                session_id: row.session_id || 'Unknown',
                total_chars: 1,
                start_at: row.created_at,
                end_at: row.created_at,
                created_at: row.created_at,
              });
              return;
            }

            current.total_chars += 1;
            if (new Date(row.created_at).getTime() < new Date(current.start_at).getTime()) {
              current.start_at = row.created_at;
            }
            if (new Date(row.created_at).getTime() > new Date(current.created_at).getTime()) {
              current.end_at = row.created_at;
              current.created_at = row.created_at;
            }
          });

          const groupedSessions = Array.from(sessionMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

          setRecentSessions(groupedSessions);
        }

      } catch (err) {
        console.error('Error fetching admin metrics:', err);
      } finally {
        setLoading(false);
      }
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
      <div ref={containerRef} className="p-3 sm:p-4 md:p-5 space-y-4 w-full max-w-none flex flex-col flex-1 h-full overflow-hidden">
        
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden px-1 py-2 text-stone-100 shrink-0"
        >
          <div className="flex items-center gap-3">
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatar} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-stone-800/70 flex items-center justify-center text-base sm:text-lg font-bold">
                {(userName || userEmail || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="min-w-0 text-sm sm:text-base leading-tight tracking-normal">
              <span className="block text-[10px] sm:text-[11px] uppercase tracking-[0.24em] opacity-70 font-semibold font-display">
                {greeting}
              </span>
              <span className="block truncate text-base sm:text-[1.35rem] font-display font-bold tracking-[-0.02em]">
                {userName ? userName.trim().split(' ')[0] : (userEmail ? userEmail.split('@')[0].split(/[\._-]/)[0].replace(/\b\w/g, c => c.toUpperCase()) : 'Admin')}
              </span>
            </h2>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div ref={overviewRef} className="shrink-0">
          <h3 className="mb-2 px-0.5 font-display select-none text-xs font-semibold uppercase tracking-[0.24em] text-stone-500 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:hidden" />
            <span className="sm:hidden">Overview</span>
            <span className="hidden sm:inline">Overview</span>
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <StatCard label="Total Samples" value={String(totalSamples)} icon={FileText} color="bg-amber-950/30 text-amber-500" delay={0.05} />
            </div>
            <StatCard label="Verified Samples" value={String(verifiedSamples)} icon={CheckCircle2} color="bg-emerald-950/30 text-emerald-500" delay={0.1} />
            <div className="hidden sm:block">
              <StatCard label="Pending Audit" value={String(pendingSamples)} icon={Clock} color="bg-rose-950/30 text-rose-500" delay={0.15} />
            </div>
            <StatCard label="Total Contributors" value={String(totalContributors)} icon={Users} color="bg-blue-950/30 text-blue-500" delay={0.2} />
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div
          style={isDesktop ? { maxHeight: `${maxGridHeight}px` } : undefined}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch w-full overflow-hidden shrink-0"
        >
          
          {/* Left Area (2/3 width) - Recent Activity */}
          <div className="lg:col-span-2 flex h-full overflow-hidden">
            <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-4 shadow-sm flex flex-col h-full w-full overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500 select-none font-display">Recent Activity</h3>
                </div>
                <Link
                  href="/admin/dataset"
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 transition-all"
                >
                  View All
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentSessions.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs flex-1 flex items-center justify-center">
                  No recent activity found.
                </div>
              ) : (
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-900/50 text-[10px] uppercase font-bold tracking-widest text-stone-500 select-none">
                        <th className="py-2.5 px-1 w-[52%] sm:w-auto">
                          <span className="sm:hidden inline-flex items-center justify-start w-full">
                            <Fingerprint className="w-4 h-4" />
                          </span>
                          <span className="hidden sm:inline">Contributor Session</span>
                        </th>
                        <th className="py-2.5 px-3 w-[18%] sm:w-auto whitespace-nowrap">
                          <span className="sm:hidden inline-flex items-center justify-start w-full">
                            <Hash className="w-4 h-4" />
                          </span>
                          <span className="hidden sm:inline">Total Chars</span>
                        </th>
                        <th className="py-2.5 px-3 w-[30%] sm:w-auto whitespace-nowrap">
                          <span className="sm:hidden inline-flex items-center justify-end w-full">
                            <Clock className="w-4 h-4" />
                          </span>
                          <span className="hidden sm:inline">Date Time</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-900/30 text-xs">
                      {recentSessions.map((session) => (
                        <tr key={`${session.contributor_name}-${session.session_id}-${session.created_at}`} className="transition-colors">
                          <td className="py-2.5 px-1">
                            <span className="block text-sm font-bold text-stone-200 truncate max-w-[220px]">
                              {session.contributor_name || 'Anonymous'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-400 font-medium">
                            {session.total_chars}
                          </td>
                          <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap w-[30%] sm:w-auto">
                            {formatRecentActivityDate(session.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Area (1/3 width) - Operations */}
          <div className="flex flex-col h-full overflow-hidden">
            {/* Quick Actions Card */}
            <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-4 shadow-sm space-y-3 flex flex-col h-full overflow-hidden">
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500 font-display shrink-0">Quick Operations</h3>
              <div className="space-y-2.5 flex-1 overflow-auto pr-0.5">
                <QuickAction
                  title="Dataset Viewer"
                  description="Browse, audit, and clean handwritten sample images"
                  icon={Database}
                  href="/admin/dataset"
                  color="bg-amber-950/30 text-amber-500"
                  delay={0.05}
                />
                <QuickAction
                  title="Security Settings"
                  description="Manage password, linked accounts, and passkeys"
                  icon={Settings}
                  href="/admin/settings"
                  color="bg-blue-950/30 text-blue-500"
                  delay={0.1}
                />
                <QuickAction
                  title="Lipy GitHub"
                  description="Open the source repository for the project"
                  icon={Github}
                  href="https://github.com/biranchikulesika/lipy"
                  color="bg-emerald-950/30 text-emerald-500"
                  delay={0.15}
                  external
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </AdminShell>
  );
}
