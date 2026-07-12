import { useState } from 'react';
import '../../styles/assetflow-theme.css';

const HISTORY = [
  { date: '2026-03-01', from: 'Pool', to: 'Priya Shah', reason: 'New hire onboarding' },
  { date: '2025-11-15', from: 'James Wilson', to: 'Pool', reason: 'Return — role change' },
  { date: '2025-08-02', from: 'Pool', to: 'James Wilson', reason: 'Department transfer' },
];

export default function AllocationPage() {
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="af-page">
      <header className="af-page__header">
        <h1 className="af-page__title">Allocation &amp; Transfer</h1>
        <p className="af-page__subtitle">AF-0114 — Dell Laptop</p>
      </header>

      <div className="af-alert af-alert--danger" role="alert">
        Already allocated to <strong>Priya Shah</strong> (Engineering). Direct reallocation is blocked — submit a transfer request below.
      </div>

      <div className="af-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="af-form-group">
          <label className="af-label">From</label>
          <input className="af-input" value="Priya Shah — Engineering" readOnly />
        </div>
        <div className="af-form-group">
          <label className="af-label" htmlFor="transfer-to">To</label>
          <select id="transfer-to" className="af-select" style={{ width: '100%' }} value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Select employee...</option>
            <option value="david">David Kim — Engineering</option>
            <option value="emily">Emily Davis — Marketing</option>
            <option value="james">James Wilson — Operations</option>
          </select>
        </div>
        <div className="af-form-group">
          <label className="af-label" htmlFor="transfer-reason">Reason</label>
          <textarea
            id="transfer-reason"
            className="af-textarea"
            placeholder="Describe the reason for this transfer..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <button type="button" className="af-btn af-btn--primary" disabled={!to || !reason.trim()}>
          Submit Request
        </button>
      </div>

      <div className="af-card">
        <div className="af-card__header">Allocation History</div>
        <ul className="af-list">
          {HISTORY.map((h, i) => (
            <li key={i} className="af-list__item">
              <span>
                <strong>{h.date}</strong> — {h.from} → {h.to}
                <br />
                <span style={{ color: 'var(--af-text-dim)' }}>{h.reason}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
