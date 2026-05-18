'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  size?: 'default' | 'large';
}

export function SearchBar({
  defaultValue = '',
  placeholder = 'Search make, model, city... e.g. Toyota Aqua 2015 Colombo',
  className,
  size = 'default',
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveSuggestion(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 150);
  };

  const handleSubmit = (q: string = query) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', q.trim());
    params.delete('page');
    startTransition(() => router.push(`/search?${params.toString()}`));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0) {
        setQuery(suggestions[activeSuggestion]);
        handleSubmit(suggestions[activeSuggestion]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex items-center gap-2 bg-white border-2 rounded-xl transition-colors',
          'border-[var(--color-border)] focus-within:border-[var(--brand-green)]',
          size === 'large' ? 'px-4 py-3' : 'px-3 py-2',
        )}
      >
        <Search className={cn('text-gray-400 flex-shrink-0', size === 'large' ? 'w-5 h-5' : 'w-4 h-4')} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent outline-none text-[var(--brand-black)] placeholder:text-gray-400',
            size === 'large' ? 'text-base' : 'text-sm',
          )}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => handleSubmit()}
          className={cn(
            'flex-shrink-0 bg-[var(--brand-green)] text-white rounded-lg font-medium hover:bg-[var(--brand-deep)] transition-colors',
            size === 'large' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
          )}
        >
          Search
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setQuery(s); handleSubmit(s); }}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50',
                  i === activeSuggestion && 'bg-gray-50',
                )}
              >
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
