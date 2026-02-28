import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/onboarding/VerifyEmail';
import ConnectStore from './pages/onboarding/ConnectStore';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Inventory from './pages/Inventory';
import ProductDetail from './pages/ProductDetail';
import WarehouseOverview from './pages/WarehouseOverview';
import WarehouseDetail from './pages/WarehouseDetail';
import ZoneDetail from './pages/ZoneDetail';
import WarehouseGuide from './pages/WarehouseGuide';
import Picking from './pages/Picking';
import Shipping from './pages/Shipping';
import Receiving from './pages/Receiving';
import PODetail from './pages/PODetail';
import POCreate from './pages/POCreate';
import Settings from './pages/settings/SettingsPage';
import Docs from './pages/Docs';
import type { TokenPayload } from './types';

function getTokenPayload(): TokenPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const payload = getTokenPayload();
  const location = useLocation();

  if (!payload) {
    return <Navigate to="/login" />;
  }

  // If onboarding not completed, redirect to connect store
  if (!payload.onboardingCompleted && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding/connect-store" />;
  }

  return children;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
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
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/:id" element={<ProductDetail />} />
                <Route path="/warehouse" element={<WarehouseOverview />} />
                <Route path="/warehouse/guide" element={<WarehouseGuide />} />
                <Route path="/warehouse/:warehouseId" element={<WarehouseDetail />} />
                <Route path="/warehouse/:warehouseId/zones/:zoneId" element={<ZoneDetail />} />
                <Route path="/picking" element={<Picking />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/receiving" element={<Receiving />} />
                <Route path="/receiving/new" element={<POCreate />} />
                <Route path="/receiving/:id" element={<PODetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/docs" element={<Docs />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
