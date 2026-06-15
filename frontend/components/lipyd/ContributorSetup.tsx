'use client';
import React, { useState, useEffect } from 'react';
import CharacterSearch from './CharacterSearch';
import { generateSessionId } from '@/lib/lipyd/filenameService';
import { getAllSamples, saveContributor } from '@/lib/lipyd/storageService';
import { OdiaCharacter } from '@/lib/lipyd/odiaCharacters';
import { exportDataset } from '@/lib/lipyd/exportService';

export default function ContributorSetup({ onStart }: { onStart: (cfg: any) => void }) {
  const [name, setName] = useState('');
  const [contributorId, setContributorId] = useState('');
  const [mode, setMode] = useState('random');
  const [selected, setSelected] = useState<OdiaCharacter | null>(null);

  const [editing, setEditing] = useState(true);
  const [editingNameInline, setEditingNameInline] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveConfirmMsg, setLeaveConfirmMsg] = useState('');
  const [deviceSampleCount, setDeviceSampleCount] = useState(0);

  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const getCookie = (cname: string) => {
    const nameEQ = cname + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  };

  const setCookie = (cname: string, cvalue: string, days = 365) => {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${cname}=${encodeURIComponent(cvalue)};${expires};path=/`;
  };

  const deleteCookie = (cname: string) => {
    document.cookie = `${cname}=; Max-Age=0; path=/`;
  };

  useEffect(() => {
    try {
      const savedName = getCookie('lipy_name');
      const savedId = getCookie('lipy_contributorId');
      if (savedName && savedId) {
        setName(savedName);
        setContributorId(savedId);
        setEditing(false);
        return;
      }
      try {
        const raw = localStorage.getItem('lipy_session_config');
        if (raw) {
          const cfg = JSON.parse(raw);
          if (cfg?.name && cfg?.contributorId) {
            setName(cfg.name);
            setContributorId(cfg.contributorId);
            setEditing(false);
            return;
          }
        }
      } catch (e) { }
    } catch (e) { }
  }, []);

  useEffect(() => {
    if (!contributorId) {
      try {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c_${Math.random().toString(36).slice(2, 9)}`;
        setContributorId(id);
      } catch (e) {
        setContributorId(`c_${Math.random().toString(36).slice(2, 9)}`);
      }
    }
  }, [contributorId]);

  useEffect(() => {
    let mounted = true;

    async function loadDeviceSampleCount() {
      if (!contributorId || editing) {
        if (mounted) setDeviceSampleCount(0);
        return;
      }

      try {
        const devKey = `lipy_device_sample_count_${String(contributorId || '').trim()}`;
        const cachedDev = Number(localStorage.getItem(devKey) || 0) || 0;

        const samples = await getAllSamples();
        const dbCount = samples.filter((sample) => {
          try {
            const sCid = sample?.contributorId != null ? String(sample.contributorId).trim() : '';
            const cCid = String(contributorId || '').trim();
            return sCid && cCid && sCid === cCid;
          } catch (e) {
            return false;
          }
        }).length;

        const count = Math.max(dbCount, cachedDev);
        if (count > cachedDev) {
            try { localStorage.setItem(devKey, String(count)); } catch(e) {}
        }

        if (mounted) setDeviceSampleCount(count);
      } catch (e) {
        if (mounted) setDeviceSampleCount(0);
      }
    }

    loadDeviceSampleCount();

    return () => {
      mounted = false;
    };
  }, [contributorId, editing]);

  const levelSize = 25;
  const currentLevel = Math.floor(deviceSampleCount / levelSize) + 1;

  function saveInlineName(nextName: string) {
    const trimmed = String(nextName || '').trim();
    if (!trimmed) return;
    setName(trimmed);
    setEditingNameInline(false);
    try {
      const sessionId = localStorage.getItem('lipy_session_config') ? JSON.parse(localStorage.getItem('lipy_session_config') || '{}')?.sessionId : '';
      if (sessionId) {
        saveContributor({ name: trimmed, contributorId, sessionId, mode: mode === 'single' ? 'single-character' : 'mixed-random', started_at: new Date().toISOString() }).catch(() => { });
      }
    } catch (e) { }
    try { setCookie('lipy_name', trimmed); } catch (e) { }
    try {
      const raw = localStorage.getItem('lipy_session_config');
      if (raw) {
        const cfg = JSON.parse(raw);
        cfg.name = trimmed;
        localStorage.setItem('lipy_session_config', JSON.stringify(cfg));
      }
    } catch (e) { }
  }

  function handleStart() {
    if (!name) return alert('Enter name');
    const sessionId = generateSessionId();
    const cfg = { name, contributorId, mode: mode === 'single' ? 'single-character' : 'mixed-random', selected, sessionId };
    saveContributor({ name, contributorId, sessionId, mode: cfg.mode, started_at: new Date().toISOString() }).catch(() => { });
    try { localStorage.setItem('lipy_session_config', JSON.stringify(cfg)); } catch (e) { }
    try {
      setCookie('lipy_name', name);
      setCookie('lipy_contributorId', contributorId);
    } catch (e) { }

    onStart(cfg);
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    setExportComplete(false);

    try {
      const cfg = { name, contributorId, mode: mode === 'single' ? 'single-character' : 'mixed-random', selected };
      await exportDataset(cfg);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to export dataset');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 text-center max-w-md mx-auto w-full panel rounded-xl p-6 sm:p-8 border border-slate-900/8 dark:border-white/10 bg-white/70 dark:bg-white/5">
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">LiPyD</h2>
        <p className="text-base text-slate-500 dark:text-slate-400">Help build the Odia handwriting dataset.</p>
      </div>

      {editing ? (
        <div className="rounded-2xl border border-slate-900/10 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 p-6 text-left shadow-sm">
          <div className="space-y-1 mb-4">
            <label className="block text-base font-medium text-slate-900 dark:text-slate-200">Your First Name</label>
            <p className="text-sm text-slate-500 dark:text-slate-400">Used only to organize contribution sessions.</p>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-base text-slate-900 dark:text-white outline-none transition focus:border-slate-400 dark:focus:border-slate-600 focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/5"
            placeholder="Enter your name"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900/10 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 px-5 py-4 text-left shadow-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Welcome back,</div>
              <div className="mt-1 flex items-center gap-2">
                {editingNameInline ? (
                  <input
                    autoFocus
                    defaultValue={name}
                    onBlur={(e) => saveInlineName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveInlineName(e.currentTarget.value);
                      if (e.key === 'Escape') setEditingNameInline(false);
                    }}
                    className="min-w-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-xl font-semibold text-slate-900 dark:text-white outline-none"
                  />
                ) : (
                  <div className="text-2xl font-semibold text-slate-900 dark:text-white truncate">{name}</div>
                )}
                <button
                  type="button"
                  aria-label="Edit name"
                  onClick={() => setEditingNameInline(true)}
                  className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base font-semibold text-slate-900 dark:text-white">{deviceSampleCount} <span className="font-normal text-sm text-slate-500 dark:text-slate-400">contributions</span></div>
              <div className="mt-1 inline-flex rounded-full border border-slate-900/10 dark:border-white/10 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                Level {currentLevel}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="text-left text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Choose Mode</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`rounded-2xl border px-4 py-3.5 text-center transition ${mode === 'single' ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <div className={`text-base ${mode === 'single' ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>Single Character</div>
          </button>
          <button
            type="button"
            onClick={() => setMode('random')}
            className={`rounded-2xl border px-4 py-3.5 text-center transition ${mode === 'random' ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <div className={`text-base ${mode === 'random' ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>Mixed Random</div>
          </button>
        </div>
      </div>

      {mode === 'single' && (
        <div className="text-left">
          <CharacterSearch selected={selected} onSelect={(c) => setSelected(c)} onStart={handleStart} startLabel="Start Contributing" />
        </div>
      )}

      {mode !== 'single' && (
        <div className="pt-2">
          <button className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-3.5 text-base font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50" onClick={handleStart} disabled={!name}>
            Start Contributing
          </button>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-900/10 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-lg font-semibold text-slate-900 dark:text-white">Change contributor</div>
            <div className="text-base text-slate-500 dark:text-slate-400 mt-2">{leaveConfirmMsg || 'Clear saved contributor and start over?'}</div>
            <div className="mt-6 flex gap-3 justify-end">
              <button className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setShowLeaveConfirm(false)}>Cancel</button>
              <button className="rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200" onClick={() => { deleteCookie('lipy_name'); deleteCookie('lipy_contributorId'); setName(''); setContributorId(''); setEditing(true); setShowLeaveConfirm(false); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {!editing && (
        <div className="flex items-center justify-center gap-4 text-sm pt-4 border-t border-slate-900/5 dark:border-white/5">
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition" onClick={() => setShowLeaveConfirm(true)}>Reset profile</button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition flex items-center gap-1" onClick={handleExport} disabled={exporting}>
              {exportComplete ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Exported
                </>
              ) : exporting ? 'Exporting...' : 'Export dataset'}
            </button>
        </div>
      )}
    </div>
  );
}
