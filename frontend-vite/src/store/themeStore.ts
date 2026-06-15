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

// Função helper para criar estado inicial com base na preferência
function createInitialState(preference: ThemePreference): Pick<ThemeState, 'preference' | 'systemTheme' | 'resolvedTheme' | 'isDark'> {
  const systemTheme = getSystemTheme();
  const resolvedTheme = resolveTheme(preference, systemTheme);
  return {
    preference,
    systemTheme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
  };
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      ...createInitialState('system'),

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

      toggle: () => {
        const nextPreference: ThemePreference = get().isDark ? 'light' : 'dark';
        get().setPreference(nextPreference);
      },
    }),
    {
      name: 'simulador-theme',
      version: 2,
      // Ao recuperar do localStorage, recalculamos isDark baseado na preferência salva
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalcula isDark baseado na preferência restaurada
          const resolved = resolveTheme(state.preference, state.systemTheme);
          state.resolvedTheme = resolved;
          state.isDark = resolved === 'dark';
        }
      },
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
