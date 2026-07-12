import { useMemo, useState } from 'react';
import PageTopBar from '../../components/layout/page-topbar.jsx';
import '../../styles/assetflow-theme.css';

const ASSETS = [
  { tag: 'AF-0012', name: 'Dell Laptop', category: 'IT / Computing', status: 'Allocated', location: 'Bangalore' },
  { tag: 'AF-0042', name: 'Epson Projector', category: 'AV Equipment', status: 'Maintenance', location: 'HQ Floor 2' },
  { tag: 'AF-0114', name: 'MacBook Pro', category: 'IT / Computing', status: 'Allocated', location: 'Mumbai' },
  { tag: 'AF-0189', name: 'Standing Desk', category: 'Furniture', status: 'Available', location: 'HQ Floor 3' },
  { tag: 'AF-0241', name: 'Conference Phone', category: 'AV Equipment', status: 'Available', location: 'Room 201' },
];

const STATUS_CLASS = {
  Allocated: 'af-badge--blue',
  Available: 'af-badge--green',
  Maintenance: 'af-badge--orange',
};

export default function AssetsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ASSETS.filter((a) => {
      const matchSearch = !q || [a.tag, a.name, a.category, a.location].some((v) => v.toLowerCase().includes(q));
      const matchCat = category === 'all' || a.category === category;
      const matchStatus = status === 'all' || a.status === status;
      return matchSearch && matchCat && matchStatus;
    });
  }, [search, category, status]);

  return (
    <div className="af-page">
      <PageTopBar />

      <header className="af-page__header">
        <h1 className="af-page__title">Asset Registration &amp; Directory</h1>
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
          <option value="IT / Computing">IT / Computing</option>
          <option value="AV Equipment">AV Equipment</option>
          <option value="Furniture">Furniture</option>
        </select>
        <select className="af-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Status</option>
          <option value="Available">Available</option>
          <option value="Allocated">Allocated</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <div className="af-spacer" />
        <button type="button" className="af-btn af-btn--primary">+ Register Asset</button>
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
              {filtered.map((a) => (
                <tr key={a.tag}>
                  <td><strong>{a.tag}</strong></td>
                  <td>{a.name}</td>
                  <td>{a.category}</td>
                  <td>
                    <span className={`af-badge ${STATUS_CLASS[a.status] || 'af-badge--muted'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>{a.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
