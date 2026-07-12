import { useState } from 'react';
import '../../styles/assetflow-theme.css';

const ITEMS = [
  { tag: 'AF-0012', name: 'Dell Laptop', location: 'Desk #12 — Engineering' },
  { tag: 'AF-0045', name: 'Ergonomic Chair', location: 'Desk #08 — Engineering' },
  { tag: 'AF-0078', name: 'Dual Monitor', location: 'Desk #15 — Engineering' },
  { tag: 'AF-0091', name: 'Docking Station', location: 'Desk #03 — Engineering' },
  { tag: 'AF-0114', name: 'MacBook Pro', location: 'Desk #22 — Engineering' },
];

export default function AuditPage() {
  const [statuses, setStatuses] = useState({});

  const setStatus = (tag, status) => {
    setStatuses((prev) => ({ ...prev, [tag]: status }));
  };

  const flagged = Object.values(statuses).filter((s) => s === 'missing' || s === 'damaged').length;

  return (
    <div className="af-page">
      <header className="af-page__header">
        <h1 className="af-page__title">Asset Audit</h1>
        <p className="af-page__subtitle">60 items — Engineering dept — HQ North</p>
      </header>

      <div className="af-card">
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Expected Location</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((item) => (
                <tr key={item.tag}>
                  <td>
                    <strong>{item.tag}</strong>
                    <br />
                    <span style={{ fontSize: '11px' }}>{item.name}</span>
                  </td>
                  <td>{item.location}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`af-btn af-btn--sm${statuses[item.tag] === 'verified' ? ' af-btn--primary' : ''}`}
                        onClick={() => setStatus(item.tag, 'verified')}
                      >
                        Verified
                      </button>
                      <button
                        type="button"
                        className={`af-btn af-btn--sm${statuses[item.tag] === 'missing' ? ' af-btn--danger' : ''}`}
                        onClick={() => setStatus(item.tag, 'missing')}
                      >
                        Missing
                      </button>
                      <button
                        type="button"
                        className={`af-btn af-btn--sm${statuses[item.tag] === 'damaged' ? '' : ''}`}
                        style={statuses[item.tag] === 'damaged' ? { borderColor: 'rgba(251,146,60,0.4)', color: '#fb923c' } : {}}
                        onClick={() => setStatus(item.tag, 'damaged')}
                      >
                        Damaged
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {flagged > 0 && (
        <div className="af-alert af-alert--warning" style={{ marginTop: '20px' }} role="alert">
          {flagged} asset{flagged > 1 ? 's' : ''} flagged — discrepancy report generated automatically
        </div>
      )}

      <div className="af-actions" style={{ marginTop: '16px' }}>
        <button type="button" className="af-btn af-btn--primary">Finalize audit cycle</button>
      </div>
    </div>
  );
}
