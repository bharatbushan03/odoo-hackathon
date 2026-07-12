import React, { useState } from 'react';
import './AssetCategories.css';

// Mock data for asset categories
const mockCategories = [
  {
    id: 1,
    icon: '💻',
    name: 'Computer Hardware',
    description: 'Desktop computers, laptops, monitors, and peripherals',
    assetCount: 45,
    warrantyEnabled: true,
    status: 'Active'
  },
  {
    id: 2,
    icon: '🖨️',
    name: 'Printers & Scanners',
    description: 'Office printers, scanners, and multifunction devices',
    assetCount: 12,
    warrantyEnabled: true,
    status: 'Active'
  },
  {
    id: 3,
    icon: '📱',
    name: 'Mobile Devices',
    description: 'Smartphones, tablets, and mobile accessories',
    assetCount: 78,
    warrantyEnabled: false,
    status: 'Active'
  },
  {
    id: 4,
    icon: '🖥️',
    name: 'Network Equipment',
    description: 'Routers, switches, firewalls, and network accessories',
    assetCount: 23,
    warrantyEnabled: true,
    status: 'Active'
  },
  {
    id: 5,
    icon: '💾',
    name: 'Storage Devices',
    description: 'External hard drives, SSDs, NAS, and storage solutions',
    assetCount: 31,
    warrantyEnabled: true,
    status: 'Inactive'
  }
];

const AssetCategories = () => {
  const [categories, setCategories] = useState(mockCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useSortBy('name'); // Custom hook or state for sort

  // Filter categories based on search and status filter
  const filteredCategories = categories.filter(category => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(category.assetCount).includes(searchTerm);

    const matchesStatus =
      filterStatus === 'All' || category.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Sort categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'assetCount') {
      return a.assetCount - b.assetCount;
    }
    return 0;
  });

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Handle adding a new category (mock)
  const handleAddCategory = () => {
    alert('Add Category functionality would open a form here');
  };

  // Handle editing a category (mock)
  const handleEditCategory = (id) => {
    alert(`Edit Category ${id} functionality would open a form here`);
  };

  // Handle archiving a category (mock)
  const handleArchiveCategory = (id) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, status: 'Archived' } : cat
      )
    );
    alert(`Category ${id} archived`);
  };

  // Handle deleting a category (mock)
  const handleDeleteCategory = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
      alert(`Category ${id} deleted`);
    }
  };

  return (
    <div className="asset-categories-page">
      <div className="asset-categories-header">
        <h1>Asset Category Management</h1>
        <div className="toolbar">
          <div className="toolbar-group">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            <select
              value={filterStatus}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="All">Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="assetCount">Sort by Asset Count</option>
            </select>
            <button onClick={handleAddCategory} className="add-button">
              Add Category
            </button>
          </div>
        </div>
      </div>

      {sortedCategories.length > 0 ? (
        <div className="categories-grid">
          {sortedCategories.map(category => (
            <div key={category.id} className="category-card">
              <div className="card-content">
                <div className="category-icon">{category.icon}</div>
                <h3 className="category-name">{category.name}</h3>
                <p className="category-description">{category.description}</p>
                <div className="category-stats">
                  <span className="stat-item">
                    <span className="stat-label">Assets:</span>
                    <span className="stat-value">{category.assetCount}</span>
                  </span>
                  <span className="stat-item">
                    <span className="stat-label">Warranty:</span>
                    <span className="stat-value">
                      {category.warrantyEnabled ? 'Yes' : 'No'}
                    </span>
                  </span>
                  <span className="stat-item status-item">
                    <span className="stat-label">Status:</span>
                    <span
                      className={`status-pill ${category.status.toLowerCase()}`}
                    >
                      {category.status}
                    </span>
                  </span>
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => handleEditCategory(category.id)}
                    className="action-button edit-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchiveCategory(category.id)}
                    className="action-button archive-btn"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="action-button delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <div className="illustration">📦</div>
          </div>
          <h2>No categories created yet.</h2>
          <p>Create your first asset category to get started.</p>
          <button onClick={handleAddCategory} className="empty-state-button">
            Add Category
          </button>
        </div>
      )}
    </div>
  );
};

export default AssetCategories;

// Custom hook for sort state (simplified for this example)
function useSortBy(initialValue) {
  const [sortBy, setSortBy] = useState(initialValue);
  return [sortBy, setSortBy];
}