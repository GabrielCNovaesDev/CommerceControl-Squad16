import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/layout/PrivateRoute';

import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

import StoresDashboardPage from './pages/StoresDashboardPage';
import RoundConfigPage from './pages/RoundConfigPage';
import ResultsPage from './pages/ResultsPage';
import RankingPage from './pages/RankingPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import RoundsManagementPage from './pages/RoundsManagementPage';
import SquadsManagementPage from './pages/SquadsManagementPage';
import ProductsManagementPage from './pages/ProductsManagementPage';
import AdminResultsPage from './pages/AdminResultsPage';

export default function App() {
  return (
    <BrowserRouter>
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

        {/* Qualquer rota inexistente → /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
