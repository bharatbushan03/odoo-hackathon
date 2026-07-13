import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context.jsx';
import '../auth/auth-form.css';

export default function OrgRegisterPage() {
  const { signupOrg, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain an uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain a lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain a number.');
      return;
    }

    setSubmitting(true);
    try {
      await signupOrg(orgName, orgCode, name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">AssetFlow register organization</h1>

        <div className="auth-card__logo-wrap">
          <div className="auth-card__logo-circle" aria-hidden="true">AF</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-form__error" role="alert">
              {error}
            </div>
          )}

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="org-name">
              Organization name
            </label>
            <input
              id="org-name"
              type="text"
              className="auth-form__input"
              placeholder="Acme Corporation"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              autoComplete="organization"
              required
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="org-code">
              Organization code
            </label>
            <input
              id="org-code"
              type="text"
              className="auth-form__input"
              placeholder="ACME"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
              autoComplete="organization"
              required
              maxLength={10}
            />
            <p className="auth-form__hint">Short code (2-10 chars), used by employees to join.</p>
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="org-admin-name">
              Your full name
            </label>
            <input
              id="org-admin-name"
              type="text"
              className="auth-form__input"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="org-admin-email">
              Your email
            </label>
            <input
              id="org-admin-email"
              type="email"
              className="auth-form__input"
              placeholder="jane@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="org-admin-password">
              Password
            </label>
            <input
              id="org-admin-password"
              type="password"
              className="auth-form__input"
              placeholder="your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="auth-form__hint">Min 8 chars, upper, lower, number.</p>
          </div>

          <div className="auth-info-box">
            This creates the organization and your admin account.
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn--primary"
            disabled={submitting}
          >
            {submitting ? 'Creating organization...' : 'Create Organization'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an organization code?{' '}
          <Link to="/signup" className="auth-card__link">
            Join as employee
          </Link>
        </p>
      </div>
    </div>
  );
}