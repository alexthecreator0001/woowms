import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/onboarding/VerifyEmail.jsx';
import ConnectStore from './pages/onboarding/ConnectStore.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import Inventory from './pages/Inventory.jsx';
import Warehouse from './pages/Warehouse.jsx';
import Picking from './pages/Picking.jsx';
import Shipping from './pages/Shipping.jsx';
import Receiving from './pages/Receiving.jsx';
import Settings from './pages/Settings.jsx';

function getTokenPayload() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function PrivateRoute({ children }) {
  const payload = getTokenPayload();
  const location = useLocation();

  if (!payload) {
    return <Navigate to="/login" />;
  }

  // If email not verified, redirect to verification (unless already there)
  if (!payload.emailVerified && !location.pathname.startsWith('/onboarding/verify-email')) {
    return <Navigate to="/onboarding/verify-email" />;
  }

  // If email verified but onboarding not completed, redirect to connect store
  if (payload.emailVerified && !payload.onboardingCompleted && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding/connect-store" />;
  }

  return children;
}

function OnboardingRoute({ children }) {
  const payload = getTokenPayload();
  if (!payload) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Onboarding routes */}
      <Route
        path="/onboarding/verify-email"
        element={
          <OnboardingRoute>
            <VerifyEmail />
          </OnboardingRoute>
        }
      />
      <Route
        path="/onboarding/connect-store"
        element={
          <OnboardingRoute>
            <ConnectStore />
          </OnboardingRoute>
        }
      />

      {/* App routes */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/warehouse" element={<Warehouse />} />
                <Route path="/picking" element={<Picking />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/receiving" element={<Receiving />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
