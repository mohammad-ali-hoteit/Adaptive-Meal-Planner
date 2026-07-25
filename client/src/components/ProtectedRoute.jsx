import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, skipOnboardingCheck = false }) => {
  const { user, loading } = useAuth();

  // Show nothing while initial auth check is running
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--color-bg, #FAF8F3)'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not onboarded → redirect to onboarding
  // (skip this check for the onboarding page itself)
  if (!skipOnboardingCheck && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
