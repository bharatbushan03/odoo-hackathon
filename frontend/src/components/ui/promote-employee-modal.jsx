import { useEffect, useId, useRef } from 'react';
import './promote-employee-modal.css';

const ELEVATED_ROLES = [
  { value: 'department-head', label: 'Department Head' },
  { value: 'asset-manager', label: 'Asset Manager' },
];

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="promote-modal__warning-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export default function PromoteEmployeeModal({
  isOpen,
  employee,
  currentRole,
  newRole,
  onNewRoleChange,
  onClose,
  onConfirm,
}) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!newRole) return;
    onConfirm(newRole);
  };

  return (
    <div
      className="promote-modal__backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="promote-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
      >
        <header className="promote-modal__header">
          <div className="promote-modal__title-group">
            <h2 id={titleId} className="promote-modal__title">
              Promote Employee
            </h2>
            <p id={descId} className="promote-modal__subtitle">
              {employee.name} · {employee.department}
            </p>
          </div>
          <button
            type="button"
            className="promote-modal__close"
            onClick={onClose}
            aria-label="Close promotion dialog"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="promote-modal__body">
          <div className="promote-modal__role-flow">
            <div className="promote-modal__role-block">
              <span className="promote-modal__label" id={`${titleId}-current`}>
                Current Role
              </span>
              <div
                className="promote-modal__current-role"
                aria-labelledby={`${titleId}-current`}
              >
                {currentRole}
              </div>
            </div>

            <div className="promote-modal__arrow" aria-hidden="true">
              <ArrowDownIcon />
            </div>

            <div className="promote-modal__role-block">
              <label className="promote-modal__label" htmlFor={`${titleId}-new-role`}>
                New Role
              </label>
              <select
                id={`${titleId}-new-role`}
                className="promote-modal__select"
                value={newRole}
                onChange={(e) => onNewRoleChange(e.target.value)}
              >
                <option value="" disabled>
                  Select elevated role
                </option>
                {ELEVATED_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="promote-modal__warning" role="note">
            <WarningIcon />
            <p className="promote-modal__warning-text">
              Only administrators can assign elevated roles.
            </p>
          </div>
        </div>

        <footer className="promote-modal__footer">
          <button
            type="button"
            className="promote-modal__btn promote-modal__btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="promote-modal__btn promote-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={!newRole}
          >
            Confirm Promotion
          </button>
        </footer>
      </div>
    </div>
  );
}
