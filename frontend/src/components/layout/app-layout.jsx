import { Outlet } from 'react-router-dom';
import AppHeader from './app-header.jsx';
import Sidebar from './sidebar.jsx';
import '../../app-shell.css';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <AppHeader />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
