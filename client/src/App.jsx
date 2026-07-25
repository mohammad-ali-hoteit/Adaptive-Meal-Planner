import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/Landing/LandingPage';
import AuthPage from './pages/Auth/AuthPage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';

import './styles/App.css';
import AppShell from './components/Layout/AppShell';
import DashboardPage from './pages/Dashboard/DashboardPage';

import MyMealsPage from './pages/MyMeals/MyMealsPage';
import WeeklyPlanPage from './pages/WeeklyPlan/WeeklyPlanPage';
import ProgressPage from './pages/Progress/ProgressPage';
import HistoryPage from './pages/History/HistoryPage';
import ProfilePage from './pages/Profile/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Onboarding — requires login but skips onboarding check */}
          <Route path="/onboarding" element={
            <ProtectedRoute skipOnboardingCheck>
              <OnboardingPage />
            </ProtectedRoute>
          } />
          
          {/* Protected app routes — requires login + onboarding */}
          <Route element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/my-meals" element={<MyMealsPage />} />
            <Route path="/weekly-plan" element={<WeeklyPlanPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
