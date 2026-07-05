'use client';
import React, { useRef, useEffect, useState } from 'react';
import useCanvasDrawing from '@/hooks/lipyd/useCanvasDrawing';
import { odiaCharacters, OdiaCharacter } from '@/lib/lipyd/odiaCharacters';
import { saveSample } from '@/lib/lipyd/storageService';
import { generateFilename } from '@/lib/lipyd/filenameService';
import { createClientSampleId, queueSampleUpload } from '@/lib/lipyd/datasetSyncService';
import schedulerService from '@/lib/lipyd/randomCharacterService';
import useDatasetSync from '@/hooks/lipyd/useDatasetSync';
import { Trash2, SkipForward, Shuffle, Check } from 'lucide-react';

export default function CanvasBoard({ sessionConfig, onSessionConfigChange }: { sessionConfig: any, onSessionConfigChange?: (cfg: any) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokePreviewWidth, setStrokePreviewWidth] = useState<number | null>(null);
  const { clearCanvas, getImageBlob } = useCanvasDrawing(canvasRef, strokeWidth);
  const [currentChar, setCurrentChar] = useState<OdiaCharacter | null>(sessionConfig.mode === 'mixed-random' ? null : sessionConfig.selected || odiaCharacters[0]);
  const [invalidMsg, setInvalidMsg] = useState('');

  const [completed, setCompleted] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const syncState = useDatasetSync(sessionConfig);
  const [showStrokePanel, setShowStrokePanel] = useState(false);
  const strokeWrapperRef = useRef<HTMLDivElement>(null);
  const [animating, setAnimating] = useState(false);

  // Transition helper
  const transitionTo = async (nextCharFn: () => Promise<void>) => {
    setAnimating(true);
    await new Promise(r => setTimeout(r, 150));
    await nextCharFn();
    setAnimating(false);
  };

  useEffect(() => {
    let alive = true;

    async function loadNextCharacter() {
      if (sessionConfig.mode !== 'mixed-random') {
        setCurrentChar(sessionConfig.selected || odiaCharacters[0]);
        return;
      }

      const nextCharacter = await schedulerService.getNextCharacter(sessionConfig);
      if (alive) setCurrentChar(nextCharacter || odiaCharacters[0]);
    }

    loadNextCharacter();

    return () => {
      alive = false;
    };
  }, [sessionConfig]);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      if (!sessionConfig || !sessionConfig.contributorId) return;
      try {
        const progress = await schedulerService.getSchedulerProgress(sessionConfig);
        if (mounted) {
          setCompleted(progress.completedCount || 0);
          setSkipped(progress.skippedCount || 0);
        }
      } catch (e) { }
    }
    loadStats();
    window.addEventListener('lipy:samples-updated', loadStats);
    window.addEventListener('lipy:scheduler-state-changed', loadStats);

    function handleDocClick(e: any) {
      try {
        if (strokeWrapperRef.current && !strokeWrapperRef.current.contains(e.target)) {
          setShowStrokePanel(false);
        }
      } catch (err) { }
    }
    document.addEventListener('click', handleDocClick);

    function handleKeyDown(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const btn = document.getElementById('save-next-btn');
        if (btn && !btn.hasAttribute('disabled')) btn.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearCanvas();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        const btn = document.getElementById('skip-btn');
        if (btn && !btn.hasAttribute('disabled')) btn.click();
      }
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('lipy:samples-updated', loadStats);
      window.removeEventListener('lipy:scheduler-state-changed', loadStats);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleDocClick);
      mounted = false;
    };
  }, [sessionConfig, clearCanvas]);

  useEffect(() => {
    const getCookie = (cname: string) => {
      const nameEQ = cname + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
      }
      return null;
    };
    const saved = getCookie('lipy_stroke_width');
    if (saved) setStrokeWidth(Number(saved) || 16);

    const onStrokeChange = (e: any) => {
      const next = Number(e?.detail?.strokeWidth);
      if (!Number.isNaN(next) && next > 0) setStrokeWidth(next);
    };
    window.addEventListener('lipy:stroke-width-changed', onStrokeChange);
    const onStrokePreviewChange = (e: any) => {
      const next = e?.detail?.strokeWidth;
      if (next == null || Number.isNaN(Number(next))) {
        setStrokePreviewWidth(null);
        return;
      }
      setStrokePreviewWidth(Number(next));
    };
    window.addEventListener('lipy:stroke-preview-changed', onStrokePreviewChange);
    return () => {
      window.removeEventListener('lipy:stroke-width-changed', onStrokeChange);
      window.removeEventListener('lipy:stroke-preview-changed', onStrokePreviewChange);
    };
  }, []);

  const handleStrokeChange = (value: string) => {
    const next = Number(value);
    setStrokeWidth(next);
    const setCookie = (cname: string, cvalue: string, days = 365) => {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${cname}=${encodeURIComponent(cvalue)};expires=${d.toUTCString()};path=/`;
    };
    try { setCookie('lipy_stroke_width', String(next)); } catch (e) { }
    setStrokePreviewWidth(next);
  };

  const clearStrokePreview = () => {
    setStrokePreviewWidth(null);
  };

  function validateDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return { ok: false, reason: 'Canvas unavailable' };
    const width = canvas.width || 0;
    const height = canvas.height || 0;
    if (!width || !height) return { ok: false, reason: 'Canvas empty' };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, reason: 'Canvas context unavailable' };

    let nonWhite = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const step = 4;
    try {
      const imageData = ctx.getImageData(0, 0, width, height).data;
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const idx = (y * width + x) * 4;
          const r = imageData[idx], g = imageData[idx + 1], b = imageData[idx + 2], a = imageData[idx + 3];
          if (a > 16 && (r < 250 || g < 250 || b < 250)) {
            nonWhite++;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
    } catch (e) {
      return { ok: false, reason: 'Unable to read canvas pixels' };
    }

    if (nonWhite === 0) return { ok: false, reason: 'Drawing is empty' };

    const bboxW = isFinite(minX) ? (maxX - minX + 1) : 0;
    const bboxH = isFinite(minY) ? (maxY - minY + 1) : 0;

    const ok = nonWhite >= 200 || (bboxW >= 16 && bboxH >= 16);
    return ok ? { ok: true } : { ok: false, reason: 'Drawing is too small or sparse' };
  }

  async function handleSave() {
    if (!currentChar) return;

    const v = validateDrawing();
    if (!v.ok) {
      setInvalidMsg(v.reason || 'Please draw the character before saving');
      setTimeout(() => setInvalidMsg(''), 1800);
      return;
    }

    const blob = await getImageBlob();
    const sid = sessionConfig.sessionId || 'S01';
    const clientSampleId = createClientSampleId();
    const { filename, sampleNumber } = await generateFilename({ characterId: currentChar.id, contributorId: sessionConfig.contributorId, sessionId: sid });
    const sampleRecord = await saveSample({
      clientSampleId,
      characterId: currentChar.id,
      character: currentChar.char,
      contributorName: sessionConfig.name,
      contributorId: sessionConfig.contributorId,
      sessionId: sid,
      mode: sessionConfig.mode,
      sampleNumber,
      filename,
      timestamp: new Date().toISOString(),
      imageBlob: blob,
    });
    await queueSampleUpload(sampleRecord as any, blob);
    await schedulerService.recordCharacterOutcome(sessionConfig, currentChar, 'completed');
    try { window.dispatchEvent(new CustomEvent('lipy:samples-updated')); } catch (e) { }
    clearCanvas();
    if (sessionConfig.mode === 'mixed-random') {
      transitionTo(async () => {
        const nextCharacter = await schedulerService.getNextCharacter(sessionConfig);
        setCurrentChar(nextCharacter || odiaCharacters[0]);
      });
    }
  }

  async function handleSkip() {
    if (!currentChar) return;

    await schedulerService.recordCharacterOutcome(sessionConfig, currentChar, 'skipped');
    clearCanvas();
    if (sessionConfig.mode === 'mixed-random') {
      transitionTo(async () => {
        const nextCharacter = await schedulerService.getNextCharacter(sessionConfig);
        setCurrentChar(nextCharacter || odiaCharacters[0]);
      });
    }
  }

  async function handleSwitchToMixedRandom() {
    const nextSessionConfig = { ...(sessionConfig || {}), mode: 'mixed-random' };
    try { onSessionConfigChange && onSessionConfigChange(nextSessionConfig); } catch (e) { }
    try { window.dispatchEvent(new CustomEvent('lipy:scheduler-state-changed')); } catch (e) { }
    transitionTo(async () => {
      const nextCharacter = await schedulerService.getNextCharacter(nextSessionConfig);
      setCurrentChar(nextCharacter || odiaCharacters[0]);
    });
  }

  return (
    <div className="flex flex-col items-center justify-center pt-0 lg:pt-4 w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[480px] mx-auto flex-1 min-h-0">
      <div className="w-full flex flex-col my-auto">
        <div className="relative w-full aspect-square rounded-3xl border-2 border-verdigris-200 dark:border-verdigris-800 bg-white dark:bg-verdigris-950 overflow-hidden shadow-sm flex items-center justify-center group touch-none mb-3 lg:mb-6">
          <canvas ref={canvasRef} className="block h-full w-full touch-none" />

          {/* Target Character Overlay */}
          <div className={`absolute top-3 left-3 lg:top-4 lg:left-4 z-10 flex flex-col items-center justify-center rounded-xl bg-verdigris-100/85 dark:bg-verdigris-800/85 border border-verdigris-200/55 dark:border-verdigris-700/55 shadow-sm p-1.5 w-14 h-14 lg:w-20 lg:h-20 pointer-events-none backdrop-blur-md transition-opacity duration-150 ${animating ? 'opacity-0' : 'opacity-100'}`}>
            <span className="text-3xl lg:text-5xl leading-none text-slate-900 dark:text-white font-bold select-none">
              {currentChar ? currentChar.char : '…'}
            </span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-verdigris-800/90 dark:bg-verdigris-200/90 text-white dark:text-slate-900 text-[7px] lg:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full tracking-widest uppercase shadow-sm whitespace-nowrap">
              {currentChar?.id || 'LOAD'}
            </div>
          </div>

          {strokePreviewWidth != null && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-verdigris-900 dark:bg-white shadow-md opacity-30 transition-all duration-75"
              style={{ width: Math.max(10, strokePreviewWidth * 1.2), height: Math.max(10, strokePreviewWidth * 1.2) }}
            />
          )}

          {!canvasRef.current && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 dark:text-slate-700 font-medium">
              Draw character here
            </div>
          )}

          <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200" ref={strokeWrapperRef}>
            <button
             onClick={() => setShowStrokePanel(p => !p)}
              className="flex items-center justify-center h-8 w-8 lg:h-11 lg:w-11 rounded-full bg-white/90 dark:bg-verdigris-900/90 border border-verdigris-200 dark:border-verdigris-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-verdigris-900/10"
              aria-label="Stroke width"
              title="Stroke width"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 7h14" strokeWidth="1.5" />
                  <path d="M5 12h14" strokeWidth="3" />
                  <path d="M5 17h14" strokeWidth="5" />
              </svg>
            </button>
            {showStrokePanel && (
              <div className="absolute right-0 mt-2 lg:mt-3 w-[180px] lg:w-[220px] rounded-xl lg:rounded-2xl border border-verdigris-200 dark:border-verdigris-700 bg-white dark:bg-verdigris-900 p-3 lg:p-5 shadow-2xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 lg:mb-4">Set Stroke Width</div>
                <div className="flex items-center gap-3 lg:gap-4">
                  <input
                    type="range"
                    min="4"
                    max="32"
                    step="1"
                    value={strokeWidth}
                    onChange={(e) => handleStrokeChange((e.target as HTMLInputElement).value)}
                    onInput={(e) => handleStrokeChange((e.target as HTMLInputElement).value)}
                    onPointerUp={clearStrokePreview}
                    onBlur={clearStrokePreview}
                    className="w-full accent-verdigris-600 dark:accent-verdigris-400"
                  />
                  <span className="text-xs font-bold w-6 text-right text-slate-900 dark:text-white">{strokeWidth}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-2 lg:gap-3">
          {sessionConfig && sessionConfig.mode === 'single-character' ? (
            <button className="rounded-xl border border-verdigris-900/10 dark:border-verdigris-700/20 bg-white/80 dark:bg-verdigris-950/40 py-3 lg:py-3.5 text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-verdigris-50 dark:hover:bg-verdigris-900/50 hover:text-slate-900 dark:hover:text-white transition active:scale-95 flex items-center justify-center gap-1.5" onClick={handleSwitchToMixedRandom}>
              <Shuffle className="h-3.5 w-3.5 shrink-0" />
              <span>Random</span>
            </button>
          ) : (
            <button className="rounded-xl border border-verdigris-900/10 dark:border-verdigris-700/20 bg-white/80 dark:bg-verdigris-950/40 py-3 lg:py-3.5 text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-verdigris-50 dark:hover:bg-verdigris-900/50 hover:text-slate-900 dark:hover:text-white transition active:scale-95 flex items-center justify-center gap-1.5" onClick={clearCanvas}>
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>Clear</span>
            </button>
          )}

          {sessionConfig && sessionConfig.mode === 'single-character' ? (
            <button className="rounded-xl border border-verdigris-900/10 dark:border-verdigris-700/20 bg-white/80 dark:bg-verdigris-950/40 py-3 lg:py-3.5 text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-verdigris-50 dark:hover:bg-verdigris-900/50 hover:text-slate-900 dark:hover:text-white transition active:scale-95 flex items-center justify-center gap-1.5" onClick={clearCanvas}>
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>Clear</span>
            </button>
          ) : (
            <button id="skip-btn" className="rounded-xl border border-verdigris-900/10 dark:border-verdigris-700/20 bg-white/80 dark:bg-verdigris-950/40 py-3 lg:py-3.5 text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-verdigris-50 dark:hover:bg-verdigris-900/50 hover:text-slate-900 dark:hover:text-white transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50" onClick={handleSkip} disabled={!currentChar || animating}>
              <SkipForward className="h-3.5 w-3.5 shrink-0" />
              <span>Skip</span>
            </button>
          )}

          <button id="save-next-btn" className="rounded-xl bg-gradient-to-r from-verdigris-600 to-verdigris-700 hover:from-verdigris-700 hover:to-verdigris-800 dark:from-verdigris-500 dark:to-verdigris-600 dark:hover:from-verdigris-600 dark:hover:to-verdigris-700 py-3 lg:py-3.5 text-xs lg:text-sm font-semibold text-white transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm border border-verdigris-600/10" onClick={handleSave} disabled={!currentChar || animating}>
            <Check className="h-4 w-4 shrink-0" />
            <span>{sessionConfig && sessionConfig.mode === 'single-character' ? 'Save' : 'Save & Next'}</span>
          </button>
        </div>

        {/* Compact stats */}
        <div className="flex flex-col items-center justify-center pt-3 lg:pt-4 gap-2">
          <div className="flex items-center gap-1 w-full max-w-[160px] h-1 bg-verdigris-100 dark:bg-verdigris-800 rounded-full overflow-hidden">
             <div className="h-full bg-verdigris-600 dark:bg-verdigris-400 rounded-full" style={{ width: `${Math.min(100, completed % 100)}%` }} />
          </div>
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
            <span>Done: <span className="text-slate-900 dark:text-white">{completed}</span></span>
            <span className="opacity-40">•</span>
            <span>Skipped: <span className="text-slate-900 dark:text-white">{skipped}</span></span>

            {syncState.lastError ? (
              <>
                <span className="opacity-40">•</span>
                <span className="text-red-500" title={syncState.lastError}>Sync error</span>
              </>
            ) : (!syncState.online && !syncState.syncing) ? (
              <>
                <span className="opacity-40">•</span>
                <span className="text-amber-600">Offline</span>
              </>
            ) : null}
          </div>
        </div>

        {invalidMsg && (
          <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-4">
            <div className="rounded-2xl bg-verdigris-900 dark:bg-verdigris-100 px-6 py-3 text-sm font-bold text-white dark:text-slate-900 shadow-xl">
              {invalidMsg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

