'use client';
import React, { useState, useMemo, useRef } from 'react';
import { odiaCharacters, OdiaCharacter } from '@/lib/lipid/odiaCharacters';

export default function CharacterSearch({ onSelect, selected, onStart, startLabel = 'Start Collecting' }: { onSelect: (c: OdiaCharacter | null) => void, selected: OdiaCharacter | null, onStart?: () => void, startLabel?: string }) {
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
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Search Character</div>
      <div className="relative">
        <input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition focus:border-slate-400 dark:focus:border-slate-600 focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/5"
          placeholder="Type CONS_K or paste a character"
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
        <div className="mt-3 grid grid-cols-3 gap-2">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s);
                setQ('');
              }}
              className="rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 p-3 text-center transition hover:bg-slate-100 dark:hover:bg-slate-800"
              title={`Select ${s.id}`}
            >
              <div className="text-3xl text-slate-900 dark:text-white">{s.char}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.id}</div>
            </button>
          ))}
        </div>
      )}
      {onStart && (
        <div className="mt-4">
          <button className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-3.5 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50" onClick={() => onStart()} disabled={!selected}>
            {startLabel}
          </button>
        </div>
      )}
    </div>
  );
}
