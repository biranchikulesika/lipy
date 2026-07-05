'use client';
import React, { useState, useMemo, useRef } from 'react';
import { odiaCharacters, OdiaCharacter } from '@/lib/lipyd/odiaCharacters';

export default function CharacterSearch({ onSelect, selected, onStart, startLabel = 'Start Collecting', onFocusChange }: { onSelect: (c: OdiaCharacter | null) => void, selected: OdiaCharacter | null, onStart?: () => void, startLabel?: string, onFocusChange?: (focused: boolean) => void }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = (str: string) => (str || '').toString().toLowerCase();

  const suggestions = useMemo(() => {
    const query = normalized(q);
    if (!query) return [];

    const scored = odiaCharacters.map((c) => {
      const id = normalized(c.id);
      const ch = normalized(c.char);
      let score = 0;
      if (id === query) score += 100;
      if (id.startsWith(query)) score += 50;
      if (id.includes(query)) score += 30;
      if (ch === query) score += 80;
      if (ch.includes(query)) score += 40;
      if (query.startsWith('cons') && c.type === 'consonant') score += 10;
      return { c, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.c);
  }, [q]);

  const displayValue = q !== '' ? q : (selected ? `${selected.char} ${selected.id}` : '');

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          className="w-full rounded-xl border border-verdigris-300 dark:border-verdigris-700 bg-white dark:bg-verdigris-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-verdigris-400 dark:focus:border-verdigris-600 focus:ring-2 focus:ring-verdigris-900/5 dark:focus:ring-white/5"
          placeholder="Search character (e.g. CONS_K, VOW_A)..."
          aria-label="Search character"
        />
        {(q !== '' || selected) && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              try { onSelect(null); } catch (e) { }
              try { inputRef.current && inputRef.current.focus(); } catch (e) { }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s);
                setQ('');
              }}
              className="rounded-xl border border-verdigris-900/5 dark:border-white/5 bg-verdigris-500/5 dark:bg-white/5 p-2 text-center transition hover:bg-verdigris-500/15 dark:hover:bg-white/10"
              title={`Select ${s.id}`}
            >
              <div className="text-xl font-bold text-slate-900 dark:text-white">{s.char}</div>
              <div className="mt-0.5 text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">{s.id}</div>
            </button>
          ))}
        </div>
      )}
      {onStart && (
        <div className="mt-3">
          <button className="w-full rounded-xl bg-gradient-to-r from-verdigris-600 to-verdigris-700 hover:from-verdigris-700 hover:to-verdigris-800 dark:from-verdigris-500 dark:to-verdigris-600 dark:hover:from-verdigris-600 dark:hover:to-verdigris-700 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow group border border-verdigris-600/10" onClick={() => onStart()} disabled={!selected}>
            <span>{startLabel}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
