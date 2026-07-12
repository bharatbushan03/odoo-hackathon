import { useState } from 'react';
import PageTopBar from '../../components/layout/page-topbar.jsx';
import { reportApi } from '../../lib/api.js';
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

const REPORT_TYPES = [
  { value: 'assets', label: 'Assets Report' },
  { value: 'allocations', label: 'Allocations Report' },
  { value: 'bookings', label: 'Bookings Report' },
  { value: 'maintenance', label: 'Maintenance Report' },
  { value: 'audits', label: 'Audits Report' },
  { value: 'transfers', label: 'Transfers Report' },
  { value: 'utilization', label: 'Utilization Report' },
];

const FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('assets');
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const handleExport = async (e) => {
    e.preventDefault();
    setExporting(true);
    setExportResult(null);

    try {
      const params = { type: reportType, format };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const blob = await reportApi.export(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}-${Date.now()}.${format === 'xlsx' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportResult({ success: true, message: 'Report exported successfully!' });
    } catch (err) {
      setExportResult({ success: false, message: err.message || 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="af-page">
      <PageTopBar />

      <header className="af-page__header">
        <h1 className="af-page__title">Reports & Analytics</h1>
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
                stroke="#4ade80"
                strokeWidth="2"
                points={MAINT_FREQ.map((v, i) => `${i * 25 + 10},${110 - v * 10}`).join(' ')}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="af-grid-2" style={{ marginTop: '20px' }}>
        <div className="af-card" style={{ padding: '16px 18px' }}>
          <div className="af-label">Most Used Assets</div>
          <p style={{ margin: '8px 0 0', color: '#9a9a9a', fontSize: '12px' }}>
            Dell Laptop AF-0012 — 14 allocations<br />
            Projector AF-0062 — 9 bookings
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

      <div className="af-card" style={{ marginTop: '20px', padding: '20px' }}>
        <div className="af-card__header">Export Report</div>
        <form onSubmit={handleExport} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div className="af-form-group" style={{ flex: '1', minWidth: '200px' }}>
            <label className="af-label" htmlFor="report-type">Report Type</label>
            <select
              id="report-type"
              className="af-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="af-form-group" style={{ flex: '1', minWidth: '150px' }}>
            <label className="af-label" htmlFor="export-format">Format</label>
            <select
              id="export-format"
              className="af-select"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="af-form-group" style={{ flex: '1', minWidth: '150px' }}>
            <label className="af-label" htmlFor="start-date">Start Date</label>
            <input
              id="start-date"
              type="date"
              className="af-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="af-form-group" style={{ flex: '1', minWidth: '150px' }}>
            <label className="af-label" htmlFor="end-date">End Date</label>
            <input
              id="end-date"
              type="date"
              className="af-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="af-btn af-btn--primary"
            disabled={exporting}
            style={{ height: '38px' }}
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </form>
        {exportResult && (
          <div className={`af-alert ${exportResult.success ? 'af-alert--success' : 'af-alert--danger'}`} style={{ marginTop: '12px' }} role="alert">
            {exportResult.message}
          </div>
        )}
      </div>
    </div>
  );
}