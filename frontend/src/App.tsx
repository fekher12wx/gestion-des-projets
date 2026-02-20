import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import PoiFilesPage from './pages/PoiFilesPage';
import MyAssignmentsPage from './pages/MyAssignmentsPage';
import ClientManagementPage from './pages/ClientManagementPage';
import ProjectManagementPage from './pages/ProjectManagementPage';
import RegionManagementPage from './pages/RegionManagementPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredPermission={{ resource: 'users', action: 'read' }}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/poi-files"
            element={
              <ProtectedRoute>
                <PoiFilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assignments"
            element={
              <ProtectedRoute>
                <MyAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute requiredPermission={{ resource: 'clients', action: 'read' }}>
                <ClientManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute requiredPermission={{ resource: 'projects', action: 'read' }}>
                <ProjectManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/regions"
            element={
              <ProtectedRoute requiredPermission={{ resource: 'regions', action: 'read' }}>
                <RegionManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredPermission={{ resource: 'reports', action: 'read' }}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredPermission={{ resource: 'settings', action: 'read' }}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
