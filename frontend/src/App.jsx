import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/protected-route.jsx';
import AppLayout from './components/layout/app-layout.jsx';
import LoginPage from './pages/login/login.jsx';
import SignupPage from './pages/signup/signup.jsx';
import OrgRegisterPage from './pages/org-register/org-register.jsx';
import DashboardPage from './pages/dashboard/dashboard.jsx';
import OrganizationSetup from './pages/organization-setup/organization-setup.jsx';
import AssetsPage from './pages/assets/assets.jsx';
import AllocationPage from './pages/allocation/allocation.jsx';
import BookingPage from './pages/booking/booking.jsx';
import MaintenancePage from './pages/maintenance/maintenance.jsx';
import AuditPage from './pages/audit/audit.jsx';
import ReportsPage from './pages/reports/reports.jsx';
import NotificationsPage from './pages/notifications/notifications.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/register-org" element={<OrgRegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="organization-setup" element={<OrganizationSetup />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="allocation" element={<AllocationPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
