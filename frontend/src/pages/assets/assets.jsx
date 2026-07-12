import { useState } from 'react';
import PageTopBar from '../../components/layout/page-topbar.jsx';
import { assetApi } from '../../lib/api.js';
import '../../styles/assetflow-theme.css';

const STATUS_CLASS = {
  Allocated: 'af-badge--blue',
  Available: 'af-badge--green',
  Maintenance: 'af-badge--orange',
  UnderMaintenance: 'af-badge--orange',
  Reserved: 'af-badge--yellow',
  Lost: 'af-badge--red',
  Retired: 'af-badge--muted',
  Disposed: 'af-badge--muted',
};

const CATEGORIES = [
  { value: 'IT / Computing', label: 'IT / Computing' },
  { value: 'AV Equipment', label: 'AV Equipment' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Vehicles', label: 'Vehicles' },
  { value: 'Other', label: 'Other' },
];

export default function AssetsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    assetTag: '',
    serialNumber: '',
    category: '',
    acquisitionDate: '',
    cost: '',
    condition: 'GOOD',
    location: '',
    departmentId: '',
    shared: false,
    bookable: false,
  });
  const [submitError, setSubmitError] = useState('');

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await assetApi.list({ search, category, status });
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await assetApi.create(formData);
      setShowModal(false);
      setFormData({
        name: '',
        assetTag: '',
        serialNumber: '',
        category: '',
        acquisitionDate: '',
        cost: '',
        condition: 'GOOD',
        location: '',
        departmentId: '',
        shared: false,
        bookable: false,
      });
      loadAssets();
    } catch (err) {
      setSubmitError(err.message || 'Failed to register asset');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="af-page">
      <PageTopBar />

      <header className="af-page__header">
        <h1 className="af-page__title">Asset Registration & Directory</h1>
        <p className="af-page__subtitle">Search by tag, serial, or QR code</p>
      </header>

      <div className="af-toolbar">
        <input
          type="search"
          className="af-search"
          placeholder="Search by tag, serial, or QR code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="af-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Category</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select className="af-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Status</option>
          <option value="Available">Available</option>
          <option value="Allocated">Allocated</option>
          <option value="UnderMaintenance">Maintenance</option>
          <option value="Reserved">Reserved</option>
          <option value="Lost">Lost</option>
          <option value="Retired">Retired</option>
          <option value="Disposed">Disposed</option>
        </select>
        <div className="af-spacer" />
        <button type="button" className="af-btn af-btn--primary" onClick={() => setShowModal(true)}>
          + Register Asset
        </button>
      </div>

      <div className="af-card">
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign: 'center'}}>No assets found</td></tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.assetTag}</strong></td>
                    <td>{a.name}</td>
                    <td>{a.category?.name || a.category || '—'}</td>
                    <td>
                      <span className={`af-badge ${STATUS_CLASS[a.status] || 'af-badge--muted'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>{a.location}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="af-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="af-modal" onClick={(e) => e.stopPropagation()}>
            <div className="af-modal__header">
              <h3 className="af-modal__title">Register New Asset</h3>
              <button type="button" className="af-modal__close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="af-modal__body">
              {submitError && <div className="af-alert af-alert--danger" style={{ marginBottom: '16px' }}>{submitError}</div>}
              <div className="af-form-row">
                <div className="af-form-group">
                  <label className="af-label" htmlFor="name">Asset Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="af-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="af-form-group">
                  <label className="af-label" htmlFor="assetTag">Asset Tag *</label>
                  <input
                    type="text"
                    id="assetTag"
                    name="assetTag"
                    className="af-input"
                    value={formData.assetTag}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="af-form-row">
                <div className="af-form-group">
                  <label className="af-label" htmlFor="serialNumber">Serial Number</label>
                  <input
                    type="text"
                    id="serialNumber"
                    name="serialNumber"
                    className="af-input"
                    value={formData.serialNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="af-form-group">
                  <label className="af-label" htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    className="af-select"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="af-form-row">
                <div className="af-form-group">
                  <label className="af-label" htmlFor="acquisitionDate">Acquisition Date *</label>
                  <input
                    type="date"
                    id="acquisitionDate"
                    name="acquisitionDate"
                    className="af-input"
                    value={formData.acquisitionDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="af-form-group">
                  <label className="af-label" htmlFor="cost">Cost *</label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    className="af-input"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="af-form-row">
                <div className="af-form-group">
                  <label className="af-label" htmlFor="condition">Condition</label>
                  <select
                    id="condition"
                    name="condition"
                    className="af-select"
                    value={formData.condition}
                    onChange={handleChange}
                  >
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
                <div className="af-form-group">
                  <label className="af-label" htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="af-input"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="af-form-row">
                <div className="af-form-group">
                  <label className="af-label" htmlFor="departmentId">Department</label>
                  <input
                    type="text"
                    id="departmentId"
                    name="departmentId"
                    className="af-input"
                    value={formData.departmentId}
                    onChange={handleChange}
                    placeholder="Department ID (optional)"
                  />
                </div>
              </div>
              <div className="af-form-row" style={{ alignItems: 'flex-end' }}>
                <label className="af-label af-checkbox">
                  <input
                    type="checkbox"
                    name="shared"
                    checked={formData.shared}
                    onChange={handleChange}
                  />
                  Shared
                </label>
                <label className="af-label af-checkbox">
                  <input
                    type="checkbox"
                    name="bookable"
                    checked={formData.bookable}
                    onChange={handleChange}
                  />
                  Bookable
                </label>
              </div>
              <div className="af-modal__footer">
                <button type="button" className="af-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="af-btn af-btn--primary">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
