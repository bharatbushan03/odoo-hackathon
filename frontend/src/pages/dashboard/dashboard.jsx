import '../../styles/assetflow-theme.css';

const STATS = [
  { label: 'Available Assets', value: 108 },
  { label: 'Allocated', value: 30 },
  { label: 'In Maintenance', value: 6 },
  { label: 'Active Bookings', value: 4 },
  { label: 'Pending Transfers', value: 3 },
  { label: 'Upcoming Returns', value: 12 },
];

const ACTIVITY = [
  { text: 'Laptop AF-0274 allocated to Priya Shah — Engineering' },
  { text: 'Room 201 booking confirmed — 10:00–11:30' },
  { text: 'Maintenance resolved — AF-0062 Projector bulb replaced' },
  { text: 'Transfer request approved — AF-0114 Dell Laptop' },
  { text: 'Overdue return flagged — AF-0121 due 5 days ago' },
];

export default function DashboardPage() {
  return (
    <div className="af-page">
      <header className="af-page__header">
        <h1 className="af-page__title">Today&apos;s Overview</h1>
        <p className="af-page__subtitle">AssetFlow dashboard — real-time status</p>
      </header>

      <div className="af-stats">
        {STATS.map((s) => (
          <div key={s.label} className="af-stat">
            <span className="af-stat__label">{s.label}</span>
            <span className="af-stat__value">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="af-alert af-alert--warning" role="alert">
        4 assets overdue for return — flagged for follow-up
      </div>

      <div className="af-actions">
        <button type="button" className="af-btn af-btn--primary">+ Register asset</button>
        <button type="button" className="af-btn">Book resource</button>
        <button type="button" className="af-btn">Raise requests</button>
      </div>

      <div className="af-card">
        <div className="af-card__header">Recent Activity</div>
        <ul className="af-list">
          {ACTIVITY.map((item, i) => (
            <li key={i} className="af-list__item">
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
