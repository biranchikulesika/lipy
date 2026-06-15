'use client';

import React, { useState } from 'react';
import ContributorSetup from '@/components/lipyd/ContributorSetup';
import CanvasBoard from '@/components/lipyd/CanvasBoard';

export function DatasetContributor() {
  const [view, setView] = useState('home');
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const isHome = view === 'home';

  const updateSessionConfig = (updates: any) => {
    setSessionConfig((current: any) => {
      const next = { ...(current || {}), ...(updates || {}) };
      try { localStorage.setItem('lipy_session_config', JSON.stringify(next)); } catch (e) { }
      return next;
    });
  };

  return (
    <main className="relative mx-auto flex h-[calc(100svh-4.5rem)] max-w-[1500px] flex-col overflow-y-auto px-3 pb-3 pt-2 sm:px-4 lg:px-8 lg:py-6">
      <div className={`mx-auto w-full flex-1 flex flex-col ${isHome ? 'items-center pt-8 lg:pt-16 max-w-screen-sm' : 'pt-2 lg:pt-4 max-w-5xl justify-center h-full'}`}>
        <div key={view} className="w-full flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200 min-h-0">
          {view === 'home' && (
            <ContributorSetup
              onStart={(cfg) => {
                updateSessionConfig(cfg);
                setView('collect');
              }}
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
