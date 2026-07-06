'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createBrowserClient } from '@supabase/ssr';
import type { UserIdentity } from '@supabase/supabase-js';
import {
  Loader2, ShieldAlert, KeyRound, Link as LinkIcon,
  Check, X, Mail, Shield, Fingerprint,
  Eye, EyeOff, ChevronRight, CircleCheck, CircleAlert,
  Wand2, Lock, Unlink,
} from 'lucide-react';

// ─── Helpers ───

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very Strong', color: 'bg-emerald-400' };
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );
}

function getBrowserAndOS() {
  if (typeof window === 'undefined') return { browser: 'Server', os: 'Unknown' };
  const ua = navigator.userAgent;
  let browser = 'Other Browser';
  let os = 'Other OS';
  
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os };
}

// ─── Shared UI ───

function SettingsSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-3 animate-pulse">
      <div className="h-14 rounded-xl bg-stone-200/70 dark:bg-stone-800/60" />
      <div className="h-52 rounded-xl bg-stone-200/70 dark:bg-stone-800/60" />
    </div>
  );
}

function AlertBanner({
  type,
  message,
  onDismiss,
}: {
  type: 'error' | 'success';
  message: string;
  onDismiss: () => void;
}) {
  const isError = type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      className="overflow-hidden"
      role="alert"
    >
      <div className={`p-3.5 sm:p-4 rounded-xl text-[13px] flex items-start gap-2.5 border ${
        isError
          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400'
          : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400'
      }`}>
        {isError ? <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" /> : <CircleCheck className="w-4 h-4 shrink-0 mt-0.5" />}
        <span className="flex-1 leading-relaxed">{message}</span>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className={`shrink-0 p-1 rounded-lg transition-colors ${
            isError ? 'hover:bg-red-100 dark:hover:bg-red-900/30' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function SettingsCard({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: 'easeOut' }}
      className={`sm:bg-white sm:dark:bg-[#0F0F0F] sm:border sm:border-stone-200/80 sm:dark:border-stone-800/80 sm:rounded-xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}


function MethodStatusTile({
  label,
  active,
  icon,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold ${
      active
        ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-250 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
        : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-850 text-stone-505 dark:text-stone-500'
    }`}>
      <div className="shrink-0">{icon}</div>
      <span className="truncate flex-1 text-left">{label}</span>
      <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-0.5">
      {children}
    </h3>
  );
}

function SocialRow({
  name,
  icon,
  linked,
  email,
  loading,
  pendingUnlink,
  onConnect,
  onDisconnect,
  onCancelUnlink,
  onConfirmUnlink,
  canUnlink = true,
}: {
  name: string;
  icon: React.ReactNode;
  linked: boolean;
  email?: string;
  loading: boolean;
  pendingUnlink: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onCancelUnlink: () => void;
  onConfirmUnlink: () => void;
  canUnlink?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 sm:py-2.5 first:pt-0 last:pb-0">
      <div className="hidden sm:flex items-center gap-3 min-w-0">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-stone-900 dark:text-stone-100">{name}</span>
            {linked ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800/80 border border-stone-200/25 dark:border-stone-750 text-xs font-semibold text-stone-500 dark:text-stone-500 uppercase tracking-wide">
                Disconnected
              </span>
            )}
          </div>
          {linked && email && (
            <p className="text-sm text-stone-500 dark:text-stone-400 truncate mt-0.5">{email}</p>
          )}
        </div>
      </div>

      <div className="w-full sm:w-48 shrink-0 text-right">
        {pendingUnlink ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/45 rounded-lg p-2.5 text-left">
            <p className="text-xs text-red-700 dark:text-red-300 font-semibold leading-tight">
              Unlink this provider? You won&apos;t be able to sign in using {name} anymore.
            </p>
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={onConfirmUnlink}
                disabled={loading}
                className="flex-1 py-1 px-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Unlink
              </button>
              <button
                onClick={onCancelUnlink}
                className="px-2.5 py-1 border border-stone-250 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 rounded text-xs font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {linked ? (
              <button
                onClick={onDisconnect}
                disabled={loading || !canUnlink}
                title={!canUnlink ? "At least one social account is mandatory to prevent lockout." : undefined}
                className="w-full sm:w-48 h-9 sm:h-10 border border-red-200/50 hover:bg-red-50 dark:hover:bg-red-950/10 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {icon}
                <span className="hidden sm:inline">Disconnect</span>
                <span className="sm:hidden">Disconnect {name}</span>
              </button>
            ) : (
              <button
                onClick={onConnect}
                disabled={loading}
                className="w-full sm:w-48 h-9 sm:h-10 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {icon}
                <span className="hidden sm:inline">Connect</span>
                <span className="sm:hidden">Connect {name}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Password Change Modal ───

function PasswordChangeModal({
  open,
  onClose,
  userEmail,
  getSupabase,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  getSupabase: () => ReturnType<typeof createBrowserClient>;
  onSuccess: (msg: string) => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    if (open) {
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setModalError(null);
      setMagicLinkSent(false);
      setShowNew(false);
      setShowConfirm(false);
      setShowCurrent(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSendMagicLink = async () => {
    setLoading(true);
    setModalError(null);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) setModalError(error.message);
      else setMagicLinkSent(true);
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setModalError(null);
    if (newPassword.length < 8) { setModalError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setModalError('Passwords do not match.'); return; }
    if (!currentPassword) { setModalError('Enter your current password.'); return; }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (signInError) {
        try {
          const details = getBrowserAndOS();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('security_events').insert({
              user_id: user.id,
              event_type: 'Password Change',
              status: 'Failed: Current password incorrect',
              device_info: `${details.browser} on ${details.os}`,
              ip_address: '127.0.0.1 (Localhost)',
            });
          }
        } catch { /* noop */ }
        setModalError('Current password is incorrect.');
        setLoading(false);
        return;
      }

      const { error: ue } = await supabase.auth.updateUser({ password: newPassword });
      if (ue) {
        try {
          const details = getBrowserAndOS();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('security_events').insert({
              user_id: user.id,
              event_type: 'Password Change',
              status: 'Failed: ' + ue.message,
              device_info: `${details.browser} on ${details.os}`,
              ip_address: '127.0.0.1 (Localhost)',
            });
          }
        } catch { /* noop */ }
        setModalError(ue.message);
      } else {
        try {
          const details = getBrowserAndOS();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('security_events').insert({
              user_id: user.id,
              event_type: 'Password Change',
              status: 'Success',
              device_info: `${details.browser} on ${details.os}`,
              ip_address: '127.0.0.1 (Localhost)',
            });
          }
        } catch { /* noop */ }
        onSuccess('Password updated successfully.');
        onClose();
      }
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
          className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-700" />
          </div>

          <div className="flex items-center justify-between px-5 pt-3 sm:pt-5 pb-0 shrink-0">
            <h3 id="password-modal-title" className="text-base font-bold tracking-tight flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500" />
              Change Password
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 mt-2">
            <AnimatePresence>
              {modalError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden px-5 pt-3"
                >
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                    <CircleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-5 space-y-3.5 pb-6 sm:pb-5">
              {!magicLinkSent ? (
                <div className="space-y-4">
                  {/* Password Input Fields */}
                  <div className="space-y-3.5">
                    <div className="space-y-1.5 text-left">
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="New Password (minimum 8 characters)"
                          disabled={loading}
                          className="w-full px-4 py-3 sm:py-2.5 pr-10 text-sm rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(v => !v)}
                          tabIndex={-1}
                          aria-label={showNew ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newPassword.length > 0 && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex gap-1 h-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-300 ${
                                  i <= strength.score ? strength.color : 'bg-stone-200 dark:bg-stone-800'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-[11px] font-medium ${strength.score <= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-left">
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Confirm Password"
                          disabled={loading}
                          className={`w-full px-4 py-3 sm:py-2.5 pr-10 text-sm rounded-xl bg-stone-50 dark:bg-stone-900/50 border transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                            passwordsMismatch
                              ? 'border-red-300 dark:border-red-800'
                              : passwordsMatch
                                ? 'border-emerald-300 dark:border-emerald-800'
                                : 'border-stone-200 dark:border-stone-800'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(v => !v)}
                          tabIndex={-1}
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordsMatch && (
                        <p className="text-[11px] text-emerald-500 flex items-center gap-1 text-left">
                          <Check className="w-3 h-3" /> Passwords match
                        </p>
                      )}
                      {passwordsMismatch && (
                        <p className="text-[11px] text-red-500 flex items-center gap-1 text-left">
                          <X className="w-3 h-3" /> Passwords don&apos;t match
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 text-left">
                      <div className="relative">
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          placeholder="Current Password"
                          disabled={loading}
                          className="w-full px-4 py-3 sm:py-2.5 pr-10 text-sm rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(v => !v)}
                          tabIndex={-1}
                          aria-label={showCurrent ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"
                        >
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordSubmit}
                      disabled={loading || newPassword.length < 8 || !passwordsMatch || !currentPassword}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Update Password
                    </button>
                  </div>

                  {/* Divider with OR */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200 dark:border-stone-850" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-[#0F0F0F] px-3 text-[10px] font-bold uppercase tracking-wider text-stone-450 dark:text-stone-500">
                        OR
                      </span>
                    </div>
                  </div>

                  {/* Send Reset Link Action */}
                  <div className="text-center pt-1">
                    <button
                      onClick={handleSendMagicLink}
                      disabled={loading}
                      className="w-full py-2.5 border border-stone-250 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      Send me the password reset link
                    </button>
                  </div>
                </div>
              ) : (
                /* Success Screen when Magic Link is Sent */
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl animate-pulse">
                    <Mail className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Reset Link Sent!</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                      Check your inbox at <span className="font-semibold text-stone-800 dark:text-stone-200">{userEmail}</span> to set your new password directly.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-3 w-full sm:w-auto px-6 py-2 border border-stone-250 dark:border-stone-800 rounded-xl text-xs font-semibold hover:bg-stone-55 dark:hover:bg-stone-900 transition-colors shadow-sm"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Export ───

export function AuthSettings() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [lastSignInAt, setLastSignInAt] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pendingUnlinkProvider, setPendingUnlinkProvider] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const getSupabase = () => {
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase configuration is missing.');
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  };

  const fetchSecurityEvents = async (userId: string) => {
    try {
      const supabase = getSupabase();
      const { data, error: err } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!err && data) {
        setSecurityEvents(data);
      }
    } catch {
      // Gracefully ignore if database table is not created yet
    }
  };

  const logSecurityEvent = async (eventType: string, status: string, userId?: string) => {
    try {
      const supabase = getSupabase();
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) return;

      const details = getBrowserAndOS();
      const deviceInfo = `${details.browser} on ${details.os}`;

      await supabase.from('security_events').insert({
        user_id: targetUserId,
        event_type: eventType,
        status: status,
        device_info: deviceInfo,
        ip_address: '127.0.0.1 (Localhost)',
      });

      fetchSecurityEvents(targetUserId);
    } catch {
      // Gracefully ignore if database table is not created yet
    }
  };

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          setUserName(user.user_metadata?.full_name || user.user_metadata?.name || '');
          setUserAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture || '');
          setIdentities(user.identities || []);
          setLastSignInAt(user.last_sign_in_at || '');
          setCreatedAt(user.created_at || '');
          
          await fetchSecurityEvents(user.id);

          // Log active session if no active session log exists for last 12 hours
          try {
            const { data: recentEvents } = await supabase
              .from('security_events')
              .select('*')
              .eq('user_id', user.id)
              .eq('event_type', 'Active Login Session')
              .order('created_at', { ascending: false })
              .limit(1);

            const hoursSinceLastLog = recentEvents && recentEvents.length > 0
              ? (Date.now() - new Date(recentEvents[0].created_at).getTime()) / (1000 * 60 * 60)
              : 999;

            if (hoursSinceLastLog > 12) {
              await logSecurityEvent('Active Login Session', 'Success', user.id);
            }
          } catch {
            // Ignore if table is missing
          }

        } else {
          router.push('/admin/login');
        }
      } catch {
        /* noop */
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [router]);

  const handleLinkIdentity = async (provider: 'google' | 'github') => {
    setError(null);
    setSuccess(null);
    try {
      const supabase = getSupabase();
      const { error: e } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo: window.location.href },
      });
      if (e) setError(e.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to link account.');
    }
  };

  const handleUnlinkIdentity = async (identity: UserIdentity) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPendingUnlinkProvider(null);
    try {
      const supabase = getSupabase();
      const { error: e } = await supabase.auth.unlinkIdentity(identity);
      if (e) setError(e.message);
      else {
        setSuccess('Account unlinked successfully.');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIdentities(user.identities || []);
          logSecurityEvent('Provider Unlink (' + identity.provider + ')', 'Success', user.id);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to unlink account.');
    } finally {
      setLoading(false);
    }
  };

  const isProviderLinked = (p: string) => identities.some(i => i.provider === p);
  const getProviderIdentity = (p: string) => identities.find(i => i.provider === p);
  const getProviderEmail = (p: string) => identities.find(i => i.provider === p)?.identity_data?.email as string | null ?? null;
  const hasEmailPassword = identities.some(i => i.provider === 'email') || Boolean(userEmail);

  const activeMethodCount = useMemo(() => {
    let count = 0;
    if (hasEmailPassword) count++;
    if (identities.some(i => i.provider === 'google')) count++;
    if (identities.some(i => i.provider === 'github')) count++;
    return count;
  }, [hasEmailPassword, identities]);

  const handleAddPasskey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = getSupabase();
      if (!supabase.auth.passkey) throw new Error('Passkey API is not available in this SDK version.');
      const { error: e } = await (supabase.auth.passkey as any).register();
      if (e) setError(e.message);
      else setSuccess('Passkey registered successfully!');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Passkey registration failed or is unsupported.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <SettingsSkeleton />;

  return (
    <>
      <PasswordChangeModal
        open={pwModalOpen}
        onClose={() => setPwModalOpen(false)}
        userEmail={userEmail}
        getSupabase={getSupabase}
        onSuccess={(msg) => {
          setSuccess(msg);
          const supabase = getSupabase();
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) fetchSecurityEvents(user.id);
          });
        }}
      />

      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="popLayout">
          {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
          {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Column 1: Admin Passport */}
          <div className="lg:col-span-1 lg:h-full">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative overflow-hidden sm:rounded-2xl sm:border sm:border-stone-200/80 sm:dark:border-stone-800/80 sm:bg-white sm:dark:bg-[#0F0F0F] sm:shadow-sm sm:dark:shadow-none p-3 sm:p-5 space-y-3 sm:space-y-4 lg:h-full"
            >
              {/* Decorative Gradient Background */}
              <div className="hidden sm:block absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-blue-500/[0.08] via-indigo-500/[0.06] to-transparent dark:from-blue-500/[0.04] dark:via-indigo-500/[0.03] pointer-events-none" />

              {/* Profile details */}
              <div className="relative flex flex-col items-center text-center space-y-2 pt-1">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="Admin Avatar"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ring-2 sm:ring-4 ring-white dark:ring-stone-900 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md ring-2 sm:ring-4 ring-white dark:ring-stone-900">
                    {(userName || userEmail).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5 w-full max-w-full overflow-hidden">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center justify-center gap-1.5 shrink-0 flex-wrap break-all">
                    {userName || 'Administrator'}
                    <Shield className="w-4 h-4 text-emerald-550 dark:text-emerald-400 shrink-0" />
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 break-all">{userEmail}</p>
                </div>
              </div>


              {/* Security Checklist */}
              <div className="hidden sm:block space-y-2.5">
                <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">Security Checklist</span>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      hasEmailPassword 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 text-stone-400'
                    }`}>
                      {hasEmailPassword ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </span>
                    <span className={hasEmailPassword ? 'text-stone-700 dark:text-stone-300 font-medium' : 'text-stone-400 line-through decoration-stone-200/50'}>
                      Password Login Setup
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isProviderLinked('google') 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 text-stone-400'
                    }`}>
                      {isProviderLinked('google') ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </span>
                    <span className={isProviderLinked('google') ? 'text-stone-700 dark:text-stone-300 font-medium' : 'text-stone-400'}>
                      Google Account Linked
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isProviderLinked('github') 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 text-stone-400'
                    }`}>
                      {isProviderLinked('github') ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </span>
                    <span className={isProviderLinked('github') ? 'text-stone-700 dark:text-stone-300 font-medium' : 'text-stone-400'}>
                      GitHub Account Linked
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 text-stone-400">
                      <X className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-stone-400 font-medium">
                      Passkey Registered
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Column 2: Unified Settings Card */}
          <div className="lg:col-span-2 lg:h-full">
            <SettingsCard delay={0.1} className="lg:h-full">
              
              {/* Credentials management section */}
              <div className="px-0 py-3 sm:p-5 space-y-2 sm:space-y-3">
                <SectionLabel>Sign-in Credentials</SectionLabel>
                <div className="space-y-1">
                  {/* Password Login */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 sm:py-2.5 first:pt-0">
                    <div className="hidden sm:flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-stone-900 dark:text-stone-100">Password Login</h4>
                        <p className="hidden sm:block text-sm text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                          Manage your account password.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPwModalOpen(true)}
                      className="w-full sm:w-48 h-9 sm:h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center justify-center gap-1 shrink-0"
                    >
                      <KeyRound className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>

                  {/* Passkeys */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 sm:py-2.5 last:pb-0">
                    <div className="hidden sm:flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 shrink-0">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-stone-900 dark:text-stone-100">Passkeys Setup</h4>
                        <p className="hidden sm:block text-sm text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                          Biometric and hardware key access.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleAddPasskey}
                      disabled={loading}
                      className="w-full sm:w-48 h-9 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm shadow-indigo-600/20 shrink-0"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Fingerprint className="w-3.5 h-3.5" />}
                      Register Passkey
                    </button>
                  </div>
                </div>
              </div>

              {/* Linked social accounts section */}
              <div className="px-0 py-3 sm:p-5 space-y-2 sm:space-y-3">
                <SectionLabel>Linked Accounts</SectionLabel>

                {(() => {
                  const linkedSocialCount = (isProviderLinked('google') ? 1 : 0) + (isProviderLinked('github') ? 1 : 0);
                  return (
                    <div className="space-y-2 pt-1">
                      <SocialRow
                        name="Google"
                        icon={<GoogleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        linked={isProviderLinked('google')}
                        email={getProviderEmail('google')}
                        loading={loading}
                        pendingUnlink={pendingUnlinkProvider === 'google'}
                        onConnect={() => handleLinkIdentity('google')}
                        onDisconnect={() => setPendingUnlinkProvider('google')}
                        onCancelUnlink={() => setPendingUnlinkProvider(null)}
                        onConfirmUnlink={() => {
                          const identity = getProviderIdentity('google');
                          if (identity) handleUnlinkIdentity(identity);
                        }}
                        canUnlink={linkedSocialCount > 1}
                      />
                      <SocialRow
                        name="GitHub"
                        icon={<GitHubIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        linked={isProviderLinked('github')}
                        email={getProviderEmail('github')}
                        loading={loading}
                        pendingUnlink={pendingUnlinkProvider === 'github'}
                        onConnect={() => handleLinkIdentity('github')}
                        onDisconnect={() => setPendingUnlinkProvider('github')}
                        onCancelUnlink={() => setPendingUnlinkProvider(null)}
                        onConfirmUnlink={() => {
                          const identity = getProviderIdentity('github');
                          if (identity) handleUnlinkIdentity(identity);
                        }}
                        canUnlink={linkedSocialCount > 1}
                      />
                    </div>
                  );
                })()}
              </div>

            </SettingsCard>
          </div>
        </div>

        {/* Security & Login Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: 'easeOut' }}
          className="sm:rounded-2xl sm:border sm:border-stone-200/80 sm:dark:border-stone-800/80 sm:bg-white sm:dark:bg-[#0F0F0F] sm:shadow-sm sm:dark:shadow-none px-0 py-5 sm:p-6 space-y-4"
        >
          <div>
            <SectionLabel>Security & Login Activity</SectionLabel>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-850 text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  <th className="pb-3 pr-4">Event Type</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Device & OS</th>
                  <th className="pb-3 px-4">IP Address</th>
                  <th className="pb-3 pl-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100/60 dark:divide-stone-850/60">
                {securityEvents.length > 0 ? (
                  securityEvents.map((event) => {
                    const isSuccess = event.status.toLowerCase() === 'success';
                    const isFailed = event.status.toLowerCase().startsWith('failed');
                    const isCurrentSession = event.event_type === 'Active Login Session' && (Date.now() - new Date(event.created_at).getTime()) < 10 * 60 * 1000;
                    
                    let badgeBg = 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-750 text-stone-600 dark:text-stone-400';
                    if (isCurrentSession) {
                      badgeBg = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400';
                    } else if (isSuccess) {
                      badgeBg = 'bg-blue-50 dark:bg-blue-950/20 border-blue-250 dark:border-blue-900/40 text-blue-700 dark:text-blue-400';
                    } else if (isFailed) {
                      badgeBg = 'bg-red-50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/45 text-red-700 dark:text-red-400';
                    }

                    return (
                      <tr key={event.id} className="text-stone-900 dark:text-stone-100">
                        <td className="py-3.5 pr-4 flex items-center gap-2">
                          {event.event_type === 'Active Login Session' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          )}
                          <span className="font-semibold text-stone-900 dark:text-stone-100">{event.event_type}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${badgeBg}`}>
                            {isCurrentSession ? 'Current Session' : event.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300 font-medium">
                          {event.device_info || 'Unknown Device'}
                        </td>
                        <td className="py-3.5 px-4 text-stone-550 dark:text-stone-400 font-mono text-xs">
                          {event.ip_address || 'Unknown IP'}
                        </td>
                        <td className="py-3.5 pl-4 text-stone-500 dark:text-stone-500">
                          {new Date(event.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="text-stone-550 dark:text-stone-450">
                    <td colSpan={5} className="py-8 text-center text-stone-500 dark:text-stone-400 font-medium">
                      No security events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </>
  );
}
