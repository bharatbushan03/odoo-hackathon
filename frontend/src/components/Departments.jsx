import { useState } from 'react';
import CreateDepartmentModal from './ui/CreateDepartmentModal';
import './Departments.css';

export default function Departments() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="departments-page">
      <header className="departments-header">
        <div>
          <h1 className="departments-title">Departments</h1>
          <p className="departments-subtitle">Manage your organization's departments and hierarchy</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Department
        </button>
      </header>

      <div className="departments-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
        <h3>No departments yet</h3>
        <p>Create your first department to get started organizing your teams.</p>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          Create Department
        </button>
      </div>

      <CreateDepartmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(dept) => {
          console.log('Department created:', dept);
        }}
      />
    </div>
  );
}
