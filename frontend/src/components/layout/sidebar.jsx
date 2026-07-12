import { NavLink } from 'react-router-dom';
import './sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/organization-setup', label: 'Organization setup' },
  { to: '/assets', label: 'Assets' },
  { to: '/allocation', label: 'Allocation & Transfer' },
  { to: '/booking', label: 'Resource Booking' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/audit', label: 'Audit' },
  { to: '/reports', label: 'Reports' },
  { to: '/notifications', label: 'Notifications' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true">AF</div>
        <span className="sidebar__name">AssetFlow</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
