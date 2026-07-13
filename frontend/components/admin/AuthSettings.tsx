'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import type { UserIdentity } from '@supabase/supabase-js';
import {
  Loader2, ShieldAlert, KeyRound, Link as LinkIcon,
  Check, X, Mail, Shield, Fingerprint,
  Eye, EyeOff, ChevronDown, CircleCheck, CircleAlert,
  Wand2, Lock, Unlink, MonitorSmartphone, Globe, MapPin, LogOut,
} from 'lucide-react';
import { logSecurityEvent, logActiveSessionIfStale, revokeOtherSessions } from '@/app/admin/security-actions';

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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

async function getSessionInfo(supabase: ReturnType<typeof createClient>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  const payload = decodeJwtPayload(session.access_token);
  if (!payload) return null;
  return {
    userId: (payload.sub as string) || null,
    sessionId: (payload.session_id as string) || null,
  };
}

function getBrowserAndOS() {
  if (typeof window === 'undefined') return { browser: 'Server', os: 'Unknown' };
  const ua = navigator.userAgent;
  let browser = 'Other Browser';
  let os = 'Other OS';
  
  if (ua.includes('Firefox/') && !ua.includes('Seamonkey')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  if (ua.includes('Windows NT 10')) os = 'Windows 11';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

// ─── Shared UI ───

function SettingsSkeleton() {
  return (
    <div className="p-3 sm:p-6 max-w-2xl mx-auto space-y-2.5 sm:space-y-3 animate-pulse">
      <div className="h-14 rounded-xl bg-stone-800/60" />
      <div className="h-52 rounded-xl bg-stone-800/60" />
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
      <div className={`p-3 sm:p-4 rounded-xl text-[13px] flex items-start gap-2 border ${
        isError
          ? 'bg-red-950/20 border-red-900/40 text-red-400'
          : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
      }`}>
        {isError ? <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" /> : <CircleCheck className="w-4 h-4 shrink-0 mt-0.5" />}
        <span className="flex-1 leading-relaxed">{message}</span>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className={`shrink-0 p-1 rounded-lg transition-colors ${
            isError ? 'hover:bg-red-900/30' : 'hover:bg-emerald-900/30'
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
      className={`sm:bg-[#0F0F0F] sm:border sm:border-stone-800/80 sm:rounded-xl overflow-hidden ${className}`}
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
    <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold ${
      active
        ? 'bg-emerald-950/15 border-emerald-900/40 text-emerald-400'
        : 'bg-stone-900/30 border-stone-850 text-stone-500'
    }`}>
      <div className="shrink-0">{icon}</div>
      <span className="truncate flex-1 text-left">{label}</span>
      <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-emerald-500' : 'bg-stone-600'}`} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-stone-500 px-0.5">
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
  email?: string | null;
  loading: boolean;
  pendingUnlink: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onCancelUnlink: () => void;
  onConfirmUnlink: () => void;
  canUnlink?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1.5 sm:py-2.5 first:pt-0 last:pb-0">
      <div className="hidden sm:flex items-center gap-3 min-w-0">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-stone-100">{name}</span>
            {linked ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-stone-800/80 border border-stone-750 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Disconnected
              </span>
            )}
          </div>
          {linked && email && (
            <p className="text-sm text-stone-400 truncate mt-0.5">{email}</p>
          )}
        </div>
      </div>

      <div className="w-full sm:w-48 shrink-0 text-right">
        {pendingUnlink ? (
          <div className="bg-red-950/20 border border-red-900/45 rounded-lg p-2.5 text-left">
            <p className="text-xs text-red-300 font-semibold leading-tight">
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
                className="px-2.5 py-1 border border-stone-850 hover:bg-stone-900 rounded text-xs font-semibold transition-all"
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
                className="w-full sm:w-48 h-9 sm:h-10 border border-red-900/50 hover:bg-red-950/15 text-red-400 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 ease-out active:scale-97 hover:-translate-y-px shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                {icon}
                <span className="hidden sm:inline">Disconnect</span>
                <span className="sm:hidden">Disconnect {name}</span>
              </button>
            ) : (
              <button
                onClick={onConnect}
                disabled={loading}
                className="w-full sm:w-48 h-9 sm:h-10 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 ease-out active:scale-97 hover:-translate-y-px shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
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
  getSupabase: () => ReturnType<typeof createClient>;
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
  const [passwordUpdated, setPasswordUpdated] = useState(false);

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
      setPasswordUpdated(false);
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
        // Auto-revoke all other sessions after password change
        try {
          const sessionInfo = await getSessionInfo(supabase);
          if (sessionInfo?.userId && sessionInfo?.sessionId) {
            await revokeOtherSessions(sessionInfo.userId, sessionInfo.sessionId);
          }
        } catch { /* non-critical */ }
        onSuccess('Password updated successfully. All other sessions have been logged out.');
        setPasswordUpdated(true);
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
          className="bg-[#0F0F0F] border border-stone-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-stone-700" />
          </div>

          <div className="flex items-center justify-between px-5 pt-3 sm:pt-5 pb-0 shrink-0">
            <h3 id="password-modal-title" className="text-base font-bold tracking-tight flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500" />
              Change Password
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-xl hover:bg-stone-900 transition-colors"
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
                  <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-400 flex items-start gap-2">
                    <CircleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-5 space-y-3.5 pb-6 sm:pb-5">
              {!magicLinkSent && !passwordUpdated ? (
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
                          className="w-full px-4 py-3 sm:py-2.5 pr-10 text-sm rounded-xl bg-stone-900/50 border border-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(v => !v)}
                          tabIndex={-1}
                          aria-label={showNew ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300 transition-colors p-1"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newPassword.length > 0 && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex gap-1 h-1">
                            {[1, 2, 3, 4, 5].map(index => (
                              <div
                                key={index}
                                className={`flex-1 rounded-full transition-all duration-300 ${
                                  index <= strength.score
                                    ? strength.score <= 2
                                      ? 'bg-red-500'
                                      : strength.score <= 4
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    : 'bg-stone-800'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-stone-400 text-left">
                            Password strength: <span className="font-bold">{strength.label}</span>
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
                          placeholder="Confirm New Password"
                          disabled={loading}
                          className={`w-full px-4 py-3 sm:py-2.5 pr-10 text-sm rounded-xl bg-stone-900/50 border transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                            passwordsMismatch
                              ? 'border-red-800'
                              : passwordsMatch
                                ? 'border-emerald-800'
                                : 'border-stone-800'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(v => !v)}
                          tabIndex={-1}
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300 transition-colors p-1"
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
                          className="w-full px-4 py-3 sm:py-2.5 pr-10 text-sm rounded-xl bg-stone-900/50 border border-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(v => !v)}
                          tabIndex={-1}
                          aria-label={showCurrent ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300 transition-colors p-1"
                        >
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordSubmit}
                      disabled={loading || newPassword.length < 8 || !passwordsMatch || !currentPassword}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.98] hover:-translate-y-px disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-md hover:shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Update Password
                    </button>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-850" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[#0F0F0F] px-3 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        OR
                      </span>
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      onClick={handleSendMagicLink}
                      disabled={loading}
                      className="w-full py-2.5 border border-stone-800 hover:bg-stone-900 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      Send me the password reset link
                    </button>
                  </div>
                </div>
              ) : magicLinkSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="p-3 bg-emerald-950/30 rounded-xl animate-pulse">
                    <Mail className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-stone-100">Reset Link Sent!</p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                      Check your inbox at <span className="font-semibold text-stone-200">{userEmail}</span> to set your new password directly.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-3 w-full sm:w-auto px-6 py-2 border border-stone-800 rounded-xl text-xs font-semibold hover:bg-stone-900 transition-colors shadow-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="p-3 bg-emerald-950/30 rounded-xl">
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-stone-100">Password Changed!</p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                      Your password has been updated successfully. You can now use your new password.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-3 w-full sm:w-auto px-6 py-2 border border-stone-800 rounded-xl text-xs font-semibold hover:bg-stone-900 transition-colors shadow-sm"
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pendingUnlinkProvider, setPendingUnlinkProvider] = useState<string | null>(null);
  const [passkeyCount, setPasskeyCount] = useState(0);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [ipFilter, setIpFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'browser' | 'os' | 'created_at' | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const updateLayout = useCallback(() => {
    if (typeof window === 'undefined') return;
    setIsDesktop(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  useEffect(() => {
    if (!initialLoading) {
      const timer = setTimeout(updateLayout, 50);
      return () => clearTimeout(timer);
    }
  }, [initialLoading, updateLayout]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const getSupabase = () => {
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase configuration is missing.');
    return createClient();
  };

  const fetchSecurityEvents = async (userId: string, email?: string) => {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);

      if (email) {
        query = query.or(`user_id.eq.${userId},and(event_type.eq.login_failed,metadata->>'email'.eq.${email})`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error: err } = await query;
      if (!err && data) {
        setSecurityEvents(data);
      }
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
          
          await fetchSecurityEvents(user.id, user.email || undefined);

          // Fetch registered passkeys
          try {
            const { data: passkeys } = await supabase.auth.passkey.list();
            setPasskeyCount(Array.isArray(passkeys) ? passkeys.length : 0);
          } catch {
            setPasskeyCount(0);
          }

          // Log active session if no active session log exists for last 12 hours (atomic check+insert)
          try {
            const didInsert = await logActiveSessionIfStale(user.id);
            if (didInsert) fetchSecurityEvents(user.id, user.email || undefined);
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
      else logSecurityEvent('provider_link', { metadata: { provider } });
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
          await logSecurityEvent('provider_unlink', { metadata: { provider: identity.provider } });
          fetchSecurityEvents(user.id, user.email || undefined);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to unlink account.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokeLoading(true);
    setRevokeConfirmOpen(false);
    setError(null);
    setSuccess(null);
    try {
      const supabase = getSupabase();
      const sessionInfo = await getSessionInfo(supabase);
      if (!sessionInfo?.userId || !sessionInfo?.sessionId) {
        setError('Could not identify current session.');
        return;
      }
      const result = await revokeOtherSessions(sessionInfo.userId, sessionInfo.sessionId, {
        browser: navigator.userAgent,
        os: navigator.platform || navigator.userAgent,
      });
      if (result.success) {
        setSuccess(`Logged out from ${result.revokedCount} other session${result.revokedCount === 1 ? '' : 's'}.`);
        fetchSecurityEvents(sessionInfo.userId, userEmail || undefined);
      } else {
        setError(result.error || 'Failed to log out other sessions.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to log out other sessions.');
    } finally {
      setRevokeLoading(false);
    }
  };

  const toggleDropdown = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeDropdown === name) {
      setActiveDropdown(null);
      setDropdownPos(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
      setActiveDropdown(name);
    }
  };

  const toggleSort = (field: 'browser' | 'os' | 'created_at') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  useEffect(() => {
    if (!activeDropdown) return;
    const handler = () => {
      setActiveDropdown(null);
      setDropdownPos(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [activeDropdown]);

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
      const { error: e } = await supabase.auth.registerPasskey();
      if (e) {
        setError(e.message || 'Passkey registration failed.');
      } else {
        setSuccess('Passkey registered successfully!');
        try {
          const { data: passkeys } = await supabase.auth.passkey.list();
          setPasskeyCount(Array.isArray(passkeys) ? passkeys.length : 0);
        } catch {
          setPasskeyCount((c) => c + 1);
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e.name === 'NotAllowedError') {
          setError('Passkey registration was cancelled.');
        } else if (e.message.includes('does not support WebAuthn')) {
          setError('Your browser does not support passkeys.');
        } else {
          setError(e.message || 'Passkey registration failed.');
        }
      } else {
        setError('Passkey registration failed or is unsupported.');
      }
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
          supabase.auth.getUser().then((res: any) => {
            const user = res.data?.user;
            if (user) fetchSecurityEvents(user.id, user.email || undefined);
          });
        }}
      />

              <div ref={containerRef} className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full flex flex-col flex-1 sm:h-full overflow-x-hidden overflow-y-visible sm:overflow-hidden">
        <AnimatePresence mode="popLayout">
          {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
          {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}
        </AnimatePresence>

        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch shrink-0">
          
          {/* Column 1: Admin Passport */}
          <div className="lg:col-span-1 lg:h-full">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative overflow-hidden sm:rounded-2xl sm:border sm:border-stone-800/80 sm:bg-[#0F0F0F] sm:shadow-sm shadow-none p-3 sm:p-5 space-y-2.5 sm:space-y-4 lg:h-full"
            >
              {/* Decorative Gradient Background */}
              <div className="hidden sm:block absolute inset-x-0 top-0 h-28 bg-linear-to-br from-blue-500/4 via-indigo-500/3 to-transparent pointer-events-none" />

              {/* Profile details */}
              <div className="relative flex flex-col items-center text-center space-y-1.5 pt-1">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="Admin Avatar"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ring-2 sm:ring-4 ring-stone-900 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md ring-2 sm:ring-4 ring-stone-900">
                    {(userName || userEmail).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5 w-full max-w-full overflow-hidden">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-stone-100 flex items-center justify-center gap-1.5 shrink-0 flex-wrap break-all">
                    {userName || 'Administrator'}
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400 break-all">{userEmail}</p>
                </div>
              </div>


              {/* Security Checklist */}
              <div className="hidden sm:block space-y-2.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Security Checklist</span>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      hasEmailPassword 
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                        : 'bg-stone-900/30 border-stone-800 text-stone-400'
                    }`}>
                      {hasEmailPassword ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </span>
                    <span className={hasEmailPassword ? 'text-stone-300 font-medium' : 'text-stone-400 line-through decoration-stone-800/50'}>
                      Password Login Setup
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isProviderLinked('google') 
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                        : 'bg-stone-900/30 border-stone-800 text-stone-400'
                    }`}>
                      {isProviderLinked('google') ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </span>
                    <span className={isProviderLinked('google') ? 'text-stone-300 font-medium' : 'text-stone-400'}>
                      Google Account Linked
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isProviderLinked('github') 
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                        : 'bg-stone-900/30 border-stone-800 text-stone-400'
                    }`}>
                      {isProviderLinked('github') ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </span>
                    <span className={isProviderLinked('github') ? 'text-stone-300 font-medium' : 'text-stone-400'}>
                      GitHub Account Linked
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      passkeyCount > 0
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                        : 'bg-stone-900/30 border-stone-800 text-stone-400'
                    }`}>
                      {passkeyCount > 0 ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </span>
                    <span className={passkeyCount > 0 ? 'text-stone-300 font-medium' : 'text-stone-400 font-medium'}>
                      Passkey{passkeyCount > 1 ? 's' : ''} Registered{passkeyCount > 0 ? ` (${passkeyCount})` : ''}
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
              <div className="px-0 py-2.5 sm:p-5 space-y-1.5 sm:space-y-3">
                <SectionLabel>Sign-in Credentials</SectionLabel>
                <div className="space-y-0.5 sm:space-y-1">
                  {/* Password Login */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1.5 sm:py-2.5 first:pt-0">
                    <div className="hidden sm:flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-blue-950/30 text-blue-500 shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-stone-100">Password Login</h4>
                        <p className="hidden sm:block text-sm text-stone-400 mt-0.5 leading-relaxed">
                          Manage your account password.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPwModalOpen(true)}
                      className="w-full sm:w-48 h-9 sm:h-10 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 ease-out active:scale-97 hover:-translate-y-px shadow-md hover:shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <KeyRound className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>

                  {/* Passkeys */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 sm:py-2.5 last:pb-0">
                    <div className="hidden sm:flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-indigo-950/30 text-indigo-500 shrink-0">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-stone-100">Passkeys Setup</h4>
                        <p className="hidden sm:block text-sm text-stone-400 mt-0.5 leading-relaxed">
                          Biometric and hardware key access.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleAddPasskey}
                      disabled={loading}
                      className="w-full sm:w-48 h-9 sm:h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 ease-out active:scale-97 hover:-translate-y-px shadow-md hover:shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Fingerprint className="w-3.5 h-3.5" />}
                      Register Passkey
                    </button>
                  </div>
                </div>
              </div>

              {/* Linked social accounts section */}
              <div className="px-0 py-2.5 sm:p-5 space-y-1.5 sm:space-y-3">
                <SectionLabel>Linked Accounts</SectionLabel>

                {(() => {
                  const linkedSocialCount = (isProviderLinked('google') ? 1 : 0) + (isProviderLinked('github') ? 1 : 0);
                  return (
                    <div className="space-y-1.5 pt-1">
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
        {(() => {
          const formatEventType = (type: string) => {
            const labels: Record<string, string> = {
              login: 'Login',
              logout: 'Logout',
              auto_logout: 'Auto-Logged Out',
              login_failed: 'Failed Login',
              oauth_login: 'OAuth Login',
              passkey_login: 'Passkey Login',
              passkey_register: 'Passkey Register',
              password_change: 'Password Changed',
              password_reset: 'Password Reset',
              provider_link: 'Provider Linked',
              provider_unlink: 'Provider Unlinked',
              active_session: 'Active Session',
              sessions_revoked: 'Signed Out Other Devices',
            };
            return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          };

          const getAuthMethodIcon = (event: { event_type: string; metadata?: Record<string, unknown> }) => {
            const method = event.metadata?.method as string | undefined;
            const provider = event.metadata?.provider as string | undefined;

            if (event.event_type === 'oauth_login' || event.event_type === 'provider_link' || event.event_type === 'provider_unlink') {
              if (provider === 'google') return <GoogleIcon className="w-3.5 h-3.5 shrink-0" />;
              if (provider === 'github') return <GitHubIcon className="w-3.5 h-3.5 shrink-0" />;
            }

            if (method === 'passkey' || event.event_type === 'passkey_login' || event.event_type === 'passkey_register') {
              return <Fingerprint className="w-3.5 h-3.5 shrink-0 text-violet-400" />;
            }

            if (event.event_type === 'active_session') {
              return <Shield className="w-3.5 h-3.5 shrink-0 text-emerald-400" />;
            }

            if (event.event_type === 'logout') {
              return <LogOut className="w-3.5 h-3.5 shrink-0 text-stone-400" />;
            }

            if (event.event_type === 'auto_logout') {
              return <LogOut className="w-3.5 h-3.5 shrink-0 text-amber-400" />;
            }

            if (event.event_type === 'password_change' || event.event_type === 'password_reset') {
              return <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />;
            }

            if (event.event_type === 'sessions_revoked') {
              return <LogOut className="w-3.5 h-3.5 shrink-0 text-red-400" />;
            }

            // email/password login (default)
            return <KeyRound className="w-3.5 h-3.5 shrink-0 text-blue-400" />;
          };

          const uniqueEvents = [...new Set(securityEvents.map(e => e.event_type))].sort();
          const uniqueStatuses = [...new Set(securityEvents.map(e => e.status).filter(Boolean))].sort();
          const uniqueIps = [...new Set(securityEvents.map(e => e.ip_address).filter(Boolean))].sort();

          let filteredEvents = securityEvents;
          if (eventFilter) filteredEvents = filteredEvents.filter(e => e.event_type === eventFilter);
          if (statusFilter) filteredEvents = filteredEvents.filter(e => e.status === statusFilter);
          if (ipFilter) filteredEvents = filteredEvents.filter(e => e.ip_address === ipFilter);

          if (sortField) {
            filteredEvents = [...filteredEvents].sort((a, b) => {
              const aVal = ((a as Record<string, unknown>)[sortField] || '') as string;
              const bVal = ((b as Record<string, unknown>)[sortField] || '') as string;
              const cmp = String(aVal).localeCompare(String(bVal));
              return sortAsc ? cmp : -cmp;
            });
          }

          const hasActiveFilter = eventFilter || statusFilter || ipFilter;

          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35, ease: 'easeOut' }}
              className="sm:rounded-2xl sm:border sm:border-stone-800/80 sm:bg-[#0F0F0F] sm:shadow-sm shadow-none px-0 py-4 sm:p-6 space-y-3 sm:space-y-4 flex flex-col flex-1 min-h-0 overflow-hidden w-full"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <SectionLabel>Security & Login Activity</SectionLabel>
                  <span className="text-[10px] font-medium text-stone-500 tabular-nums shrink-0">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                  </span>
                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={() => { setEventFilter(null); setStatusFilter(null); setIpFilter(null); }}
                      className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 border border-blue-900/40 bg-blue-950/20 rounded-md px-1.5 py-0.5 transition-colors shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {/* Log out all other devices button */}
                  <button
                    type="button"
                    onClick={() => setRevokeConfirmOpen(true)}
                    disabled={revokeLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-800 hover:border-red-800/60 hover:bg-red-950/20 text-stone-400 hover:text-red-400 text-xs font-medium transition-all disabled:opacity-50 disabled:pointer-events-none"
                    title="Log out from all other devices and sessions"
                  >
                    {revokeLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Other Devices</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto w-full">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-150">
                  <thead className="sticky top-0 bg-[#0F0F0F] z-10">
                    <tr className="border-b border-stone-850 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">
                      <th className="py-2.5 sm:py-3 pr-3 sm:pr-4 relative">
                        <button type="button" onClick={(e) => toggleDropdown('event', e)} className="flex items-center gap-1 hover:text-stone-300 transition-colors">
                          Event
                          <ChevronDown className={`w-3 h-3 transition-colors ${eventFilter ? 'text-blue-400' : ''}`} />
                        </button>
                      </th>
                      <th className="py-2.5 sm:py-3 px-3 sm:px-4 relative">
                        <button type="button" onClick={(e) => toggleDropdown('status', e)} className="flex items-center gap-1 hover:text-stone-300 transition-colors">
                          Status
                          <ChevronDown className={`w-3 h-3 transition-colors ${statusFilter ? 'text-blue-400' : ''}`} />
                        </button>
                      </th>
                      <th className="py-2.5 sm:py-3 px-3 sm:px-4">
                        <button type="button" onClick={() => toggleSort('browser')} className="flex items-center gap-1 hover:text-stone-300 transition-colors">
                          <Globe className="w-3 h-3" />
                          Browser
                          {sortField === 'browser' && (
                            <ChevronDown className={`w-3 h-3 transition-transform ${sortAsc ? '' : 'rotate-180'}`} />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 sm:py-3 px-3 sm:px-4">
                        <button type="button" onClick={() => toggleSort('os')} className="flex items-center gap-1 hover:text-stone-300 transition-colors">
                          <MonitorSmartphone className="w-3 h-3" />
                          Device
                          {sortField === 'os' && (
                            <ChevronDown className={`w-3 h-3 transition-transform ${sortAsc ? '' : 'rotate-180'}`} />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 sm:py-3 px-3 sm:px-4 relative">
                        <button type="button" onClick={(e) => toggleDropdown('ip', e)} className="flex items-center gap-1 hover:text-stone-300 transition-colors">
                          <MapPin className="w-3 h-3" />
                          IP
                          <ChevronDown className={`w-3 h-3 transition-colors ${ipFilter ? 'text-blue-400' : ''}`} />
                        </button>
                      </th>
                      <th className="py-2.5 sm:py-3 pl-3 sm:pl-4">
                        <button type="button" onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-stone-300 transition-colors">
                          Date & Time
                          {sortField === 'created_at' && (
                            <ChevronDown className={`w-3 h-3 transition-transform ${sortAsc ? '' : 'rotate-180'}`} />
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-850/60">
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map((event) => {
                        const isSuccess = event.status?.toLowerCase() === 'success';
                        const isFailed = event.status?.toLowerCase().startsWith('failed');
                        const isAutoExpired = event.status === 'Auto-Expired';
                        const isCurrentSession = event.event_type === 'active_session' && (Date.now() - new Date(event.created_at).getTime()) < 10 * 60 * 1000;
                        
                        let badgeBg = 'bg-stone-850 border-stone-750 text-stone-400';
                        if (isCurrentSession) {
                          badgeBg = 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400';
                        } else if (isAutoExpired) {
                          badgeBg = 'bg-amber-950/20 border-amber-900/40 text-amber-400';
                        } else if (isSuccess) {
                          badgeBg = 'bg-blue-950/20 border-blue-900/40 text-blue-400';
                        } else if (isFailed) {
                          badgeBg = 'bg-red-950/20 border-red-900/45 text-red-400';
                        }

                        const isRevoked = event.event_type === 'sessions_revoked';
                        const revokedCount = isRevoked ? (event.metadata?.revoked_count as number | undefined) : undefined;

                        return (
                          <tr key={event.id} className="text-stone-100 hover:bg-white/2 transition-colors">
                            <td className="py-2.5 sm:py-3 pr-3 sm:pr-4">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {isCurrentSession && (
                                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                )}
                                {getAuthMethodIcon(event)}
                                <span className="font-semibold text-stone-100 truncate max-w-30 sm:max-w-none">{formatEventType(event.event_type)}</span>
                              </div>
                            </td>
                            <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                              {isRevoked ? (
                                <span className="text-[10px] sm:text-xs text-stone-400 font-medium">
                                  {revokedCount != null ? `${revokedCount} session${revokedCount !== 1 ? 's' : ''} ended` : 'Success'}
                                </span>
                              ) : (
                                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded border text-[10px] sm:text-xs font-semibold ${badgeBg}`}>
                                  {isCurrentSession ? 'Current' : event.status}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-stone-300 font-medium text-xs">
                              {isRevoked ? '—' : (event.browser || '—')}
                            </td>
                            <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-stone-300 font-medium text-xs">
                              {isRevoked ? '—' : (event.os || '—')}
                            </td>
                            <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-stone-400 font-mono text-xs">
                              {isRevoked ? '—' : (event.ip_address || '—')}
                            </td>
                            <td className="py-2.5 sm:py-3 pl-3 sm:pl-4 text-stone-500 text-xs whitespace-nowrap">
                              {new Date(event.created_at).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="text-stone-400">
                        <td colSpan={6} className="py-6 text-center text-stone-400 font-medium">
                          No security events recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Filter Dropdowns (rendered inside motion.div so they're in the IIFE scope) */}
              {activeDropdown && dropdownPos && (
                <div
                  className="fixed z-40 bg-[#0A0A0A] border border-stone-800 rounded-xl shadow-xl py-1 min-w-45 max-h-60 overflow-auto"
                  style={{ top: dropdownPos.top, left: dropdownPos.left }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeDropdown === 'event' && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEventFilter(null); setActiveDropdown(null); setDropdownPos(null); }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-900/60 transition-colors ${!eventFilter ? 'text-blue-400 font-semibold' : 'text-stone-300'}`}
                      >
                        All Events
                      </button>
                      {uniqueEvents.map((ev: string) => (
                        <button
                          key={ev}
                          type="button"
                          onClick={() => { setEventFilter(ev); setActiveDropdown(null); setDropdownPos(null); }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-900/60 transition-colors flex items-center gap-2 ${eventFilter === ev ? 'text-blue-400 font-semibold' : 'text-stone-300'}`}
                        >
                          {formatEventType(ev)}
                        </button>
                      ))}
                    </>
                  )}
                  {activeDropdown === 'status' && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setStatusFilter(null); setActiveDropdown(null); setDropdownPos(null); }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-900/60 transition-colors ${!statusFilter ? 'text-blue-400 font-semibold' : 'text-stone-300'}`}
                      >
                        All Statuses
                      </button>
                      {uniqueStatuses.map((st: string) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => { setStatusFilter(st); setActiveDropdown(null); setDropdownPos(null); }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-900/60 transition-colors ${statusFilter === st ? 'text-blue-400 font-semibold' : 'text-stone-300'}`}
                        >
                          {st}
                        </button>
                      ))}
                    </>
                  )}
                  {activeDropdown === 'ip' && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setIpFilter(null); setActiveDropdown(null); setDropdownPos(null); }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-900/60 transition-colors ${!ipFilter ? 'text-blue-400 font-semibold' : 'text-stone-300'}`}
                      >
                        All IPs
                      </button>
                      {uniqueIps.map((ipAddr: string) => (
                        <button
                          key={ipAddr}
                          type="button"
                          onClick={() => { setIpFilter(ipAddr); setActiveDropdown(null); setDropdownPos(null); }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-stone-900/60 transition-colors ${ipFilter === ipAddr ? 'text-blue-400 font-semibold' : 'text-stone-300'}`}
                        >
                          {ipAddr}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })()}
      </div>

      {/* Revoke Other Sessions Confirmation Dialog */}
      <AnimatePresence>
        {revokeConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setRevokeConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0A0A0A] border border-stone-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-red-950/30 text-red-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-100">Log out from all other devices?</h3>
              </div>
              <p className="text-sm text-stone-400 mb-5">
                Your account will log out from all other devices and sessions, except for this one.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setRevokeConfirmOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-800 hover:bg-stone-900/50 text-stone-300 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeOtherSessions}
                  disabled={revokeLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {revokeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {revokeLoading ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
