import { useState } from 'react';
import '../../styles/assetflow-theme.css';

const FILTERS = ['All', 'Alerts', 'Approvals', 'Bookings'];

const NOTIFICATIONS = [
  { type: 'allocation', text: 'Laptop AF-0274 assigned to Priya Shah', time: '3m ago' },
  { type: 'alert', text: 'Overdue return — AF-0121 was due 5 days ago', time: '1d ago' },
  { type: 'booking', text: 'Booking confirmed — Room 201, 10:00–11:30', time: '2h ago' },
  { type: 'approval', text: 'Transfer request approved — AF-0114', time: '4h ago' },
  { type: 'alert', text: 'Maintenance overdue — AF-0062 Projector', time: '6h ago' },
  { type: 'allocation', text: 'Monitor AF-0088 returned to pool', time: '1d ago' },
  { type: 'booking', text: 'Booking cancelled — Room 302', time: '2d ago' },
  { type: 'approval', text: 'Maintenance request approved — AF-0031', time: '3d ago' },
];

const TYPE_ICON = { allocation: '→', alert: '⚠', booking: '📅', approval: '✓' };

export default function NotificationsPage() {
  const [filter, setFilter] = useState('All');

  const filtered = NOTIFICATIONS.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Alerts') return n.type === 'alert';
    if (filter === 'Approvals') return n.type === 'approval';
    if (filter === 'Bookings') return n.type === 'booking';
    return true;
  });

  return (
    <div className="af-page">
      <header className="af-page__header">
        <h1 className="af-page__title">Activity Logs &amp; Notifications</h1>
        <p className="af-page__subtitle">System events, alerts, and approvals</p>
      </header>

      <div className="af-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`af-tab${filter === f ? ' af-tab--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="af-card">
        <ul className="af-list">
          {filtered.map((n, i) => (
            <li key={i} className="af-list__item">
              <span style={{ width: '20px', textAlign: 'center', flexShrink: 0 }}>
                {TYPE_ICON[n.type]}
              </span>
              <span style={{ flex: 1 }}>
                <strong>{n.text}</strong>
              </span>
              <span style={{ color: 'var(--af-text-dim)', fontSize: '11px', flexShrink: 0 }}>
                {n.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
