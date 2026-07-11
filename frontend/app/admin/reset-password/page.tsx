'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, KeyRound, Eye, EyeOff, ShieldAlert, Check, ArrowLeft, LogIn, CircleCheckBig } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

type Phase = 'loading' | 'expired' | 'form' | 'success';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ password: false, confirm: false });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const errorParam = searchParams?.get('error');

  useEffect(() => {
    if (errorParam === 'auth_failed') {
      setPhase('expired');
      return;
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      setPhase('expired');
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (!session) {
        setPhase('expired');
      } else {
        setPhase('form');
      }
    }).catch(() => {
      setPhase('expired');
    });
  }, [supabaseUrl, supabaseAnonKey, errorParam]);

  const policy = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordValid = Object.values(policy).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const formValid = passwordValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTouched({ password: true, confirm: true });

    if (!passwordValid) {
      setError('Password does not meet all requirements.');
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        const msg = updateError.message;
        if (msg.includes('same as the old password')) {
          setError('New password must be different from your current password.');
        } else if (msg.includes('session') || msg.includes('Session')) {
          setError('Your session has expired. Please request a new reset link.');
        } else {
          setError(msg || 'Failed to update password.');
        }
      } else {
        setPhase('success');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const PolicyItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`inline-flex items-center gap-1 text-[11px] transition-colors ${ok ? 'text-emerald-400' : 'text-stone-500'}`}>
      <Check className={`w-3 h-3 ${ok ? 'opacity-100' : 'opacity-30'}`} />
      {label}
    </span>
  );

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#000000] text-[#F5F5F5] font-sans flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-[#0095f6]" />
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="min-h-screen bg-[#000000] text-[#F5F5F5] font-sans flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#0A0A0A] border border-stone-900 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center space-y-5 text-center"
        >
          <div className="flex items-center gap-1.5">
            <Logo className="text-lg font-bold" />
          </div>
          <div className="p-3 rounded-full bg-amber-950/20 border border-amber-900/40">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Link Expired or Invalid</h1>
            <p className="text-sm text-stone-400 leading-relaxed">
              This password reset link has expired or is no longer valid.
              Please request a new one from the login page.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-full pt-1">
            <Link
              href="/admin/forgot-password"
              className="w-full bg-[#0095f6] hover:bg-[#1877f2] text-white py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Request New Link
            </Link>
            <Link
              href="/admin/login"
              className="w-full border border-stone-800 hover:bg-stone-900/50 text-stone-300 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="min-h-screen bg-[#000000] text-[#F5F5F5] font-sans flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#0A0A0A] border border-stone-900 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center space-y-5 text-center"
        >
          <div className="flex items-center gap-1.5">
            <Logo className="text-lg font-bold" />
          </div>
          <div className="p-3 rounded-full bg-emerald-950/20 border border-emerald-900/40">
            <CircleCheckBig className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Password Updated</h1>
            <p className="text-sm text-stone-400 leading-relaxed">
              Your password has been changed successfully. Sign in with your new password to continue.
            </p>
          </div>
          <Link
            href="/admin/login"
            className="w-full bg-[#0095f6] hover:bg-[#1877f2] text-white py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] font-sans flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0A0A0A] border border-stone-900 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col space-y-6"
      >
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Logo className="text-lg font-bold" />
          </div>
          <Link
            href="/admin/login"
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 w-fit transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Set New Password</h1>
          <p className="text-xs text-stone-400">
            Your new password must meet all the requirements below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-600">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="Enter new password"
                disabled={loading}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg bg-stone-900/50 border border-stone-800 focus:outline-none focus:ring-1 focus:ring-[#0095f6] focus:border-[#0095f6] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-stone-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
              <PolicyItem ok={policy.minLength} label="8+ characters" />
              <PolicyItem ok={policy.uppercase} label="uppercase" />
              <PolicyItem ok={policy.lowercase} label="lowercase" />
              <PolicyItem ok={policy.number} label="number" />
              <PolicyItem ok={policy.special} label="special character" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-600">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                placeholder="Re-enter new password"
                disabled={loading}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg bg-stone-900/50 border border-stone-800 focus:outline-none focus:ring-1 focus:ring-[#0095f6] focus:border-[#0095f6] transition-all disabled:opacity-50"
              />
            </div>
            <AnimatePresence>
              {touched.confirm && confirmPassword.length > 0 && !passwordsMatch && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[11px] text-amber-400 overflow-hidden"
                >
                  Passwords do not match.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-start gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || !formValid}
            className="w-full bg-[#0095f6] hover:bg-[#1877f2] text-white py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Set Password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-[#000000]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0095f6]" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
