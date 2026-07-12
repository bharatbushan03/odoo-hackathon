import { useMemo, useState } from 'react';
import PromoteEmployeeModal from '../../components/ui/promote-employee-modal.jsx';
import './organization-setup.css';

const ELEVATED_ROLE_LABELS = {
  'department-head': 'Department Head',
  'asset-manager': 'Asset Manager',
};

const TABS = [
  { id: 'departments', label: 'Departments' },
  { id: 'assetCategories', label: 'Asset Categories' },
  { id: 'employeeDirectory', label: 'Employee Directory' },
];

const INITIAL_DATA = {
  departments: [
    { id: 1, name: 'Engineering', code: 'ENG', head: 'Sarah Chen', employees: 42, status: 'Active' },
    { id: 2, name: 'Finance', code: 'FIN', head: 'Michael Torres', employees: 18, status: 'Active' },
    { id: 3, name: 'Human Resources', code: 'HR', head: 'Priya Sharma', employees: 12, status: 'Active' },
    { id: 4, name: 'Operations', code: 'OPS', head: 'James Wilson', employees: 27, status: 'Active' },
    { id: 5, name: 'Marketing', code: 'MKT', head: 'Emily Davis', employees: 15, status: 'Inactive' },
  ],
  assetCategories: [
    { id: 1, name: 'IT Equipment', code: 'IT-EQ', type: 'Hardware', assets: 156, status: 'Active' },
    { id: 2, name: 'Furniture', code: 'FURN', type: 'Fixed Asset', assets: 89, status: 'Active' },
    { id: 3, name: 'Vehicles', code: 'VEH', type: 'Fleet', assets: 12, status: 'Active' },
    { id: 4, name: 'Software Licenses', code: 'SW-LIC', type: 'Intangible', assets: 234, status: 'Active' },
    { id: 5, name: 'Office Supplies', code: 'OFS', type: 'Consumable', assets: 0, status: 'Inactive' },
  ],
  employeeDirectory: [
    { id: 1, name: 'Sarah Chen', role: 'Engineering Manager', department: 'Engineering', email: 'sarah.chen@company.com', status: 'Active' },
    { id: 2, name: 'Michael Torres', role: 'Finance Director', department: 'Finance', email: 'michael.torres@company.com', status: 'Active' },
    { id: 3, name: 'Priya Sharma', role: 'HR Lead', department: 'Human Resources', email: 'priya.sharma@company.com', status: 'Active' },
    { id: 4, name: 'James Wilson', role: 'Operations Manager', department: 'Operations', email: 'james.wilson@company.com', status: 'Active' },
    { id: 5, name: 'Emily Davis', role: 'Marketing Specialist', department: 'Marketing', email: 'emily.davis@company.com', status: 'On Leave' },
    { id: 6, name: 'David Kim', role: 'Software Engineer', department: 'Engineering', email: 'david.kim@company.com', status: 'Active' },
  ],
};

const FILTER_OPTIONS = {
  departments: [
    { value: 'all', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ],
  assetCategories: [
    { value: 'all', label: 'All Types' },
    { value: 'Hardware', label: 'Hardware' },
    { value: 'Fixed Asset', label: 'Fixed Asset' },
    { value: 'Fleet', label: 'Fleet' },
    { value: 'Intangible', label: 'Intangible' },
    { value: 'Consumable', label: 'Consumable' },
  ],
  employeeDirectory: [
    { value: 'all', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Inactive', label: 'Inactive' },
  ],
};

const ADD_LABELS = {
  departments: 'Add Department',
  assetCategories: 'Add Category',
  employeeDirectory: 'Add Employee',
};

function createInitialTabState() {
  return {
    search: '',
    filter: 'all',
    filterOpen: false,
  };
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function filterItems(items, tabId, search, filter) {
  const query = search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      !query ||
      Object.values(item).some((value) => String(value).toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (filter === 'all') return true;

    if (tabId === 'assetCategories') {
      return item.type === filter;
    }

    return item.status === filter;
  });
}

function DepartmentCard({ item }) {
  return (
    <article className="organization-setup__card">
      <div className="organization-setup__card-header">
        <h3 className="organization-setup__card-title">{item.name}</h3>
        <span className={`organization-setup__badge${item.status !== 'Active' ? ' organization-setup__badge--muted' : ''}`}>
          {item.status}
        </span>
      </div>
      <div className="organization-setup__card-meta">
        <div className="organization-setup__card-row">
          <TagIcon />
          <span>Code: {item.code}</span>
        </div>
        <div className="organization-setup__card-row">
          <UserIcon />
          <span>Head: {item.head}</span>
        </div>
        <div className="organization-setup__card-row">
          <BuildingIcon />
          <span>{item.employees} employees</span>
        </div>
      </div>
    </article>
  );
}

function AssetCategoryCard({ item }) {
  return (
    <article className="organization-setup__card">
      <div className="organization-setup__card-header">
        <h3 className="organization-setup__card-title">{item.name}</h3>
        <span className={`organization-setup__badge${item.status !== 'Active' ? ' organization-setup__badge--muted' : ''}`}>
          {item.type}
        </span>
      </div>
      <div className="organization-setup__card-meta">
        <div className="organization-setup__card-row">
          <TagIcon />
          <span>Code: {item.code}</span>
        </div>
        <div className="organization-setup__card-row">
          <BuildingIcon />
          <span>{item.assets} assets tracked</span>
        </div>
      </div>
    </article>
  );
}

function EmployeeCard({ item, onPromote }) {
  return (
    <article className="organization-setup__card">
      <div className="organization-setup__card-header">
        <h3 className="organization-setup__card-title">{item.name}</h3>
        <span className={`organization-setup__badge${item.status !== 'Active' ? ' organization-setup__badge--muted' : ''}`}>
          {item.status}
        </span>
      </div>
      <div className="organization-setup__card-meta">
        <div className="organization-setup__card-row">
          <UserIcon />
          <span>{item.role}</span>
        </div>
        <div className="organization-setup__card-row">
          <BuildingIcon />
          <span>{item.department}</span>
        </div>
        <div className="organization-setup__card-row">
          <MailIcon />
          <span>{item.email}</span>
        </div>
      </div>
      <div className="organization-setup__card-actions">
        <button
          type="button"
          className="organization-setup__promote-btn"
          onClick={() => onPromote(item)}
          aria-label={`Promote ${item.name}`}
        >
          Promote
        </button>
      </div>
    </article>
  );
}

function TabContent({ tabId, items, onPromoteEmployee }) {
  if (items.length === 0) {
    return (
      <div className="organization-setup__empty">
        <p className="organization-setup__empty-title">No results found</p>
        <p>Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  if (tabId === 'employeeDirectory') {
    return items.map((item) => (
      <EmployeeCard key={item.id} item={item} onPromote={onPromoteEmployee} />
    ));
  }

  const CardComponent = tabId === 'departments' ? DepartmentCard : AssetCategoryCard;
  return items.map((item) => <CardComponent key={item.id} item={item} />);
}

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState('departments');
  const [employees, setEmployees] = useState(INITIAL_DATA.employeeDirectory);
  const [promoteModal, setPromoteModal] = useState({
    isOpen: false,
    employee: null,
    newRole: '',
  });
  const [tabState, setTabState] = useState({
    departments: createInitialTabState(),
    assetCategories: createInitialTabState(),
    employeeDirectory: createInitialTabState(),
  });

  const currentState = tabState[activeTab];

  const activeData = useMemo(
    () => ({
      ...INITIAL_DATA,
      employeeDirectory: employees,
    }),
    [employees],
  );

  const filteredItems = useMemo(
    () => filterItems(activeData[activeTab], activeTab, currentState.search, currentState.filter),
    [activeTab, activeData, currentState.search, currentState.filter],
  );

  const updateTabState = (tabId, updates) => {
    setTabState((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], ...updates },
    }));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setTabState((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], filterOpen: false },
    }));
  };

  const openPromoteModal = (employee) => {
    setPromoteModal({ isOpen: true, employee, newRole: '' });
  };

  const closePromoteModal = () => {
    setPromoteModal({ isOpen: false, employee: null, newRole: '' });
  };

  const handleConfirmPromotion = (roleValue) => {
    const roleLabel = ELEVATED_ROLE_LABELS[roleValue];
    if (!promoteModal.employee || !roleLabel) return;

    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === promoteModal.employee.id
          ? { ...employee, role: roleLabel }
          : employee,
      ),
    );
    closePromoteModal();
  };

  return (
    <div className="organization-setup">
      <header className="organization-setup__header">
        <h1 className="organization-setup__title">Organization Setup</h1>
        <p className="organization-setup__description">
          Manage departments, asset categories, and employee roles.
        </p>
      </header>

      <nav className="organization-setup__tabs" role="tablist" aria-label="Organization sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`organization-setup__tab${activeTab === tab.id ? ' organization-setup__tab--active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        <div className="organization-setup__toolbar">
          <div className="organization-setup__search">
            <span className="organization-setup__search-icon">
              <SearchIcon />
            </span>
            <input
              type="search"
              className="organization-setup__search-input"
              placeholder={`Search ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
              value={currentState.search}
              onChange={(e) => updateTabState(activeTab, { search: e.target.value })}
              aria-label={`Search ${activeTab}`}
            />
          </div>

          <div className="organization-setup__filter-wrap">
            <button
              type="button"
              className={`organization-setup__filter-btn${currentState.filterOpen || currentState.filter !== 'all' ? ' organization-setup__filter-btn--active' : ''}`}
              onClick={() => updateTabState(activeTab, { filterOpen: !currentState.filterOpen })}
              aria-expanded={currentState.filterOpen}
              aria-haspopup="listbox"
            >
              <FilterIcon />
              Filter
              {currentState.filter !== 'all' && (
                <span className="organization-setup__badge" style={{ padding: '1px 6px', fontSize: '10px' }}>
                  1
                </span>
              )}
            </button>

            {currentState.filterOpen && (
              <div className="organization-setup__filter-panel" role="listbox" aria-label="Filter options">
                <label className="organization-setup__filter-label" htmlFor={`filter-${activeTab}`}>
                  {activeTab === 'assetCategories' ? 'Category Type' : 'Status'}
                </label>
                <select
                  id={`filter-${activeTab}`}
                  className="organization-setup__filter-select"
                  value={currentState.filter}
                  onChange={(e) =>
                    updateTabState(activeTab, { filter: e.target.value, filterOpen: false })
                  }
                >
                  {FILTER_OPTIONS[activeTab].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="organization-setup__spacer" />

          <button type="button" className="organization-setup__add-btn">
            <PlusIcon />
            {ADD_LABELS[activeTab]}
          </button>
        </div>

        <p className="organization-setup__results-count">
          Showing {filteredItems.length} of {activeData[activeTab].length} records
        </p>

        <div className="organization-setup__grid">
          <TabContent
            tabId={activeTab}
            items={filteredItems}
            onPromoteEmployee={openPromoteModal}
          />
        </div>
      </div>

      <PromoteEmployeeModal
        isOpen={promoteModal.isOpen}
        employee={promoteModal.employee}
        currentRole={promoteModal.employee?.role ?? ''}
        newRole={promoteModal.newRole}
        onNewRoleChange={(value) =>
          setPromoteModal((prev) => ({ ...prev, newRole: value }))
        }
        onClose={closePromoteModal}
        onConfirm={handleConfirmPromotion}
      />
    </div>
  );
}
