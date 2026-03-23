'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type BacTheme = 'enterprise' | 'consumer';
type ThemePreference = BacTheme | 'system';

const STORAGE_KEY = 'bac-theme-preference';

interface ThemeContextValue {
  /** The resolved theme currently applied (never 'system'). */
  theme: BacTheme;
  /** The user's raw preference, which may be 'system'. */
  preference: ThemePreference;
  /** Set the theme preference. Pass 'system' to follow OS preference. */
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveSystemTheme(): BacTheme {
  if (typeof window === 'undefined') {
    return 'enterprise';
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'consumer'
    : 'enterprise';
}

function resolveTheme(preference: ThemePreference): BacTheme {
  if (preference === 'system') {
    return resolveSystemTheme();
  }
  return preference;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'enterprise' || stored === 'consumer' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }

  return 'system';
}

function persistPreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // localStorage unavailable
  }
}

function applyThemeAttribute(theme: BacTheme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-bac-theme', theme);
  }
}

export function ThemeProvider({
  children,
  defaultPreference,
}: {
  children: ReactNode;
  defaultPreference?: ThemePreference;
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => defaultPreference ?? readStoredPreference(),
  );
  const [theme, setTheme] = useState<BacTheme>(() => resolveTheme(preference));

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    persistPreference(next);
    const resolved = resolveTheme(next);
    setTheme(resolved);
    applyThemeAttribute(resolved);
  }, []);

  // Listen for system preference changes when user chose 'system'.
  useEffect(() => {
    if (preference !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

    const handler = () => {
      const resolved = resolveSystemTheme();
      setTheme(resolved);
      applyThemeAttribute(resolved);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [preference]);

  // Apply theme attribute on mount.
  useEffect(() => {
    applyThemeAttribute(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference }),
    [theme, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to read the current theme and preference. Must be used within ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * A ready-to-use toggle button that cycles between enterprise, consumer, and system themes.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  const cycle = useCallback(() => {
    const order: ThemePreference[] = ['enterprise', 'consumer', 'system'];
    const currentIndex = order.indexOf(preference);
    const nextIndex = (currentIndex + 1) % order.length;
    setPreference(order[nextIndex]!);
  }, [preference, setPreference]);

  const label =
    preference === 'system'
      ? 'System'
      : preference === 'enterprise'
        ? 'Enterprise'
        : 'Consumer';

  return (
    <button
      type="button"
      onClick={cycle}
      className={[
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Current theme: ${label}. Click to switch.`}
    >
      <span
        className={[
          'h-2 w-2 rounded-full',
          preference === 'enterprise'
            ? 'bg-cyan-400'
            : preference === 'consumer'
              ? 'bg-violet-400'
              : 'bg-slate-400',
        ].join(' ')}
      />
      {label}
    </button>
  );
}
