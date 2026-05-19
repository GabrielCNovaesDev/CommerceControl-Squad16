import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemePreference = 'system' | 'light' | 'dark';
type ThemeResolved = 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  systemTheme: ThemeResolved;
  isDark: boolean;
  resolvedTheme: ThemeResolved;
  setPreference: (preference: ThemePreference) => void;
  setSystemTheme: (systemTheme: ThemeResolved) => void;
  toggle: () => void;
}

function getSystemTheme(): ThemeResolved {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(preference: ThemePreference, systemTheme: ThemeResolved): ThemeResolved {
  if (preference === 'system') return systemTheme;
  return preference;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      systemTheme: getSystemTheme(),
      resolvedTheme: getSystemTheme(),
      isDark: getSystemTheme() === 'dark',
      setPreference: (preference) =>
        set((state) => {
          const resolved = resolveTheme(preference, state.systemTheme);
          return {
            preference,
            resolvedTheme: resolved,
            isDark: resolved === 'dark',
          };
        }),
      setSystemTheme: (systemTheme) =>
        set((state) => {
          const resolved = resolveTheme(state.preference, systemTheme);
          return {
            systemTheme,
            resolvedTheme: resolved,
            isDark: resolved === 'dark',
          };
        }),
      // Keep API compatible with existing layout toggles.
      toggle: () => {
        const nextPreference: ThemePreference = get().isDark ? 'light' : 'dark';
        get().setPreference(nextPreference);
      },
    }),
    {
      name: 'simulador-theme',
      version: 2,
      partialize: (state) => ({ preference: state.preference }),
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as {
          preference?: ThemePreference;
          isDark?: boolean;
        };

        if (state.preference === 'light' || state.preference === 'dark' || state.preference === 'system') {
          return { preference: state.preference };
        }

        if (typeof state.isDark === 'boolean') {
          return { preference: state.isDark ? 'dark' : 'light' };
        }

        return { preference: 'system' as ThemePreference };
      },
    }
  )
);

export default useThemeStore;
