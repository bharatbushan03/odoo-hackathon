import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context.jsx';
import { authApi } from '../../lib/api.js';
import '../auth/auth-form.css';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setForgotMessage('');
    try {
      const data = await authApi.forgotPassword(forgotEmail || email);
      setForgotMessage(data.message || 'Reset link sent if the email exists.');
    } catch (err) {
      setForgotMessage(err.message || 'Unable to process request.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">AssetFlow — login</h1>

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
            <label className="auth-form__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="auth-form__input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="auth-form__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth-form__forgot">
            <button
              type="button"
              className="auth-form__forgot-link"
              onClick={() => setShowForgot((prev) => !prev)}
            >
              Forgot password?
            </button>
          </div>

          {showForgot && (
            <div className="auth-forgot-panel">
              <p className="auth-forgot-panel__text">
                Enter your email to receive a password reset token.
              </p>
              <input
                type="email"
                className="auth-form__input"
                placeholder="name@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              {forgotMessage && (
                <div className="auth-form__success" role="status">
                  {forgotMessage}
                </div>
              )}
              <button
                type="button"
                className="auth-btn auth-btn--outline"
                onClick={handleForgotPassword}
              >
                Send reset link
              </button>
            </div>
          )}

          <button
            type="submit"
            className="auth-btn auth-btn--primary"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">
          <span>New here?</span>
        </div>

        <div className="auth-info-box">
          Sign up creates an employee account. Admin roles are assigned later.
        </div>

        <Link to="/signup" className="auth-btn auth-btn--outline auth-btn--link">
          Create Account
        </Link>
      </div>
    </div>
  );
}
