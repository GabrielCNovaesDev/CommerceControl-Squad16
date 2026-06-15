import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/layout/PrivateRoute';
import Toast from './components/ui/Toast';
import useThemeStore from './store/themeStore';
import NotFoundPage from './pages/NotFoundPage';

import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

import StoresDashboardPage from './pages/StoresDashboardPage';
import RoundConfigPage from './pages/RoundConfigPage';
import ResultsPage from './pages/ResultsPage';
import RankingPage from './pages/RankingPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import RoundsManagementPage from './pages/RoundsManagementPage';
import SquadsManagementPage from './pages/SquadsManagementPage';
import UsersManagementPage from './pages/UsersManagementPage';
import ProductsManagementPage from './pages/ProductsManagementPage';
import AdminResultsPage from './pages/AdminResultsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import TutorialsPage from './pages/TutorialsPage';

export default function App() {
  const { isDark, setSystemTheme, hydrated } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Marca quando o componente está montado (após hidratação do localStorage)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Aplica o tema no documento quando isDark ou hydration status mudam
  useEffect(() => {
    // Only apply theme after both component mount AND store hydration
    if (!mounted || !hydrated) return;

    // Clear existing theme classes to avoid conflicts
    document.documentElement.classList.remove('dark', 'light');
    // Apply the new theme class
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark, mounted, hydrated]);

  // Listener para mudanças na preferência do sistema
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    // Ensure state reflects current OS theme on load.
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setSystemTheme]);

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        {/* Redireciona raiz para /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Rotas privadas — PLAYER */}
        <Route
          path="/store"
          element={
            <PrivateRoute allowedRoles={['PLAYER']}>
              <StoresDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/store/round"
          element={
            <PrivateRoute allowedRoles={['PLAYER']}>
              <RoundConfigPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/store/results"
          element={
            <PrivateRoute allowedRoles={['PLAYER']}>
              <ResultsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/ranking"
          element={
            <PrivateRoute allowedRoles={['PLAYER', 'GAME_MASTER']}>
              <RankingPage />
            </PrivateRoute>
          }
        />

        {/* Rotas privadas — GAME_MASTER */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['GAME_MASTER']}>
              <AdminDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/rounds"
          element={
            <PrivateRoute allowedRoles={['GAME_MASTER']}>
              <RoundsManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/squads"
          element={
            <PrivateRoute allowedRoles={['GAME_MASTER']}>
              <SquadsManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['GAME_MASTER']}>
              <UsersManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <PrivateRoute allowedRoles={['GAME_MASTER']}>
              <ProductsManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/results"
          element={
            <PrivateRoute allowedRoles={['GAME_MASTER']}>
              <AdminResultsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute allowedRoles={['GAME_MASTER']}>
              <AdminSettingsPage />
            </PrivateRoute>
          }
        />

        {/* Tutoriais — acessível por PLAYER e GAME_MASTER */}
        <Route
          path="/tutorials"
          element={
            <PrivateRoute allowedRoles={['PLAYER', 'GAME_MASTER']}>
              <TutorialsPage />
            </PrivateRoute>
          }
        />

        {/* Qualquer rota inexistente → página 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
