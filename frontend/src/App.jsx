import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/protected-route.jsx';
import AppHeader from './components/layout/app-header.jsx';
import LoginPage from './pages/login/login.jsx';
import SignupPage from './pages/signup/signup.jsx';
import OrganizationSetup from './pages/organization-setup/organization-setup.jsx';
import './app-shell.css';

function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <OrganizationSetup />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
