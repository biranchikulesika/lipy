'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, KeyRound, AtSign, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { ParticleCanvas } from '@/components/ui/particle-canvas';
import { Logo } from '@/components/ui/logo';
import { useFakeTyping } from '@/hooks/use-fake-typing';
import { useAuthSequence } from '@/hooks/use-auth-sequence';
import { authenticateUser } from './actions';



const SOCIAL_LINKS = {
  github: "https://github.com/biranchikulesika/lipy",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient() : null;

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [failedAttemptText, setFailedAttemptText] = useState("I'm Biranchi");
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get('error');
  const providerParam = searchParams?.get('provider');

  useEffect(() => {
    if (errorParam === 'not_registered') {
      const providerName = providerParam
        ? (providerParam.toLowerCase() === 'github' ? 'GitHub' : providerParam.charAt(0).toUpperCase() + providerParam.slice(1))
        : 'OAuth';
      setEmailError(`We could not find any account associated with your ${providerName} account.`);
    }
  }, [errorParam, providerParam]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (invalidCredentials) {
      const timer = setTimeout(() => {
        setInvalidCredentials(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [invalidCredentials]);

  const router = useRouter();

  const {
    runVerificationSequence,
    showFailureMessage,
    runSuccessSequence,
    clearStatus,
  } = useAuthSequence();

  const handleFakeSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  const {
    fakeEmail,
    fakePassword,
    isFakeTyping,
    handleInputFocus,
    handleInputBlur,
    handleMouseEnter,
    handleMouseLeave,
  } = useFakeTyping(handleFakeSubmit, email, password);

  const handleEmailBlur = () => {
    handleInputBlur();
    if (!isFakeTyping && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address.');
      } else {
        setEmailError(null);
      }
    }
  };

  const currentEmail = isFakeTyping ? fakeEmail : email;
  const currentPassword = isFakeTyping ? fakePassword : password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearStatus();

    // 1. Run the verification sequence animations
    await runVerificationSequence();

    // 2. Authenticate the credentials
    const { error: signInError } = await authenticateUser(email, password);

    if (signInError) {
      // Show error failure state
      showFailureMessage();

      const texts = ["I'm Biranchi", "Yes, I'm Biranchi", "I love Biranchi"];
      setFailedAttemptText(texts[Math.floor(Math.random() * texts.length)]);
      setFailedAttempts(prev => prev + 1);
      setInvalidCredentials(true);

      setLoading(false);

      if (failedAttempts >= 1) {
        setEmail('');
        setPassword('');
        setTimeout(() => {
          document.getElementById('email')?.focus();
        }, 50);
      } else {
        setPassword('');
        setTimeout(() => {
          document.getElementById('password')?.focus();
        }, 50);
      }
      return;
    }

    // 3. Run success sequence on authenticated session
    await runSuccessSequence();

    router.push('/admin');
    router.refresh();
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    clearStatus();

    if (!supabase) {
      setEmailError("Supabase authentication is not configured in this environment.");
      setLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/admin/auth/callback?next=/admin&provider=${provider}`;

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (signInError) {
      const texts = ["I'm Biranchi", "Yes, I'm Biranchi", "I love Biranchi"];
      setFailedAttemptText(texts[Math.floor(Math.random() * texts.length)]);
      setFailedAttempts(prev => prev + 1);
      setInvalidCredentials(true);
      setLoading(false);
      return;
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    clearStatus();

    // Standard passkey entry or authentication bypass
    const texts = ["I'm Biranchi", "Yes, I'm Biranchi", "I love Biranchi"];
    setFailedAttemptText(texts[Math.floor(Math.random() * texts.length)]);
    setFailedAttempts(prev => prev + 1);
    setInvalidCredentials(true);
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] w-full dark:text-[#F5F5F5] text-[#262626] font-sans selection:bg-blue-200 dark:selection:bg-blue-900 selection:text-black dark:selection:text-white flex flex-col items-center justify-between p-6 sm:p-8 relative select-none bg-stone-50 dark:bg-[#070707] overflow-y-auto">

      {/* Return & Theme Toggle */}
      <AnimatePresence>
        {!isInputFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block absolute top-8 left-8 z-50"
          >
            <Link
              href="/"
              className="hover:opacity-70 transition-opacity"
            >
              <Logo />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Particle Background (Hidden on Mobile) */}
      <div id="particle-canvas-container" className="hidden md:block absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-[#FAFAFA] to-[#FFFFFF] dark:from-[#0A0A0A] dark:to-[#000000] opacity-100">
        {isMounted && <ParticleCanvas text="" />}
      </div>

      {/* Centered Form Area (No rigid box unless wrapping is needed) */}
      <div className="z-10 w-full max-w-[360px] mx-auto flex flex-col items-center my-auto py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full flex flex-col items-center"
        >
          {/* Main Login Box */}
          <div
            className={`w-full flex flex-col items-center transition-all duration-300 ${isInputFocused ? 'mb-1 md:mb-2 pt-0 md:pt-2' : 'mb-2 md:mb-3 pt-4 md:pt-10'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <h1 className={`text-3xl md:text-5xl whitespace-nowrap transition-all duration-300 ${isInputFocused ? 'mb-3 md:mb-6' : 'mb-6 md:mb-10'}`}>
              <Logo suffix=" Admin" className="text-3xl md:text-5xl font-bold" />
            </h1>

            <form className="w-full space-y-2" onSubmit={handleSubmit}>
              <div className="relative">
                <label htmlFor="email" className="sr-only">Email ID</label>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required={!isFakeTyping}
                  readOnly={isFakeTyping}
                  value={currentEmail}
                  onChange={(e) => {
                    if (!isFakeTyping) {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                      if (invalidCredentials) setInvalidCredentials(false);
                    }
                  }}
                  onFocus={() => {
                    handleInputFocus();
                    setIsInputFocused(true);
                  }}
                  onBlur={() => {
                    handleEmailBlur();
                    setIsInputFocused(false);
                  }}
                  className={`block w-full rounded-md border dark:border-stone-700 border-stone-300 dark:bg-[#121212] bg-[#FAFAFA] pl-11 pr-3 py-2.5 text-[15px] focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors cursor-text read-only:focus:border-stone-300 ${emailError ? 'border-red-500' : ''}`}
                  placeholder={isFakeTyping ? "" : "Email ID"}
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={isFakeTyping ? 'text' : (showPassword ? 'text' : 'password')}
                  autoComplete="current-password"
                  required={!isFakeTyping}
                  readOnly={isFakeTyping}
                  value={currentPassword}
                  onChange={(e) => {
                    if (!isFakeTyping) {
                      setPassword(e.target.value);
                      if (invalidCredentials) setInvalidCredentials(false);
                    }
                  }}
                  onFocus={() => {
                    handleInputFocus();
                    setIsInputFocused(true);
                  }}
                  onBlur={() => {
                    handleInputBlur();
                    setIsInputFocused(false);
                  }}
                  className="block w-full rounded-md border dark:border-stone-700 border-stone-300 dark:bg-[#121212] bg-[#FAFAFA] pl-11 pr-11 py-2.5 text-[15px] focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors cursor-text read-only:focus:border-stone-300"
                  placeholder={isFakeTyping ? "" : "Password"}
                />
                {currentPassword && !isFakeTyping && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    tabIndex={-1}
                  >
                    <div className="relative w-5 h-5">
                      <motion.div
                        initial={false}
                        animate={{ opacity: showPassword ? 0 : 1, scale: showPassword ? 0.8 : 1 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <Eye className="w-5 h-5" />
                      </motion.div>
                      <motion.div
                        initial={false}
                        animate={{ opacity: showPassword ? 1 : 0, scale: showPassword ? 1 : 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <EyeOff className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </button>
                )}
              </div>



              <div className="pt-2 relative">
                <button
                  type="submit"
                  disabled={loading || !currentEmail || !currentPassword || currentPassword.length < 8 || !!emailError}
                  className="w-full flex justify-center rounded-[8px] bg-[#0095f6] hover:bg-[#1877f2] px-4 py-2.5 text-[15px] font-semibold text-white focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>
                      {(!currentEmail || !currentPassword || currentPassword.length < 8 || !!emailError)
                        ? "Log in"
                        : (failedAttempts > 0 ? failedAttemptText : "Log in")}
                    </span>
                  )}
                </button>
                <div className="absolute top-full mt-1.5 left-0 w-full flex justify-center pointer-events-none">
                  <AnimatePresence>
                    {invalidCredentials && (
                      <motion.span
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-stone-500 dark:text-stone-400 text-[12px] font-medium"
                      >
                        Invalid credentials entered
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex w-full items-center my-4 md:my-6">
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                <span className="mx-4 text-[13px] text-[#737373] dark:text-[#A8A8A8]">or continue with</span>
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3 w-full">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center py-2 md:py-4 border border-stone-200 dark:border-stone-800 rounded-[8px] hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[20px] w-[20px] md:h-[24px] md:w-[24px] mb-1 md:mb-2">
                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                  </svg>
                  <span className="text-[12px] md:text-[14px] font-medium text-[#262626] dark:text-[#F5F5F5]">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center py-2 md:py-4 border border-stone-200 dark:border-stone-800 rounded-[8px] hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[20px] w-[20px] md:h-[24px] md:w-[24px] mb-1 md:mb-2 fill-[#24292F] dark:fill-[#FFFFFF]">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span className="text-[12px] md:text-[14px] font-medium text-[#262626] dark:text-[#F5F5F5]">GitHub</span>
                </button>

                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="flex flex-col items-center justify-center py-2 md:py-4 border border-stone-200 dark:border-stone-800 rounded-[8px] hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors disabled:opacity-50"
                >
                  <KeyRound className="h-[20px] w-[20px] md:h-[24px] md:w-[24px] mb-1 md:mb-2 text-stone-700 dark:text-stone-300" />
                  <span className="text-[12px] md:text-[14px] font-medium text-[#262626] dark:text-[#F5F5F5]">Passkey</span>
                </button>
              </div>

              {emailError && (
                <p className="text-red-500 text-[12px] text-center mt-4">
                  {emailError}
                </p>
              )}
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <AnimatePresence>
          {!isInputFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full mt-auto pt-8 pb-2 flex flex-wrap justify-center gap-x-3 gap-y-1 md:gap-x-4 md:gap-y-2 px-4 text-[10px] md:text-[12px] text-[#737373] dark:text-[#A8A8A8] z-10"
            >
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/about" className="hover:underline">About</Link>
              <Link href="/lipyd" className="hover:underline">LiPyD</Link>
              <Link href="/team" className="hover:underline">Team</Link>
              <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>

              <div className="w-full flex justify-center gap-4 mt-1 md:mt-2">
                <span>© 2026 LiPy Team</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center dark:bg-[#000000] bg-[#FFFFFF]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0095f6]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
