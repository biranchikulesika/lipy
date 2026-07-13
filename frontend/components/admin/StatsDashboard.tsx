'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3, FileText, CheckCircle2, Clock, Users, Activity,
  TrendingUp, AlertTriangle, ShieldAlert, Loader2,
  UserCheck, Percent, PieChart, Layers,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { odiaCharacters } from '@/lib/lipyd/odiaCharacters';

// ─── Types ───

interface StatsOverview {
  totalSamples: number;
  verifiedSamples: number;
  pendingSamples: number;
  totalContributors: number;
}

interface VerificationSummary {
  logCount: number;
  acceptedCount: number;
  rejectedCount: number;
  avgConfidence: number | null;
}

interface TopContributor {
  contributor_id: string;
  contributor_name: string;
  total_verified: number;
}

interface PerCharacterCount {
  character_id: string;
  char: string;
  type: 'vowel' | 'consonant' | 'digit' | 'matra';
  count: number;
}

// ─── Helpers ───

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Stat Card ───

function StatCard({
  label, value, icon: Icon, color, subtitle, delay, compact,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  delay: number;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-4 sm:p-5 hover:shadow-md hover:shadow-stone-950/50 transition-shadow select-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className={`font-bold uppercase tracking-widest text-stone-500 truncate ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            {label}
          </p>
          <p className={`font-extrabold tracking-tight ${compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}`}>
            {typeof value === 'number' ? formatLargeNumber(value) : value}
          </p>
          {subtitle && (
            <p className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-stone-500" />
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Progress Bar ───

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-[10px] font-medium text-stone-500">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

// ─── Ring Stat ───

function RingStat({
  value, max, label, color, size = 'md',
}: {
  value: number; max: number; label: string; color: string; size?: 'sm' | 'md';
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const circumference = 2 * Math.PI * (size === 'sm' ? 28 : 40);
  const offset = circumference - (pct / 100) * circumference;
  const dims = size === 'sm' ? 64 : 92;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={dims} height={dims} viewBox={`0 0 ${dims} ${dims}`} className="-rotate-90">
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={size === 'sm' ? 28 : 40}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === 'sm' ? 4 : 6}
          className="text-stone-800"
        />
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={size === 'sm' ? 28 : 40}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === 'sm' ? 4 : 6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className={`font-bold ${size === 'sm' ? 'text-lg' : 'text-xl'}`}>{pct}%</span>
      <span className="text-[10px] text-stone-500 font-medium">{label}</span>
    </div>
  );
}

// ─── Class Row ───

function ClassRow({ char, maxCount, target }: { char: PerCharacterCount; maxCount: number; target: number }) {
  const barPct = maxCount > 0 ? (char.count / maxCount) * 100 : 0;
  const targetPct = maxCount > 0 ? (target / maxCount) * 100 : 0;
  const isBelowTarget = char.count < target;
  const isAtTarget = char.count >= target && char.count <= target * 1.25;
  const gap = target - char.count;

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-4 py-2.5 hover:bg-stone-900/20 transition-colors group">
      {/* Character display */}
      <span className="w-7 text-center text-base sm:text-lg leading-none select-none shrink-0">
        {char.char}
      </span>
      {/* Class ID */}
      <span className="w-20 sm:w-28 text-[10px] sm:text-[11px] font-mono text-stone-400 truncate shrink-0 group-hover:text-stone-300 transition-colors">
        {char.character_id}
      </span>
      {/* Bar */}
      <div className="flex-1 min-w-0 relative h-5">
        {/* Target line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-stone-500/40 z-10 rounded-full"
          style={{ left: `${Math.min(targetPct, 100)}%` }}
          title={`Target: ${target}`}
        />
        {/* Count bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(barPct, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-sm ${
            isBelowTarget
              ? 'bg-gradient-to-r from-rose-600/70 to-amber-500/60'
              : isAtTarget
                ? 'bg-gradient-to-r from-emerald-600/70 to-emerald-500/60'
                : 'bg-gradient-to-r from-emerald-600/70 to-emerald-500/60'
          }`}
        />
      </div>
      {/* Count */}
      <div className="w-12 text-right shrink-0 flex items-center justify-end gap-1">
        <span className={`text-xs font-bold tabular-nums ${
          isBelowTarget ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {char.count}
        </span>
        {isBelowTarget && gap > 0 && (
          <span className="text-[9px] text-rose-500 font-medium hidden sm:inline">
            -{gap}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Group render helper ───

function renderClassGroup({
  chars, type, label, color, dotColor, maxCount, target, isLast,
}: {
  chars: PerCharacterCount[];
  type: string;
  label: string;
  color: string;
  dotColor: string;
  maxCount: number;
  target: number;
  isLast?: boolean;
}) {
  if (!chars.length) return null;
  return (
    <div key={type} className={!isLast ? 'border-b border-stone-900/50' : ''}>
      <div className={`px-4 py-2 bg-stone-900/10 text-[10px] font-bold uppercase tracking-wider ${color} flex items-center gap-2`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {label} — {chars.length} classes
      </div>
      {chars.map((char) => (
        <ClassRow key={char.character_id} char={char} maxCount={maxCount} target={target} />
      ))}
    </div>
  );
}

// ─── Main Component ───

export function StatsDashboard() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [verification, setVerification] = useState<VerificationSummary | null>(null);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [perCharacter, setPerCharacter] = useState<PerCharacterCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      // Fetch verification data from admin API
      const logsResponse = await fetch('/api/lipyd/verify/logs');
      let verificationSummary: VerificationSummary = {
        logCount: 0, acceptedCount: 0, rejectedCount: 0,
        avgConfidence: null,
      };

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        const contributors: any[] = logsData.contributors || [];
        const logEntries: any[] = logsData.logs || [];

        const accepted = logEntries.filter((l: any) => l.accepted).length;
        const confidences = logEntries
          .filter((l: any) => l.confidence != null)
          .map((l: any) => l.confidence);
        const avgConf = confidences.length
          ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
          : null;

        verificationSummary = {
          logCount: logEntries.length,
          acceptedCount: accepted,
          rejectedCount: logEntries.length - accepted,
          avgConfidence: avgConf,
        };

        // Top contributors by total_verified
        const top = (contributors as TopContributor[])
          .filter((c) => c.total_verified > 0)
          .sort((a, b) => b.total_verified - a.total_verified)
          .slice(0, 10);
        setTopContributors(top);
      }

      setVerification(verificationSummary);

      // Fetch dataset overview from Supabase
      if (url && key) {
        const supabase = createClient();

        const [totalRes, verifiedRes, contributorsRes] = await Promise.all([
          supabase.from('lipy_samples').select('*', { count: 'exact', head: true }),
          supabase.from('lipy_samples').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
          supabase.from('lipy_samples').select('contributor_id, character_id'),
        ]);

        const total = totalRes.count || 0;
        const verified = verifiedRes.count || 0;

        // Unique contributors
        const uniqueContributors = new Set<string>();
        if (contributorsRes.data) {
          contributorsRes.data.forEach((row: any) => {
            if (row.contributor_id) uniqueContributors.add(row.contributor_id);
          });
        }

        setOverview({
          totalSamples: total,
          verifiedSamples: verified,
          pendingSamples: Math.max(0, total - verified),
          totalContributors: uniqueContributors.size,
        });

        // Per-character distribution — merge DB counts with full character list
        // so classes with zero samples appear with count 0.
        const dbCountMap = new Map<string, number>();
        if (contributorsRes.data) {
          contributorsRes.data.forEach((row: any) => {
            if (row.character_id) {
              dbCountMap.set(row.character_id, (dbCountMap.get(row.character_id) || 0) + 1);
            }
          });
        }
        const charCounts: PerCharacterCount[] = odiaCharacters
          .map((c) => ({
            character_id: c.id,
            char: c.char,
            type: c.type,
            count: dbCountMap.get(c.id) || 0,
          }))
          .sort((a, b) => b.count - a.count);
        setPerCharacter(charCounts);
      }

    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load some statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !overview) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 animate-pulse">
            Loading statistics
          </p>
        </div>
      </div>
    );
  }

  if (error && !overview && !verification) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-8 text-center max-w-md space-y-4">
          <div className="p-3 bg-rose-950/20 rounded-xl inline-flex mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-200">Unable to load statistics</h3>
            <p className="text-xs text-stone-400 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px active:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const acceptanceRate = verification && verification.logCount > 0
    ? Math.round((verification.acceptedCount / verification.logCount) * 100)
    : null;

  const totalClasses = perCharacter.length;
  const balancedTarget = overview && overview.totalSamples > 0 && totalClasses > 0
    ? Math.round(overview.totalSamples / totalClasses)
    : 0;
  const maxCharCount = perCharacter.length > 0
    ? Math.max(...perCharacter.map((c) => c.count))
    : 0;

  return (
    <div className="p-3 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-1"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-950/30 rounded-xl">
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-100">Dataset Statistics</h2>
            <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium">
              Collection metrics, verification pipeline, and contributor insights
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-800 bg-[#0F0F0F] hover:bg-stone-900/60 hover:border-stone-700 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-all disabled:opacity-50 active:scale-95 shrink-0"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </motion.div>

      {/* ─── Dataset Overview ─── */}
      <div>
        <h3 className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500 flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5" />
          Dataset Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatCard
            label="Total Samples"
            value={overview?.totalSamples ?? 0}
            icon={FileText}
            color="bg-amber-950/30 text-amber-500"
            delay={0.05}
          />
          <StatCard
            label="Verified"
            value={overview?.verifiedSamples ?? 0}
            icon={CheckCircle2}
            color="bg-emerald-950/30 text-emerald-500"
            delay={0.1}
          />
          <StatCard
            label="Pending"
            value={overview?.pendingSamples ?? 0}
            icon={Clock}
            color="bg-rose-950/30 text-rose-500"
            delay={0.15}
          />
          <StatCard
            label="Contributors"
            value={overview?.totalContributors ?? 0}
            icon={Users}
            color="bg-blue-950/30 text-blue-500"
            delay={0.2}
          />
        </div>
      </div>

      {/* ─── Verification Pipeline ─── */}
      <div>
        <h3 className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          Verification Pipeline
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Left: main stats */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <StatCard
              label="Total Requests"
              value={verification?.logCount ?? 0}
              icon={Activity}
              color="bg-violet-950/30 text-violet-500"
              delay={0.25}
              compact
            />
            <StatCard
              label="Accepted"
              value={verification?.acceptedCount ?? 0}
              icon={CheckCircle2}
              color="bg-emerald-950/30 text-emerald-500"
              delay={0.3}
              compact
            />
            <StatCard
              label="Avg Confidence"
              value={verification?.avgConfidence != null
                ? `${(verification.avgConfidence * 100).toFixed(1)}%`
                : '—'}
              icon={Percent}
              color="bg-cyan-950/30 text-cyan-500"
              delay={0.35}
              compact
            />

            <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-4 flex flex-col items-center justify-center">
              {acceptanceRate != null ? (
                <RingStat value={verification?.acceptedCount ?? 0} max={verification?.logCount ?? 1} label="Acceptance Rate" color="text-emerald-500" size="sm" />
              ) : (
                <p className="text-xs text-stone-500">No data</p>
              )}
            </div>
          </div>

          {/* Right: balanced target summary */}
          <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
            {perCharacter.length > 0 && overview && overview.totalSamples > 0 ? (
              <>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Balance Ratio</p>
                  <p className={`text-xl font-extrabold ${(() => {
                    const counts = perCharacter.map((c) => c.count).filter((n) => n > 0);
                    if (counts.length < 2) return 'text-stone-400';
                    const ratio = Math.max(...counts) / Math.min(...counts);
                    if (ratio <= 2) return 'text-emerald-400';
                    if (ratio <= 5) return 'text-amber-400';
                    return 'text-rose-400';
                  })()}`}>
                    {(() => {
                      const counts = perCharacter.map((c) => c.count).filter((n) => n > 0);
                      if (counts.length < 2) return '—';
                      return `${Math.max(...counts)}×`;
                    })()}
                  </p>
                  <p className="text-[10px] text-stone-500">max/min non-zero</p>
                </div>
                <div className="w-full h-px bg-stone-900" />
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Classes Needing Samples</p>
                  <p className="text-xl font-extrabold text-amber-400">
                    {perCharacter.filter((c) => c.count < balancedTarget).length}
                  </p>
                  <p className="text-[10px] text-stone-500">below target of {balancedTarget}</p>
                </div>
              </>
            ) : (
              <p className="text-xs text-stone-500">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Class Distribution ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35 }}
      >
        <h3 className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          Class Distribution
        </h3>
        <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl overflow-hidden">
          {perCharacter.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">No character data yet.</div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-stone-900 bg-stone-900/20">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {totalClasses} classes
                </span>
                <span className="text-stone-700">·</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Target: <span className="text-stone-200">{balancedTarget}</span> per class
                </span>
                <span className="text-stone-700">·</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Min: <span className="text-rose-400">{Math.min(...perCharacter.map((c) => c.count))}</span>
                </span>
                <span className="text-stone-700">·</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Max: <span className="text-emerald-400">{maxCharCount}</span>
                </span>
              </div>

              {renderClassGroup({
                chars: perCharacter.filter((c) => c.type === 'vowel'),
                type: 'vowels',
                label: 'Vowels',
                color: 'text-blue-400',
                dotColor: 'bg-blue-500',
                maxCount: maxCharCount,
                target: balancedTarget,
              })}
              {renderClassGroup({
                chars: perCharacter.filter((c) => c.type === 'consonant'),
                type: 'consonants',
                label: 'Consonants',
                color: 'text-emerald-400',
                dotColor: 'bg-emerald-500',
                maxCount: maxCharCount,
                target: balancedTarget,
              })}
              {renderClassGroup({
                chars: perCharacter.filter((c) => c.type === 'digit'),
                type: 'digits',
                label: 'Digits',
                color: 'text-amber-400',
                dotColor: 'bg-amber-500',
                maxCount: maxCharCount,
                target: balancedTarget,
                isLast: true,
              })}
            </>
          )}
        </div>
      </motion.div>

      {/* ─── Top Contributors ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.35 }}
      >
        <h3 className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" />
          Top Contributors
        </h3>
        <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl overflow-hidden">
          {topContributors.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">No contributor data yet.</div>
          ) : (
            <div className="divide-y divide-stone-900/50">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                <span className="w-6 text-center shrink-0">#</span>
                <span className="flex-1 min-w-0">Contributor</span>
                <span className="w-16 text-right shrink-0">Verified</span>
              </div>

              {topContributors.map((c, i) => (
                <div key={c.contributor_id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-900/20 transition-colors">
                  <span className="w-6 text-center text-xs font-bold text-stone-500 shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-200 truncate">
                      {c.contributor_name || 'Anonymous'}
                    </p>
                    <p className="text-[10px] font-mono text-stone-500 truncate">
                      {c.contributor_id}
                    </p>
                  </div>
                  <div className="w-16 text-right shrink-0">
                    <span className="text-sm font-bold text-emerald-400">{c.total_verified}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Summary Bar ─── */}
      {overview && overview.totalSamples > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.35 }}
          className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-4 space-y-2"
        >
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Dataset Health
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ProgressBar
              value={overview.verifiedSamples}
              max={overview.totalSamples}
              color="bg-emerald-500"
              label="Verified vs Total"
            />
            <ProgressBar
              value={verification?.acceptedCount ?? 0}
              max={verification?.logCount ?? 1}
              color="bg-blue-500"
              label="Accepted vs Requests"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
