'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2,
  Clock, UserCheck, TrendingUp, Loader2,
  ChevronDown, Search, RefreshCw, Activity,
  Users, Fingerprint, Percent, Target,
} from 'lucide-react';

// ─── Types ───

interface VerificationLogEntry {
  timestamp: string;
  contributorId: string;
  expectedCharacter: string;
  predictedCharacter: string | null;
  confidence: number | null;
  accepted: boolean;
  processingTimeMs: number;
  stage?: string;
  reason?: string;
}

interface ContributorStats {
  contributor_id: string;
  contributor_name: string;
  total_verified: number;
  last_verified_at: string | null;
  last_seen_at: string | null;
}

interface ApiResponse {
  logs: VerificationLogEntry[];
  contributors: ContributorStats[];
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

function confidenceColor(confidence: number | null): string {
  if (confidence == null) return 'text-stone-500';
  if (confidence >= 0.95) return 'text-emerald-400';
  if (confidence >= 0.85) return 'text-amber-400';
  return 'text-rose-400';
}

function confidenceBg(confidence: number | null): string {
  if (confidence == null) return 'bg-stone-900/40';
  if (confidence >= 0.95) return 'bg-emerald-950/20';
  if (confidence >= 0.85) return 'bg-amber-950/20';
  return 'bg-rose-950/20';
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
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] text-stone-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-stone-500" />
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Confidence Badge ───

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence == null) {
    return <span className="text-[10px] text-stone-600">—</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none ${confidenceColor(confidence)} ${confidenceBg(confidence)}`}>
      {(confidence * 100).toFixed(0)}%
    </span>
  );
}

// ─── Segmented Control ───

function SegmentedControl({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-stone-800 bg-stone-900/40 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
            value === opt.value
              ? 'bg-stone-700 text-stone-100 shadow-sm'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Status Badge ───

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 uppercase tracking-wider shrink-0">
      <CheckCircle2 className="w-3 h-3" />
      Processed
    </span>
  );
}

// ─── Progress Bar Mini ───

function MiniProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

// ─── Main Component ───

export function VerificationDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'verified' | 'unverified'
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

  // Derived stats
  const totalLogs = data?.logs.length ?? 0;
  const verifiedLogs = data?.logs.filter((l) => l.accepted).length ?? 0;
  const unverifiedLogs = totalLogs - verifiedLogs;
  const avgConfidence = data?.logs.filter((l) => l.confidence != null).length
    ? data.logs
        .filter((l) => l.confidence != null)
        .reduce((sum, l) => sum + (l.confidence ?? 0), 0) / data.logs.filter((l) => l.confidence != null).length
    : null;
  const uniqueCharacters = new Set(data?.logs.map((l) => l.expectedCharacter) ?? []).size;

  // Filter contributors
  const filteredContributors = data?.contributors.filter((c) => {
    return (
      !searchQuery ||
      c.contributor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contributor_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) ?? [];

  // Filter logs
  const filteredLogs = data?.logs.filter((l) => {
    if (logFilter === 'verified') return l.accepted;
    if (logFilter === 'unverified') return !l.accepted;
    return true;
  }) ?? [];

  // ─── Sub-component: Stat Pill ───
  function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${color}`}>
        <span className="opacity-70 font-semibold">{label}:</span>
        <span>{value}</span>
      </span>
    );
  }

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

  const lastRefreshed = data?.timestamp ? formatTimeAgo(data.timestamp) : '';

  return (
    <div className="p-3 sm:p-5 space-y-3 sm:space-y-5 overflow-y-auto flex-1">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-1"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-950/30 rounded-xl shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-stone-100 truncate">Verification Monitor</h2>
            <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium truncate">
              Model validation pipeline
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          label="Total Contributors"
          value={data?.contributors.length ?? 0}
          icon={Users}
          color="bg-blue-950/30 text-blue-500"
          delay={0.05}
        />
        <StatCard
          label="Verifications"
          value={totalLogs}
          icon={Activity}
          color="bg-emerald-950/30 text-emerald-500"
          subtitle={`${verifiedLogs} verified`}
          delay={0.1}
        />
        <StatCard
          label="Avg Confidence"
          value={avgConfidence != null ? `${(avgConfidence * 100).toFixed(1)}%` : '—'}
          icon={Percent}
          color="bg-violet-950/30 text-violet-500"
          subtitle={`${unverifiedLogs} unverified`}
          delay={0.15}
          compact
        />
        <StatCard
          label="Character Classes"
          value={uniqueCharacters}
          icon={Target}
          color="bg-cyan-950/30 text-cyan-500"
          delay={0.2}
          compact
        />
      </div>

      {/* ─── Summary Bar ─── */}
      {totalLogs > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.3 }}
          className="bg-[#0F0F0F] border border-stone-900 rounded-xl p-3 sm:p-4 space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] font-medium text-stone-500">
            <span>Verified vs Unverified</span>
            <span className="tabular-nums">{verifiedLogs} / {unverifiedLogs}</span>
          </div>
          <MiniProgressBar value={verifiedLogs} max={totalLogs} color="bg-emerald-500" />
        </motion.div>
      )}

      {/* ─── Contributors Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        <div className="bg-[#0F0F0F] border border-stone-900 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowContributors(!showContributors)}
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-stone-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-400">
                Contributors
              </h3>
              <span className="text-[9px] sm:text-[10px] font-medium text-stone-500 tabular-nums">
                {filteredContributors.length} of {data?.contributors.length ?? 0}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-stone-500 transition-transform duration-200 shrink-0 ${showContributors ? '' : '-rotate-90'}`}
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
                {/* Search */}
                <div className="px-3 sm:px-4 pb-3 flex flex-wrap items-center gap-2 border-b border-stone-900">
                  <div className="relative flex-1 min-w-36">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-900/40 border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-stone-200 placeholder-stone-500"
                    />
                  </div>
                </div>

                {/* Contributor List */}
                <div className="divide-y divide-stone-900/50 max-h-96 overflow-y-auto">
                  {filteredContributors.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-xs">
                      {searchQuery
                        ? 'No contributors match the current filters.'
                        : 'No contributors found.'}
                    </div>
                  ) : (
                    filteredContributors.map((contributor, index) => (
                      <div key={contributor.contributor_id} className="group px-3 sm:px-4 py-2.5 hover:bg-stone-900/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank */}
                          <span className="text-[10px] font-bold text-stone-600 shrink-0 w-5 text-right tabular-nums">
                            {index + 1}
                          </span>

                          {/* Status dot */}
                          <div className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />

                          {/* Name + ID */}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-stone-200 truncate max-w-28 sm:max-w-48 group-hover:text-stone-100 transition-colors block">
                              {contributor.contributor_name || 'Anonymous'}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] sm:text-[10px] font-mono text-stone-500 truncate max-w-24 sm:max-w-44" title={contributor.contributor_id}>
                                <Fingerprint className="w-2.5 h-2.5 inline mr-0.5 opacity-60" />
                                {contributor.contributor_id}
                              </span>
                              {contributor.last_seen_at && (
                                <span className="text-[8px] sm:text-[9px] text-stone-600 whitespace-nowrap">
                                  <Clock className="w-2 h-2 inline mr-0.5 opacity-50" />
                                  {formatTimeAgo(contributor.last_seen_at)}
                                </span>
                              )}
                              {contributor.last_verified_at && (
                                <span className="text-[8px] sm:text-[9px] text-emerald-700 whitespace-nowrap">
                                  <CheckCircle2 className="w-2 h-2 inline mr-0.5" />
                                  Verified {formatTimeAgo(contributor.last_verified_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Verified count */}
                          <StatPill
                            label="V"
                            value={contributor.total_verified ?? 0}
                            color="text-emerald-400 bg-emerald-950/20"
                          />
                        </div>
                      </div>
                    ))
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
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-stone-900">
            <div className="flex items-center gap-2 min-w-0">
              <Activity className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-400 truncate">
                Activity Log
              </h3>
              <span className="text-[9px] sm:text-[10px] font-medium text-stone-500 tabular-nums shrink-0">
                {filteredLogs.length} events
              </span>
            </div>
            <SegmentedControl
              options={[
                { value: 'all', label: 'All' },
                { value: 'verified', label: 'Verified' },
                { value: 'unverified', label: 'Unverified' },
              ]}
              value={logFilter}
              onChange={(v) => setLogFilter(v)}
            />
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
                    className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-stone-900/20 transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${log.accepted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {idx < filteredLogs.length - 1 && (
                        <div className="w-px flex-1 bg-stone-900/60 min-h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-2 sm:pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs flex-wrap min-w-0">
                          <span className="font-semibold text-stone-200 truncate max-w-20 sm:max-w-28">
                            {log.contributorId}
                          </span>
                          <span className="text-stone-600 shrink-0">/</span>
                          <span className="font-mono text-sm sm:text-base leading-none text-stone-300">{log.expectedCharacter}</span>
                          {log.predictedCharacter && log.predictedCharacter !== log.expectedCharacter && (
                            <>
                              <span className="text-stone-600 shrink-0">→</span>
                              <span className="font-mono text-sm sm:text-base leading-none text-rose-400">{log.predictedCharacter}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {log.confidence != null && <ConfidenceBadge confidence={log.confidence} />}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2.5 text-[9px] sm:text-[10px] text-stone-500 mt-1 flex-wrap">
                        <span>{log.processingTimeMs}ms</span>
                        <span className="opacity-60">{formatTimeAgo(log.timestamp)}</span>
                        {log.stage && log.stage !== 'complete' && (
                          <span className="text-stone-600 font-mono text-[8px] sm:text-[9px]">stage: {log.stage}</span>
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
