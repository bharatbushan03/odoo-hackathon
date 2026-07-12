import '../../styles/assetflow-theme.css';
import './reports.css';

const UTILIZATION = [
  { dept: 'Engineering', pct: 82 },
  { dept: 'Marketing', pct: 54 },
  { dept: 'Operations', pct: 71 },
  { dept: 'Finance', pct: 38 },
  { dept: 'HR', pct: 45 },
];

const MAINT_FREQ = [3, 5, 2, 8, 4, 6, 3, 7, 5, 4, 6, 2];

export default function ReportsPage() {
  return (
    <div className="af-page">
      <header className="af-page__header">
        <h1 className="af-page__title">Reports &amp; Analytics</h1>
        <p className="af-page__subtitle">Utilization, maintenance trends, and asset health</p>
      </header>

      <div className="af-grid-2">
        <div className="af-card reports-chart">
          <div className="af-card__header">Utilization by Department</div>
          <div className="reports-chart__body">
            {UTILIZATION.map((d) => (
              <div key={d.dept} className="bar-row">
                <span className="bar-row__label">{d.dept}</span>
                <div className="bar-row__track">
                  <div className="bar-row__fill" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="bar-row__value">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="af-card reports-chart">
          <div className="af-card__header">Maintenance Frequency</div>
          <div className="reports-chart__body">
            <svg viewBox="0 0 300 120" className="line-chart" aria-hidden="true">
              <polyline
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="2"
                points={MAINT_FREQ.map((v, i) => `${i * 25 + 10},${110 - v * 10}`).join(' ')}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="af-grid-2" style={{ marginTop: '20px' }}>
        <div className="af-card" style={{ padding: '16px 18px' }}>
          <div className="af-label">High Aged Assets</div>
          <p style={{ margin: '8px 0 0', color: '#9a9a9a', fontSize: '12px' }}>
            Power BI Desktop — 36+ months<br />
            Scanner AF-0899 — 28 months
          </p>
        </div>
        <div className="af-card" style={{ padding: '16px 18px' }}>
          <div className="af-label">Idle Assets</div>
          <p style={{ margin: '8px 0 0', color: '#9a9a9a', fontSize: '12px' }}>
            Scanner AF-0899 — unused 120 days<br />
            Projector AF-0033 — unused 90 days
          </p>
        </div>
      </div>

      <div className="af-card" style={{ padding: '16px 18px', marginTop: '20px' }}>
        <div className="af-label">Assets Due for Maintenance / Nearing Retirement</div>
        <p style={{ margin: '8px 0 0', color: '#9a9a9a', fontSize: '12px' }}>
          AF-0062 Epson Projector — maintenance overdue<br />
          AF-0022 Conference Phone — retirement in 3 months
        </p>
      </div>

      <div className="af-actions" style={{ marginTop: '20px' }}>
        <button type="button" className="af-btn af-btn--primary">Export report</button>
      </div>
    </div>
  );
}
