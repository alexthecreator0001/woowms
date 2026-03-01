import { Routes, Route, Navigate } from 'react-router-dom';
import DocLayout from './components/DocLayout';
import GettingStarted from './pages/GettingStarted';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Warehouse from './pages/Warehouse';
import Picking from './pages/Picking';
import Shipping from './pages/Shipping';
import Receiving from './pages/Receiving';
import Suppliers from './pages/Suppliers';
import Plugins from './pages/Plugins';
import Search from './pages/Search';

export default function App() {
  return (
    <Routes>
      <Route element={<DocLayout />}>
        <Route index element={<Navigate to="/getting-started" replace />} />
        <Route path="/getting-started" element={<GettingStarted />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/warehouse" element={<Warehouse />} />
        <Route path="/picking" element={<Picking />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/receiving" element={<Receiving />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/plugins" element={<Plugins />} />
        <Route path="/search" element={<Search />} />
      </Route>
    </Routes>
  );
}
