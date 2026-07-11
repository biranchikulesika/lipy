'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ContributorSetup = dynamic(() => import('@/components/lipyd/ContributorSetup'), {
  ssr: false,
  loading: () => <div className="w-full h-48 rounded-2xl bg-verdigris-950/40 animate-pulse" />,
});

const CanvasBoard = dynamic(() => import('@/components/lipyd/CanvasBoard'), {
  ssr: false,
  loading: () => <div className="w-full max-w-85 sm:max-w-100 lg:max-w-120 mx-auto aspect-square rounded-3xl bg-verdigris-950 animate-pulse" />,
});

export function DatasetContributor() {
  const [view, setView] = useState('home');
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isHome = view === 'home';

  useEffect(() => {
    if (isSearchFocused) {
      document.body.classList.add('hide-navbar');
    } else {
      document.body.classList.remove('hide-navbar');
    }
    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, [isSearchFocused]);

  const updateSessionConfig = (updates: any) => {
    setSessionConfig((current: any) => {
      const next = { ...(current || {}), ...(updates || {}) };
      try { localStorage.setItem('lipy_session_config', JSON.stringify(next)); } catch (e) { }
      return next;
    });
  };

  return (
    <main className={`relative mx-auto flex ${isSearchFocused ? 'h-svh pt-1' : 'h-[calc(100svh-4.5rem)] pt-2'} max-w-375 flex-col ${(isHome && !isSearchFocused) ? 'overflow-y-auto' : 'overflow-hidden'} px-3 pb-3 sm:px-4 lg:px-8 lg:py-6`}>
      <div className={`mx-auto w-full flex-1 flex flex-col ${isHome ? `items-center ${isSearchFocused ? 'pt-1 sm:pt-8' : 'pt-8 lg:pt-16'} max-w-screen-sm` : 'pt-2 lg:pt-4 max-w-5xl justify-center h-full'}`}>
        <div key={view} className={`w-full flex-1 flex flex-col ${isSearchFocused ? 'justify-start pt-4 sm:justify-center sm:pt-0' : 'justify-center'} animate-in fade-in zoom-in-95 duration-200 min-h-0`}>
          {view === 'home' && (
            <ContributorSetup
              onStart={(cfg) => {
                updateSessionConfig(cfg);
                setView('collect');
              }}
              isSearchFocused={isSearchFocused}
              onSearchFocusChange={setIsSearchFocused}
            />
          )}
          {view === 'collect' && sessionConfig && (
            <div className="pb-4 w-full flex flex-col items-center justify-center flex-1 min-h-0">
              <CanvasBoard sessionConfig={sessionConfig} onSessionConfigChange={updateSessionConfig} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
