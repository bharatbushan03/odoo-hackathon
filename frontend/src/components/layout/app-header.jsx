import { useAuth } from '../../context/auth-context.jsx';
import './app-header.css';

export default function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header__user">
        <span className="app-header__avatar" aria-hidden="true">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
        <div className="app-header__info">
          <span className="app-header__name">{user?.name}</span>
          <span className="app-header__role">{user?.role}</span>
        </div>
      </div>
      <button type="button" className="app-header__logout" onClick={logout}>
        Sign out
      </button>
    </header>
  );
}
