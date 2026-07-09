import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

// Public pages
import LandingPage    from './pages/LandingPage';
import AuthPage       from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';

// Protected pages
import DashboardPage  from './pages/DashboardPage';
import HistoryPage    from './pages/HistoryPage';
import ProgressPage   from './pages/ProgressPage';
import SettingsPage   from './pages/SettingsPage';
import ProfilePage    from './pages/ProfilePage';
import TodaysMealsPage from './pages/TodaysMealsPage';
import AddCustomMealPage from './pages/AddCustomMealPage';
import WeeklyPlanPage from './pages/WeeklyPlanPage';

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public (no shell) ── */}
      <Route path="/"          element={<LandingPage />} />
      <Route path="/login"     element={<AuthPage />} />
      <Route path="/register"  element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* ── Protected (with AppShell) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/todays-meals"     element={<TodaysMealsPage />} />
          <Route path="/add-custom-meal"  element={<AddCustomMealPage />} />
          <Route path="/weekly-plan"      element={<WeeklyPlanPage />} />
          <Route path="/progress"         element={<ProgressPage />} />
          <Route path="/history"          element={<HistoryPage />} />
          <Route path="/profile"          element={<ProfilePage />} />
          <Route path="/settings"         element={<SettingsPage />} />
        </Route>
      </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
