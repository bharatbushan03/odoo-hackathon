import { useState } from 'react';
import PageTopBar from '../../components/layout/page-topbar.jsx';
import '../../styles/assetflow-theme.css';
import { assetApi, bookingApi, maintenanceApi } from '../../lib/api.js';

const STATS = [
  { label: 'Available', value: 108 },
  { label: 'Allocated', value: 56 },
  { label: 'Overdue', value: 9 },
  { label: 'Active Bookings', value: 4 },
  { label: 'Pending Transfers', value: 3 },
  { label: 'Upcoming Returns', value: 10 },
];

const ACTIVITY = [
  'Laptop AF-0714 — allocated to Priya Shah — IT dept',
  'Room 201 — booking confirmed — 10:00–11:30',
  'Maintenance resolved — AF-0062 Projector bulb replaced',
  'Transfer request approved — AF-0114 Dell Laptop',
  'Overdue return flagged — AF-0121 due 5 days ago',
];

const ASSET_CATEGORIES = [
  'IT / Computing',
  'AV Equipment',
  'Furniture',
  'Office Equipment',
  'Networking',
  'Security',
  'Other',
];

const ASSET_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'POOR'];

const RESOURCES = [
  { id: 'room201', name: 'Conference Room 201', type: 'room' },
  { id: 'room301', name: 'Conference Room 301', type: 'room' },
  { id: 'projector1', name: 'Projector AF-0062', type: 'equipment' },
  { id: 'laptop1', name: 'Laptop AF-0012', type: 'equipment' },
];

export default function DashboardPage() {
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const [assetForm, setAssetForm] = useState({
    name: '',
    assetTag: '',
    serialNumber: '',
    category: '',
    condition: 'GOOD',
    location: '',
    acquisitionDate: '',
    cost: '',
  });

  const [bookingForm, setBookingForm] = useState({
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    assetId: '',
    issue: '',
    priority: 'MEDIUM',
    photo: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await assetApi.create(assetForm);
      setSuccess('Asset registered successfully!');
      setAssetForm({ name: '', assetTag: '', serialNumber: '', category: '', condition: 'GOOD', location: '', acquisitionDate: '', cost: '' });
      setShowAssetModal(false);
    } catch (err) {
      setError(err.message || 'Failed to register asset');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await bookingApi.create(bookingForm);
      setSuccess('Resource booked successfully!');
      setBookingForm({ resourceId: '', startTime: '', endTime: '', purpose: '' });
      setShowBookingModal(false);
    } catch (err) {
      setError(err.message || 'Failed to book resource');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await maintenanceApi.create(maintenanceForm);
      setSuccess('Maintenance request raised successfully!');
      setMaintenanceForm({ assetId: '', issue: '', priority: 'MEDIUM', photo: '' });
      setShowMaintenanceModal(false);
    } catch (err) {
      setError(err.message || 'Failed to raise request');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = (setter) => {
    setter(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="af-page">
      <PageTopBar />

      <header className="af-page__header">
        <h1 className="af-page__title">Today&apos;s Overview</h1>
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
        <button type="button" className="af-btn af-btn--primary" onClick={() => setShowAssetModal(true)}>
          + Register asset
        </button>
        <button type="button" className="af-btn" onClick={() => setShowBookingModal(true)}>
          Book resource
        </button>
        <button type="button" className="af-btn" onClick={() => setShowMaintenanceModal(true)}>
          Raise requests
        </button>
      </div>

      <div className="af-card">
        <div className="af-card__header">Recent Activity</div>
        <ul className="af-list">
          {ACTIVITY.map((text, i) => (
            <li key={i} className="af-list__item">{text}</li>
          ))}
        </ul>
      </div>

      {showAssetModal && (
        <div className="af-modal-overlay" onClick={() => handleCloseModal(setShowAssetModal)}>
          <div className="af-modal" onClick={(e) => e.stopPropagation()}>
            <div className="af-modal__header">
              <h3>Register New Asset</h3>
              <button type="button" className="af-modal__close" onClick={() => handleCloseModal(setShowAssetModal)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAssetSubmit} className="af-modal__body">
              {error && <div className="af-alert af-alert--danger">{error}</div>}
              {success && <div className="af-alert af-alert--success">{success}</div>}
              <div className="af-form-group">
                <label className="af-label" htmlFor="asset-name">Asset Name *</label>
                <input
                  id="asset-name"
                  type="text"
                  className="af-input"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="asset-tag">Asset Tag *</label>
                <input
                  id="asset-tag"
                  type="text"
                  className="af-input"
                  value={assetForm.assetTag}
                  onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="serial-number">Serial Number</label>
                <input
                  id="serial-number"
                  type="text"
                  className="af-input"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="asset-category">Category *</label>
                <select
                  id="asset-category"
                  className="af-select"
                  value={assetForm.category}
                  onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {ASSET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="asset-condition">Condition</label>
                <select
                  id="asset-condition"
                  className="af-select"
                  value={assetForm.condition}
                  onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                >
                  {ASSET_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="asset-location">Location *</label>
                <input
                  id="asset-location"
                  type="text"
                  className="af-input"
                  value={assetForm.location}
                  onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="acquisition-date">Acquisition Date *</label>
                <input
                  id="acquisition-date"
                  type="date"
                  className="af-input"
                  value={assetForm.acquisitionDate}
                  onChange={(e) => setAssetForm({ ...assetForm, acquisitionDate: e.target.value })}
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="asset-cost">Cost *</label>
                <input
                  id="asset-cost"
                  type="number"
                  step="0.01"
                  className="af-input"
                  value={assetForm.cost}
                  onChange={(e) => setAssetForm({ ...assetForm, cost: e.target.value })}
                  required
                />
              </div>
              <div className="af-modal__footer">
                <button type="button" className="af-btn" onClick={() => handleCloseModal(setShowAssetModal)}>
                  Cancel
                </button>
                <button type="submit" className="af-btn af-btn--primary" disabled={loading}>
                  {loading ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBookingModal && (
        <div className="af-modal-overlay" onClick={() => handleCloseModal(setShowBookingModal)}>
          <div className="af-modal" onClick={(e) => e.stopPropagation()}>
            <div className="af-modal__header">
              <h3>Book a Resource</h3>
              <button type="button" className="af-modal__close" onClick={() => handleCloseModal(setShowBookingModal)}>
                ×
              </button>
            </div>
            <form onSubmit={handleBookingSubmit} className="af-modal__body">
              {error && <div className="af-alert af-alert--danger">{error}</div>}
              {success && <div className="af-alert af-alert--success">{success}</div>}
              <div className="af-form-group">
                <label className="af-label" htmlFor="booking-resource">Resource *</label>
                <select
                  id="booking-resource"
                  className="af-select"
                  value={bookingForm.resourceId}
                  onChange={(e) => setBookingForm({ ...bookingForm, resourceId: e.target.value })}
                  required
                >
                  <option value="">Select Resource</option>
                  {RESOURCES.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                  ))}
                </select>
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="booking-start">Start Time *</label>
                <input
                  id="booking-start"
                  type="datetime-local"
                  className="af-input"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="booking-end">End Time *</label>
                <input
                  id="booking-end"
                  type="datetime-local"
                  className="af-input"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="booking-purpose">Purpose</label>
                <textarea
                  id="booking-purpose"
                  className="af-textarea"
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  placeholder="Meeting, presentation, etc."
                />
              </div>
              <div className="af-modal__footer">
                <button type="button" className="af-btn" onClick={() => handleCloseModal(setShowBookingModal)}>
                  Cancel
                </button>
                <button type="submit" className="af-btn af-btn--primary" disabled={loading}>
                  {loading ? 'Booking...' : 'Book Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div className="af-modal-overlay" onClick={() => handleCloseModal(setShowMaintenanceModal)}>
          <div className="af-modal" onClick={(e) => e.stopPropagation()}>
            <div className="af-modal__header">
              <h3>Raise Maintenance Request</h3>
              <button type="button" className="af-modal__close" onClick={() => handleCloseModal(setShowMaintenanceModal)}>
                ×
              </button>
            </div>
            <form onSubmit={handleMaintenanceSubmit} className="af-modal__body">
              {error && <div className="af-alert af-alert--danger">{error}</div>}
              {success && <div className="af-alert af-alert--success">{success}</div>}
              <div className="af-form-group">
                <label className="af-label" htmlFor="maintenance-asset">Asset Tag *</label>
                <input
                  id="maintenance-asset"
                  type="text"
                  className="af-input"
                  value={maintenanceForm.assetId}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assetId: e.target.value })}
                  placeholder="Enter asset tag (e.g., AF-0012)"
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="maintenance-issue">Issue Description *</label>
                <textarea
                  id="maintenance-issue"
                  className="af-textarea"
                  value={maintenanceForm.issue}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue: e.target.value })}
                  placeholder="Describe the issue..."
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="maintenance-priority">Priority</label>
                <select
                  id="maintenance-priority"
                  className="af-select"
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="maintenance-photo">Photo (URL)</label>
                <input
                  id="maintenance-photo"
                  type="text"
                  className="af-input"
                  value={maintenanceForm.photo}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, photo: e.target.value })}
                  placeholder="Optional photo URL"
                />
              </div>
              <div className="af-modal__footer">
                <button type="button" className="af-btn" onClick={() => handleCloseModal(setShowMaintenanceModal)}>
                  Cancel
                </button>
                <button type="submit" className="af-btn af-btn--primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}