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

const LogoGroup = () => {
  return (
    <>
      <img className="logo logo-1" src={logo} alt="NutriPlan" />
      <img className="logo logo-2" src={logo} alt="NutriPlan" />
      <span className="tagline tagline-1">Your adaptive meal companion</span>
      <span className="tagline tagline-2">Start your journey today</span>
    </>
  );
};

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
      if (data.user.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`form login ${view === 'login' ? 'active' : ''}`}>
      <form onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>
        <p className="form-subtitle">Sign in to continue</p>
        {error && <div className="form-error">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'SIGNING IN...' : 'LOGIN'}
        </button>
        <a onClick={toggleView}>
          Don't have an account? <em>Register here</em>
        </a>
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
        <h2>Create Account</h2>
        <p className="form-subtitle">Join NutriPlan today</p>
        {error && <div className="form-error">{error}</div>}
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'CREATING...' : 'REGISTER'}
        </button>
        <a onClick={toggleView}>
          Already have an account? <em>Login here</em>
        </a>
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
        <LoginForm view={view} toggleView={toggleView} />
        <RegisterForm view={view} toggleView={toggleView} />
      </div>
    </section>
  );
};

export default AuthPage;
