import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import './AuthPage.css';

/* =====================================================
   AuthPage — Stitch "Kinetic Gold" Design
   Two-card layout: info card (left) + form card (right)
   with animated swap!
   ===================================================== */

const AuthPage = () => {
  const location = useLocation();
  const initialView = location.pathname === '/register' ? 'register' : 'login';
  const [view, setView] = useState(initialView);

  return (
    <div className="auth-page">
      {/* Background blobs */}
      <svg className="auth-blob-svg" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M42.5,-73.4C54.8,-66.5,64.4,-53.4,72.4,-39.9C80.4,-26.4,86.8,-12.5,85.6,0.9C84.4,14.3,75.6,27.1,65.6,37.3C55.6,47.5,44.4,55.1,31.7,62.1C19,69.1,4.8,75.5,-8.4,73.5C-21.6,71.5,-33.8,61.1,-46.3,50.7C-58.8,40.3,-71.6,29.9,-77.3,16.4C-83,2.9,-81.6,-13.7,-74.6,-28.1C-67.6,-42.5,-55,-54.7,-41.2,-61.2C-27.4,-67.7,-12.4,-68.5,1.9,-71.4C16.2,-74.3,30.2,-80.3,42.5,-73.4Z"
          fill="#F5C518"
          opacity="0.08"
          transform="translate(800 200) scale(2)"
        />
        <path
          d="M37.3,-58.5C48.8,-49.5,58.8,-38.3,64.2,-25C69.6,-11.7,70.4,3.7,66.6,18.1C62.8,32.5,54.4,45.9,42.6,54.2C30.8,62.5,15.4,65.7,0.8,64.5C-13.8,63.3,-27.6,57.7,-38.6,48.5C-49.6,39.3,-57.8,26.5,-62.4,12.5C-67,-1.5,-68,-16.7,-61.4,-29C-54.8,-41.3,-40.6,-50.7,-27.1,-58.4C-13.6,-66.1,-1,-72.1,12.2,-70.5C25.4,-68.9,38.6,-59.7,37.3,-58.5Z"
          fill="#8B7BC8"
          opacity="0.06"
          transform="translate(200 800) scale(2)"
        />
      </svg>

      <div className={`auth-cards-row ${view === 'register' ? 'swapped' : ''}`}>
        {/* ---- INFO CARD (left initially) ---- */}
        <div className="auth-info-card auth-entry">
          <img src={logoImg} alt="NutriSync Logo" className="auth-info-logo-img" />
          <h1 className="auth-info-title">NutriSync</h1>
          <p className="auth-info-desc">
            Your personalized nutrition system — intelligent tracking,
            adaptive planning, and seamless progress all in one place.
          </p>
          <div className="auth-info-features">
            {[
              { icon: '📊', text: 'Smart macro targets' },
              { icon: '📅', text: 'Schedule-aware meal timing' },
              { icon: '📈', text: 'Real-time progress tracking' },
            ].map((f) => (
              <div key={f.text} className="auth-info-feature">
                <span className="auth-info-feature-icon">{f.icon}</span>
                <span className="auth-info-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- FORM CARD (right initially) ---- */}
        <div className="auth-form-card auth-entry" style={{ animationDelay: '0.15s' }}>
          {view === 'login'
            ? <LoginForm onSwitch={() => setView('register')} />
            : <RegisterForm onSwitch={() => setView('login')} />
          }
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   LOGIN FORM
   ===================================================== */
const LoginForm = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Please enter a valid email address (e.g., name@gmail.com).');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      navigate(data.user?.isOnboarded ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-fade-in">
      <div className="auth-form-header">
        <h2 className="auth-form-title">Sign In</h2>
        <p className="auth-form-subtitle">Enter your details to access your dashboard.</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">{error}</div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            className="auth-input"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="login-password"
              className="auth-input auth-input-pw"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {password.length > 0 && (
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPw ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <a href="#" className="auth-forgot-link" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>
        </div>

        {/* Remember me */}
        <div className="auth-remember">
          <input
            id="login-remember"
            type="checkbox"
            className="auth-checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label htmlFor="login-remember" className="auth-remember-label">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
          id="login-submit-btn"
        >
          {loading ? (
            <span className="auth-spinner" />
          ) : (
            <>Sign In <span aria-hidden="true">→</span></>
          )}
        </button>
      </form>

      {/* Switch to register */}
      <p className="auth-switch-text" style={{ marginTop: '24px' }}>
        Don't have an account?{' '}
        <button type="button" className="auth-switch-link" onClick={onSwitch} id="switch-to-register-btn">
          Sign up now
        </button>
      </p>
    </div>
  );
};

/* =====================================================
   REGISTER FORM
   ===================================================== */
const RegisterForm = ({ onSwitch }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      return setError('Please enter your full name.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Please enter a valid email address (e.g., name@gmail.com).');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-fade-in">
      <div className="auth-form-header">
        <h2 className="auth-form-title">Create Account</h2>
        <p className="auth-form-subtitle">Join thousands getting smarter about nutrition.</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">{error}</div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-name">Full Name</label>
          <input
            id="reg-name"
            className="auth-input"
            type="text"
            placeholder="Alex Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        {/* Email */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-email">Email Address</label>
          <input
            id="reg-email"
            className="auth-input"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="reg-password"
              className="auth-input auth-input-pw"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPw ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
          id="register-submit-btn"
        >
          {loading ? (
            <span className="auth-spinner" />
          ) : (
            <>Create Account <span aria-hidden="true">→</span></>
          )}
        </button>
      </form>

      {/* Switch to login */}
      <p className="auth-switch-text" style={{ marginTop: '24px' }}>
        Already have an account?{' '}
        <button type="button" className="auth-switch-link" onClick={onSwitch} id="switch-to-login-btn">
          Sign in
        </button>
      </p>
    </div>
  );
};

export default AuthPage;
