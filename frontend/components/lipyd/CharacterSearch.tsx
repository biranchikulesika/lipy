'use client';
import React, { useState, useMemo, useRef } from 'react';
import { odiaCharacters, OdiaCharacter } from '@/lib/lipyd/odiaCharacters';

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
      <div className="relative">
        <input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-verdigris-300 dark:border-verdigris-700 bg-white dark:bg-verdigris-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition focus:border-verdigris-400 dark:focus:border-verdigris-600 focus:ring-2 focus:ring-verdigris-900/5 dark:focus:ring-white/5"
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
        <div className="mt-3 grid grid-cols-3 gap-2">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s);
                setQ('');
              }}
              className="rounded-xl border border-verdigris-900/5 dark:border-white/5 bg-verdigris-500/5 dark:bg-white/5 p-2.5 text-center transition hover:bg-verdigris-500/15 dark:hover:bg-white/10"
              title={`Select ${s.id}`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.char}</div>
              <div className="mt-0.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">{s.id}</div>
            </button>
          ))}
        </div>
      )}
      {onStart && (
        <div className="mt-4">
          <button className="w-full rounded-xl bg-verdigris-900 dark:bg-verdigris-100 px-4 py-3.5 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-verdigris-800 dark:hover:bg-verdigris-200 disabled:opacity-50" onClick={() => onStart()} disabled={!selected}>
            {startLabel}
          </button>
        </div>
      )}
    </div>
  );
}
