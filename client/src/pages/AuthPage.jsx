import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import './AuthPage.css';

const CardBackground = ({ view }) => {
  const bgClass = view === 'login' ? 'register' : 'login';
  return (
    <>
      <div className={`card-bg card-bg-1 ${bgClass}`}></div>
      <div className={`card-bg card-bg-2 ${bgClass}`}></div>
    </>
  );
};

const LogoGroup = () => (
  <>
    <img className="logo logo-1" src={logo} alt="NutriPlan" />
    <img className="logo logo-2" src={logo} alt="NutriPlan" />
  </>
);

const PanelContent = () => (
  <>
    <div className="panel-content panel-content-1">
      <h3>Welcome Back!</h3>
      <p>
        Sign in to track your meals, monitor 
        your progress, and stay on top of 
        your nutrition goals.
      </p>
    </div>
    <div className="panel-decor panel-decor-1"></div>

    <div className="panel-content panel-content-2">
      <h3>Join NutriPlan</h3>
      <p>
        Create your personalized meal plan, 
        get smart recommendations, and build 
        healthier eating habits.
      </p>
    </div>
    <div className="panel-decor panel-decor-2"></div>
  </>
);

const LoginForm = ({ view, toggleView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const data = await login(email, password);
      navigate(data.user.isOnboarded ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`form login ${view === 'login' ? 'active' : ''}`}>
      <form onSubmit={handleSubmit}>
        <h2>Sign In</h2>
        <p className="form-subtitle">Enter your credentials to continue</p>
        {error && <div className="form-error">{error}</div>}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
        <span className="toggle-link" onClick={toggleView}>
          Don't have an account? <em>Create one</em>
        </span>
      </form>
    </div>
  );
};

const RegisterForm = ({ view, toggleView }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`form register ${view === 'register' ? 'active' : ''}`}>
      <form onSubmit={handleSubmit}>
        <h2>Get Started</h2>
        <p className="form-subtitle">Create your free account</p>
        {error && <div className="form-error">{error}</div>}
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Create password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'CREATING...' : 'CREATE ACCOUNT'}
        </button>
        <span className="toggle-link" onClick={toggleView}>
          Already have an account? <em>Sign in</em>
        </span>
      </form>
    </div>
  );
};

const AuthPage = () => {
  const [view, setView] = useState('login');
  const toggleView = () => setView(view === 'login' ? 'register' : 'login');

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <CardBackground view={view} />
        <LogoGroup />
        <PanelContent />
        <LoginForm view={view} toggleView={toggleView} />
        <RegisterForm view={view} toggleView={toggleView} />
      </div>
    </section>
  );
};

export default AuthPage;
