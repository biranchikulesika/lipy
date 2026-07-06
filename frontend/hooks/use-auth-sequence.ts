import { useState, useCallback, useRef } from 'react';

const FAILURE_MESSAGES = [
  "Typo?\n\nTry again.",
  "Still doesn't look right.",
  "Are you Biranchi?",
  "Beginning to doubt that.",
  "Trying random passwords rarely works.",
  "You're persistent.\n\nI'll give you that.",
  "Pretty sure you're not Biranchi.",
  "This isn't how friendships start."
];

const FALLBACK_MESSAGE = "Request noted.\n\nAccess denied.";

const VERIFICATION_SEQUENCE = [
  "Verifying identity...",
  "Checking credentials...",
  "Loading workspace..."
];

const SUCCESS_SEQUENCE = [
  "Good to see you again, Biranchi.",
  "Authenticating...",
  "✓ Identity confirmed",
  "Loading workspace...",
  "Syncing drafts...",
  "Preparing dashboard...",
  "Ready."
];

export function useAuthSequence() {
  const [authStatus, setAuthStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(sessionStorage.getItem('auth_failed_attempts') || '0', 10);
    }
    return 0;
  });

  const incrementFailure = useCallback(() => {
    setFailedAttempts(prev => {
      const next = prev + 1;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_failed_attempts', next.toString());
      }
      return next;
    });
  }, []);

  const runVerificationSequence = useCallback(async (): Promise<void> => {
    setAuthStatus('verifying');
    for (const msg of VERIFICATION_SEQUENCE) {
      setStatusMessage(msg);
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
    }
  }, []);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearStatus = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAuthStatus('idle');
    setStatusMessage(null);
  }, []);

  const showFailureMessage = useCallback(() => {
    setAuthStatus('error');
    incrementFailure();
    
    const index = failedAttempts;
    if (index < FAILURE_MESSAGES.length) {
      setStatusMessage(FAILURE_MESSAGES[index]);
    } else {
      setStatusMessage(FALLBACK_MESSAGE);
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      clearStatus();
    }, 4000);
  }, [failedAttempts, incrementFailure, clearStatus]);

  const runSuccessSequence = useCallback(async (): Promise<void> => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAuthStatus('success');
    for (const msg of SUCCESS_SEQUENCE) {
      setStatusMessage(msg);
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
    }
  }, []);

  return {
    authStatus,
    statusMessage,
    runVerificationSequence,
    showFailureMessage,
    runSuccessSequence,
    clearStatus,
    failedAttempts
  };
}
