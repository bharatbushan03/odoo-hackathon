import { useState } from 'react';
import PageTopBar from '../../components/layout/page-topbar.jsx';
import '../../styles/assetflow-theme.css';

const ASSETS = [
  { id: 'AF-0114', label: 'AF-0114 — Dell Laptop', holder: 'Priya Shah', dept: 'Engineering' },
  { id: 'AF-0012', label: 'AF-0012 — Dell Laptop', holder: 'David Kim', dept: 'Engineering' },
  { id: 'AF-0062', label: 'AF-0062 — Epson Projector', holder: 'Pool', dept: '—' },
];

const HISTORY = [
  { date: '2026-03-01', from: 'Pool', to: 'Priya Shah', reason: 'New hire onboarding' },
  { date: '2025-11-15', from: 'James Wilson', to: 'Pool', reason: 'Return — role change' },
  { date: '2025-08-02', from: 'Pool', to: 'James Wilson', reason: 'Department transfer' },
];

export default function AllocationPage() {
  const [assetId, setAssetId] = useState('AF-0114');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');

  const asset = ASSETS.find((a) => a.id === assetId) || ASSETS[0];
  const isAllocated = asset.holder !== 'Pool';

  return (
    <div className="af-page">
      <PageTopBar />

      <header className="af-page__header">
        <h1 className="af-page__title">Allocation &amp; Transfer</h1>
      </header>

      <div className="af-form-group" style={{ maxWidth: '400px' }}>
        <label className="af-label" htmlFor="asset-select">Asset</label>
        <select
          id="asset-select"
          className="af-select"
          style={{ width: '100%' }}
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
        >
          {ASSETS.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>

      {isAllocated && (
        <div className="af-alert af-alert--danger" role="alert">
          Already allocated to <strong>{asset.holder}</strong> ({asset.dept}). Direct reallocation is blocked — submit a transfer request below.
        </div>
      )}

      <div className="af-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="af-form-group">
          <label className="af-label">From</label>
          <input className="af-input" value={`${asset.holder} — ${asset.dept}`} readOnly />
        </div>
        <div className="af-form-group">
          <label className="af-label" htmlFor="transfer-to">To</label>
          <select id="transfer-to" className="af-select" style={{ width: '100%' }} value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Select Employee...</option>
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
              <strong>{h.date}</strong> — {h.from} → {h.to}
              <br />
              <span style={{ color: 'var(--af-text-dim)' }}>{h.reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
