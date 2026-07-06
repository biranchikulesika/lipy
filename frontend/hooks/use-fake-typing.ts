import { useState, useEffect, useCallback, useRef } from 'react';

const FAKE_EMAILS = [
  'admin@lipy.app',
  'biranchi@lipy.app',
  'keeler@proton.me',
  'kulesika@lipy.app',
  'biranchi@gmail.com'
];

const FAKE_PASSWORDS = [
  'LiPyD@2026',
  'Admin@123',
  'Biranchi@2026',
  'Iloveyou',
  '12345678',
  'root',
  'ilovebiryani'
];

export function useFakeTyping(
  onFakeSubmit: (email: string, pass: string) => void,
  realEmail: string,
  realPassword: string
) {
  const [emailText, setEmailText] = useState('');
  const [passwordText, setPasswordText] = useState('');
  const [isFakeTyping, setIsFakeTyping] = useState(false);

  const isIdleRef = useRef(false);
  const isFocusedRef = useRef(false);
  const isHoveringRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const resetIdleTimerRef = useRef<(fromActivity?: boolean) => void>(() => {});
  const onFakeSubmitRef = useRef(onFakeSubmit);

  useEffect(() => {
    onFakeSubmitRef.current = onFakeSubmit;
  }, [onFakeSubmit]);
  
  const realInputsRef = useRef({ email: realEmail, password: realPassword });
  
  const stopFakeTyping = useCallback(() => {
    if (animationRef.current) clearTimeout(animationRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    isIdleRef.current = false;
    setIsFakeTyping(false);
    setEmailText('');
    setPasswordText('');
  }, []);

  const startFakeSequence = useCallback(() => {
    if (!isIdleRef.current) return;
    
    const cred = {
      email: FAKE_EMAILS[Math.floor(Math.random() * FAKE_EMAILS.length)],
      password: FAKE_PASSWORDS[Math.floor(Math.random() * FAKE_PASSWORDS.length)]
    };
    
    let currentPhase = 'email';
    let charIndex = 0;
    let currentEmail = '';
    let currentPassword = '';

    const typeNextChar = () => {
      if (!isIdleRef.current) return;

      let delay = Math.random() * 100 + 50;

      if (currentPhase === 'email') {
        if (charIndex < cred.email.length) {
          currentEmail += cred.email[charIndex];
          setEmailText(currentEmail);
          charIndex++;
          animationRef.current = setTimeout(typeNextChar, delay);
        } else {
          currentPhase = 'wait_password';
          animationRef.current = setTimeout(() => {
            currentPhase = 'password';
            charIndex = 0;
            typeNextChar();
          }, Math.random() * 400 + 200);
        }
      } else if (currentPhase === 'password') {
        if (charIndex < cred.password.length) {
          currentPassword += cred.password[charIndex];
          setPasswordText(currentPassword);
          charIndex++;
          animationRef.current = setTimeout(typeNextChar, delay);
        } else {
          currentPhase = 'submit';
          animationRef.current = setTimeout(() => {
             if (!isIdleRef.current) return;
             onFakeSubmitRef.current(cred.email, cred.password);
             
             animationRef.current = setTimeout(() => {
               if (!isIdleRef.current) return;
               resetIdleTimerRef.current();
             }, 3000);
          }, Math.random() * 600 + 300);
        }
      }
    };

    typeNextChar();
  }, []);

  const resetIdleTimer = useCallback((fromActivity: boolean = false) => {
    stopFakeTyping();
    
    if (fromActivity) {
      isInitialLoadRef.current = false;
    }
    
    if (isFocusedRef.current || isHoveringRef.current || realInputsRef.current.email !== '' || realInputsRef.current.password !== '') {
      return;
    }
    
    const delay = isInitialLoadRef.current ? 10000 : 6000;
    
    timeoutRef.current = setTimeout(() => {
      isInitialLoadRef.current = false;
      if (!isFocusedRef.current && !isHoveringRef.current && realInputsRef.current.email === '' && realInputsRef.current.password === '') {
        isIdleRef.current = true;
        setIsFakeTyping(true);
        startFakeSequence();
      }
    }, delay);
  }, [stopFakeTyping, startFakeSequence]);

  useEffect(() => {
    resetIdleTimerRef.current = resetIdleTimer;
  }, [resetIdleTimer]);

  useEffect(() => {
    realInputsRef.current = { email: realEmail, password: realPassword };
    resetIdleTimer();
  }, [realEmail, realPassword, resetIdleTimer]);

  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    stopFakeTyping();
  }, [stopFakeTyping]);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    resetIdleTimer(true);
  }, [resetIdleTimer]);

  useEffect(() => {
    const handleActivity = () => resetIdleTimer(true);
    
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    resetIdleTimer();

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      stopFakeTyping();
    };
  }, [resetIdleTimer, stopFakeTyping]);

  const handleInputFocus = () => {
    isFocusedRef.current = true;
    stopFakeTyping();
  };

  const handleInputBlur = () => {
    isFocusedRef.current = false;
    resetIdleTimer(true);
  };

  return {
    fakeEmail: emailText,
    fakePassword: passwordText,
    isFakeTyping,
    handleInputFocus,
    handleInputBlur,
    handleMouseEnter,
    handleMouseLeave,
  };
}
