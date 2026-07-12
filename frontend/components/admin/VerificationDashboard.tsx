'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle,
  Clock, UserCheck, Ban, TrendingUp, Loader2,
  ChevronDown, Search, RefreshCw, Activity,
  Users,
} from 'lucide-react';

// ─── Types ───

interface VerificationLogEntry {
  timestamp: string;
  contributorId: string;
  expectedCharacter: string;
  predictedCharacter: string | null;
  confidence: number | null;
  accepted: boolean;
  invalidStreakAfterRequest: number;
  temporaryBanApplied: boolean;
  processingTimeMs: number;
  stage?: string;
  reason?: string;
}

interface ContributorStats {
  contributor_id: string;
  contributor_name: string;
  invalid_streak: number;
  banned_until: string | null;
  trust_score: number;
  total_verified: number;
  total_rejected: number;
  last_invalid_at: string | null;
  last_verified_at: string | null;
  last_seen_at: string | null;
}

interface ApiResponse {
  logs: VerificationLogEntry[];
  contributors: ContributorStats[];
  totalBanned: number;
  totalWithStreak: number;
  timestamp: string;
}

// ─── Helpers ───

function formatTimeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

function isBanned(contributor: ContributorStats): boolean {
  if (!contributor.banned_until) return false;
  return new Date(contributor.banned_until).getTime() > Date.now();
}

function getBanRemaining(contributor: ContributorStats): string {
  if (!contributor.banned_until) return '';
  const diff = new Date(contributor.banned_until).getTime() - Date.now();
  if (diff <= 0) return '';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

// ─── Stat Card ───

function StatCard({
  label, value, icon: Icon, color, subtitle, delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  delay: number;
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500 truncate">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{value}</p>
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

// ─── Status Badge ───

function StatusBadge({ accepted }: { accepted: boolean }) {
  return accepted ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 uppercase tracking-wider shrink-0">
      <CheckCircle2 className="w-3 h-3" />
      Accepted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/20 border border-rose-900/40 text-rose-400 uppercase tracking-wider shrink-0">
      <XCircle className="w-3 h-3" />
      Rejected
    </span>
  );
}

// ─── Main Component ───

export function VerificationDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyBanned, setShowOnlyBanned] = useState(false);
  const [showOnlyWithStreak, setShowOnlyWithStreak] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [expandedContributor, setExpandedContributor] = useState<string | null>(null);
  const [showContributors, setShowContributors] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/lipyd/verify/logs');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('You do not have permission to view verification data.');
        } else {
          setError(`Failed to load data (${response.status})`);
        }
        setLoading(false);
        return;
      }
      const json: ApiResponse = await response.json();
      setData(json);
    } catch {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter contributors
  const filteredContributors = data?.contributors.filter((c) => {
    const nameMatch =
      !searchQuery ||
      c.contributor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contributor_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const banMatch = showOnlyBanned ? isBanned(c) : true;
    const streakMatch = showOnlyWithStreak ? (c.invalid_streak ?? 0) > 0 : true;
    return nameMatch && banMatch && streakMatch;
  }) ?? [];

  // Filter logs
  const filteredLogs = data?.logs.filter((l) => {
    if (logFilter === 'accepted') return l.accepted;
    if (logFilter === 'rejected') return !l.accepted;
    return true;
  }) ?? [];

  // ─── Loading State ───
  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-stone-800 animate-pulse" />
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 absolute" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 animate-pulse">
            Loading verification data
          </p>
        </div>
      </div>
    );
  }

  // ─── Error State (no data) ───
  if (error && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-8 text-center max-w-md space-y-4"
        >
          <div className="p-3 bg-rose-950/20 rounded-xl inline-flex mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-200">Unable to load data</h3>
            <p className="text-xs text-stone-400 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px active:scale-95"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  const currentlyBanned = data?.contributors.filter((c) => isBanned(c)) ?? [];
  const streakContributors = data?.contributors.filter((c) => (c.invalid_streak ?? 0) > 0) ?? [];
  const lastRefreshed = data?.timestamp ? formatTimeAgo(data.timestamp) : '';

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
          <div className="p-2 bg-amber-950/30 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-100">Verification Monitor</h2>
            <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium">
              Model validation pipeline &amp; anti-abuse system
              {lastRefreshed && <span className="ml-1.5 opacity-60">· updated {lastRefreshed}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-800 bg-[#0F0F0F] hover:bg-stone-900/60 hover:border-stone-700 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-all disabled:opacity-50 active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </motion.div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Contributors"
          value={data?.contributors.length ?? 0}
          icon={Users}
          color="bg-blue-950/30 text-blue-500"
          delay={0.05}
        />
        <StatCard
          label="Currently Banned"
          value={currentlyBanned.length}
          icon={Ban}
          color="bg-red-950/30 text-red-500"
          subtitle={currentlyBanned.length > 0 ? `${data?.totalBanned ?? 0} total bans` : undefined}
          delay={0.1}
        />
        <StatCard
          label="With Invalid Streak"
          value={streakContributors.length}
          icon={AlertTriangle}
          color="bg-amber-950/30 text-amber-500"
          delay={0.15}
        />
        <StatCard
          label="Verifications"
          value={data?.logs.length ?? 0}
          icon={Activity}
          color="bg-emerald-950/30 text-emerald-500"
          subtitle={data ? `${data.logs.filter((l) => l.accepted).length} accepted` : undefined}
          delay={0.2}
        />
      </div>

      {/* ─── Contributors Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowContributors(!showContributors)}
            className="w-full flex items-center justify-between p-4 hover:bg-stone-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Contributors
              </h3>
              <span className="text-[10px] font-medium text-stone-500 tabular-nums">
                {filteredContributors.length} of {data?.contributors.length ?? 0}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${showContributors ? '' : '-rotate-90'}`}
            />
          </button>

          <AnimatePresence>
            {showContributors && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Filters */}
                <div className="px-4 pb-3 flex flex-wrap items-center gap-2 border-b border-stone-900">
                  <div className="relative flex-1 min-w-36">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-900/40 border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-stone-200 placeholder-stone-500"
                    />
                  </div>
                  <button
                    onClick={() => { setShowOnlyBanned(!showOnlyBanned); setShowOnlyWithStreak(false); }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                      showOnlyBanned
                        ? 'bg-red-950/20 border-red-900/40 text-red-400'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-300'
                    }`}
                  >
                    <Ban className="w-3 h-3 inline mr-1" />
                    Banned
                  </button>
                  <button
                    onClick={() => { setShowOnlyWithStreak(!showOnlyWithStreak); setShowOnlyBanned(false); }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                      showOnlyWithStreak
                        ? 'bg-amber-950/20 border-amber-900/40 text-amber-400'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-300'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Streaks
                  </button>
                </div>

                {/* Contributor List */}
                <div className="divide-y divide-stone-900/50 max-h-96 overflow-y-auto">
                  {filteredContributors.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-xs">
                      {searchQuery || showOnlyBanned || showOnlyWithStreak
                        ? 'No contributors match the current filters.'
                        : 'No contributors found.'}
                    </div>
                  ) : (
                    filteredContributors.map((contributor) => {
                      const banned = isBanned(contributor);
                      const hasStreak = (contributor.invalid_streak ?? 0) > 0;
                      const expanded = expandedContributor === contributor.contributor_id;
                      const trustLevel = contributor.trust_score ?? 0;

                      return (
                        <div key={contributor.contributor_id} className="group">
                          <button
                            onClick={() => setExpandedContributor(expanded ? null : contributor.contributor_id)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-900/20 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Status dot */}
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                banned
                                  ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                                  : hasStreak
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-stone-200 truncate group-hover:text-stone-100 transition-colors">
                                  {contributor.contributor_name || 'Anonymous'}
                                </p>
                                <p className="text-[10px] font-mono text-stone-500 truncate">
                                  {contributor.contributor_id}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Trust badge */}
                              <span className={`hidden sm:inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                trustLevel >= 80
                                  ? 'text-emerald-400 bg-emerald-950/20'
                                  : trustLevel >= 40
                                    ? 'text-amber-400 bg-amber-950/20'
                                    : 'text-stone-400 bg-stone-900/40'
                              }`}>
                                T:{trustLevel}
                              </span>
                              {/* Status badges */}
                              {banned && (
                                <span className="text-[10px] font-bold text-red-400 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/40 whitespace-nowrap">
                                  BANNED
                                </span>
                              )}
                              {hasStreak && !banned && (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/40">
                                  S:{contributor.invalid_streak}
                                </span>
                              )}
                              <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
                            </div>
                          </button>

                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-1 space-y-2 bg-stone-900/10">
                                  {/* Metrics grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="p-2.5 bg-stone-900/30 rounded-lg">
                                      <p className="text-[10px] text-stone-500 font-medium">Invalid Streak</p>
                                      <p className={`text-sm font-bold ${(contributor.invalid_streak ?? 0) > 0 ? 'text-amber-400' : 'text-stone-300'}`}>
                                        {contributor.invalid_streak ?? 0}
                                      </p>
                                    </div>
                                    <div className="p-2.5 bg-stone-900/30 rounded-lg">
                                      <p className="text-[10px] text-stone-500 font-medium">Trust Score</p>
                                      <p className="text-sm font-bold text-stone-300">{trustLevel}</p>
                                    </div>
                                    <div className="p-2.5 bg-stone-900/30 rounded-lg">
                                      <p className="text-[10px] text-stone-500 font-medium">Verified</p>
                                      <p className="text-sm font-bold text-emerald-400">{contributor.total_verified ?? 0}</p>
                                    </div>
                                    <div className="p-2.5 bg-stone-900/30 rounded-lg">
                                      <p className="text-[10px] text-stone-500 font-medium">Rejected</p>
                                      <p className="text-sm font-bold text-rose-400">{contributor.total_rejected ?? 0}</p>
                                    </div>
                                  </div>

                                  {/* Ban notice */}
                                  {banned && (
                                    <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg">
                                      <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1.5">
                                        <Ban className="w-3.5 h-3.5" />
                                        Banned until {new Date(contributor.banned_until!).toLocaleDateString('en-IN', {
                                          day: 'numeric', month: 'short', year: 'numeric',
                                          hour: '2-digit', minute: '2-digit',
                                        })}
                                        <span className="text-red-300 font-normal">({getBanRemaining(contributor)})</span>
                                      </p>
                                    </div>
                                  )}

                                  {/* Timestamps */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-stone-500 pt-1">
                                    {contributor.last_verified_at && (
                                      <p className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500/60" />
                                        Verified {formatTimeAgo(contributor.last_verified_at)}
                                      </p>
                                    )}
                                    {contributor.last_invalid_at && (
                                      <p className="flex items-center gap-1">
                                        <XCircle className="w-3 h-3 text-rose-500/60" />
                                        Invalid {formatTimeAgo(contributor.last_invalid_at)}
                                      </p>
                                    )}
                                    {contributor.last_seen_at && (
                                      <p className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-stone-500/60" />
                                        Seen {formatTimeAgo(contributor.last_seen_at)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ─── Verification Activity Log ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-900">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Verification Activity Log
              </h3>
              <span className="text-[10px] font-medium text-stone-500 tabular-nums">
                {filteredLogs.length} events
              </span>
            </div>
            <div className="flex items-center gap-1 bg-stone-900/40 rounded-lg p-0.5">
              {(['all', 'accepted', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                    logFilter === f
                      ? 'bg-stone-800 text-stone-200 shadow-sm'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'accepted' ? 'Accepted' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>

          {/* Log entries */}
          <div className="max-h-80 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Activity className="w-6 h-6 text-stone-800 mx-auto" />
                <p className="text-xs text-stone-500">
                  No verification events recorded yet.
                </p>
                <p className="text-[10px] text-stone-600">
                  Events appear here after the model processes submissions.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-900/30">
                {filteredLogs.map((log, idx) => (
                  <div
                    key={`${log.timestamp}-${log.contributorId}-${idx}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-stone-900/20 transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        log.accepted ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      {idx < filteredLogs.length - 1 && (
                        <div className="w-px flex-1 bg-stone-900/60 min-h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs flex-wrap min-w-0">
                          <span className="font-semibold text-stone-200 truncate max-w-28">
                            {log.contributorId}
                          </span>
                          <span className="text-stone-600 shrink-0">/</span>
                          <span className="font-mono text-base leading-none text-stone-300">{log.expectedCharacter}</span>
                          {log.predictedCharacter && log.predictedCharacter !== log.expectedCharacter && (
                            <>
                              <span className="text-stone-600 shrink-0">→</span>
                              <span className="font-mono text-base leading-none text-rose-400">{log.predictedCharacter}</span>
                            </>
                          )}
                        </div>
                        <StatusBadge accepted={log.accepted} />
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] text-stone-500 mt-1 flex-wrap">
                        {log.confidence != null && (
                          <span className={log.confidence >= 0.9 ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                            {(log.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                        <span>{log.processingTimeMs}ms</span>
                        <span className="opacity-60">{formatTimeAgo(log.timestamp)}</span>
                        {log.stage && log.stage !== 'complete' && (
                          <span className="text-stone-600 font-mono text-[9px]">stage: {log.stage}</span>
                        )}
                        {log.temporaryBanApplied && (
                          <span className="text-red-500/80 font-semibold">+ban</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
