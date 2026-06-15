import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemePreference = 'system' | 'light' | 'dark';
type ThemeResolved = 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  systemTheme: ThemeResolved;
  isDark: boolean;
  resolvedTheme: ThemeResolved;
  hydrated: boolean;
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

function isDarkFromPreference(preference: ThemePreference, systemTheme: ThemeResolved): boolean {
  return resolveTheme(preference, systemTheme) === 'dark';
}

// Read persisted preference from localStorage directly to avoid hydration mismatch
function getPersistedPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';

  try {
    const stored = localStorage.getItem('simulador-theme');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.preference) {
        return parsed.state.preference;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return 'system';
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      // Read persisted preference BEFORE creating initial state
      const persistedPreference = getPersistedPreference();
      const systemTheme = getSystemTheme();
      const resolvedTheme = resolveTheme(persistedPreference, systemTheme);

      return {
        preference: persistedPreference,
        systemTheme,
        resolvedTheme,
        isDark: resolvedTheme === 'dark',
        hydrated: false,

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
            // Only recalculate isDark when preference is 'system'
            // Otherwise, respect the user's explicit choice
            if (state.preference !== 'system') {
              return { systemTheme };
            }
            const resolved = resolveTheme(state.preference, systemTheme);
            return {
              systemTheme,
              resolvedTheme: resolved,
              isDark: resolved === 'dark',
            };
          }),

        toggle: () => {
          const { preference, systemTheme } = get();

          // If currently on 'system', toggle to opposite of current resolved theme
          // Otherwise, toggle between 'dark' and 'light'
          let nextPreference: ThemePreference;

          if (preference === 'system') {
            // Switch to opposite of current resolved theme
            nextPreference = isDarkFromPreference(preference, systemTheme) ? 'light' : 'dark';
          } else {
            // Toggle between 'dark' and 'light'
            nextPreference = preference === 'dark' ? 'light' : 'dark';
          }

          get().setPreference(nextPreference);
        },
      };
    },
    {
      name: 'simulador-theme',
      version: 2,
      // Mark hydration as complete after state is restored
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
      // Only persist the preference, not derived state
      partialize: (state) => ({ preference: state.preference }),
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as {
          preference?: ThemePreference;
          isDark?: boolean;
        };

        if (state.preference === 'light' || state.preference === 'dark' || state.preference === 'system') {
          return { preference: state.preference };
        }

        // Handle migration from v1 where only isDark was stored
        if (typeof state.isDark === 'boolean') {
          return { preference: state.isDark ? 'dark' : 'light' };
        }

        return { preference: 'system' as ThemePreference };
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    useThemeStore.getState().setSystemTheme(e.matches ? 'dark' : 'light');
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else {
    // Legacy browsers (Safari < 14)
    mediaQuery.addListener(handleChange);
  }
}

export default useThemeStore;
