import { useMemo, useState } from 'react';
import PromoteEmployeeModal from '../../components/ui/promote-employee-modal.jsx';
import PageTopBar from '../../components/layout/page-topbar.jsx';
import '../../styles/assetflow-theme.css';

const ELEVATED_ROLE_LABELS = {
  'department-head': 'Department Head',
  'asset-manager': 'Asset Manager',
};

const TABS = [
  { id: 'departments', label: 'Departments' },
  { id: 'categories', label: 'Categories' },
  { id: 'employees', label: 'Employees' },
];

const INITIAL = {
  departments: [
    { id: 1, name: 'Engineering', head: 'Sarah Chen', email: 'engineering@company.com', status: 'Active' },
    { id: 2, name: 'Marketing', head: 'Emily Davis', email: 'marketing@company.com', status: 'Active' },
    { id: 3, name: 'Field Ops', head: 'James Wilson', email: 'fieldops@company.com', status: 'Inactive' },
  ],
  categories: [
    { id: 1, name: 'IT / Computing', description: 'Laptops, monitors, peripherals', count: 156, status: 'Active' },
    { id: 2, name: 'AV Equipment', description: 'Projectors, conference phones', count: 42, status: 'Active' },
    { id: 3, name: 'Furniture', description: 'Desks, chairs, storage', count: 89, status: 'Active' },
  ],
  employees: [
    { id: 1, name: 'Sarah Chen', role: 'Department Head', department: 'Engineering', email: 'sarah.chen@company.com', status: 'Active' },
    { id: 2, name: 'Priya Shah', role: 'Software Engineer', department: 'Engineering', email: 'priya.shah@company.com', status: 'Active' },
    { id: 3, name: 'Emily Davis', role: 'Marketing Specialist', department: 'Marketing', email: 'emily.davis@company.com', status: 'Active' },
    { id: 4, name: 'James Wilson', role: 'Operations Manager', department: 'Field Ops', email: 'james.wilson@company.com', status: 'Inactive' },
  ],
};

function StatusToggle({ status, onChange }) {
  return (
    <div className="af-toggle">
      <button
        type="button"
        className={`af-toggle__btn${status === 'Active' ? ' af-toggle__btn--active-green' : ''}`}
        onClick={() => onChange('Active')}
      >
        Active
      </button>
      <button
        type="button"
        className={`af-toggle__btn${status === 'Inactive' ? ' af-toggle__btn--active-muted' : ''}`}
        onClick={() => onChange('Inactive')}
      >
        Inactive
      </button>
    </div>
  );
}

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState('departments');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(INITIAL);
  const [promoteModal, setPromoteModal] = useState({ isOpen: false, employee: null, newRole: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data[activeTab].filter((row) =>
      !q || Object.values(row).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [activeTab, search, data]);

  const updateStatus = (id, status) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((row) => (row.id === id ? { ...row, status } : row)),
    }));
  };

  const handleConfirmPromotion = (roleValue) => {
    const roleLabel = ELEVATED_ROLE_LABELS[roleValue];
    if (!promoteModal.employee || !roleLabel) return;
    setData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === promoteModal.employee.id ? { ...e, role: roleLabel } : e,
      ),
    }));
    setPromoteModal({ isOpen: false, employee: null, newRole: '' });
  };

  return (
    <div className="af-page">
      <PageTopBar />

      <header className="af-page__header">
        <h1 className="af-page__title">Organization Setup</h1>
        <p className="af-page__subtitle">Admin only</p>
      </header>

      <div className="af-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`af-tab${activeTab === tab.id ? ' af-tab--active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setSearch(''); }}
          >
            {tab.label}
          </button>
        ))}
        <button type="button" className="af-tab af-btn--primary" style={{ marginLeft: '4px' }}>
          + Add
        </button>
      </div>

      <div className="af-toolbar">
        <input
          type="search"
          className="af-search"
          placeholder={`Search ${activeTab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="af-card">
        <div className="af-table-wrap">
          {activeTab === 'departments' && (
            <table className="af-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Head</th>
                  <th>Primary Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.head}</td>
                    <td>{row.email}</td>
                    <td>
                      <StatusToggle status={row.status} onChange={(s) => updateStatus(row.id, s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'categories' && (
            <table className="af-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Assets</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.description}</td>
                    <td>{row.count}</td>
                    <td>
                      <StatusToggle status={row.status} onChange={(s) => updateStatus(row.id, s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'employees' && (
            <table className="af-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.role}</td>
                    <td>{row.department}</td>
                    <td>{row.email}</td>
                    <td>
                      <StatusToggle status={row.status} onChange={(s) => updateStatus(row.id, s)} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="af-btn af-btn--sm"
                        onClick={() => setPromoteModal({ isOpen: true, employee: row, newRole: '' })}
                      >
                        Promote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="af-note">
        Adding a department here affects dropdowns in Allocation, Assets, and Reports screens.
      </p>

      <PromoteEmployeeModal
        isOpen={promoteModal.isOpen}
        employee={promoteModal.employee}
        currentRole={promoteModal.employee?.role ?? ''}
        newRole={promoteModal.newRole}
        onNewRoleChange={(value) => setPromoteModal((p) => ({ ...p, newRole: value }))}
        onClose={() => setPromoteModal({ isOpen: false, employee: null, newRole: '' })}
        onConfirm={handleConfirmPromotion}
      />
    </div>
  );
}
