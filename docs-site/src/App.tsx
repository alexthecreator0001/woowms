import { Routes, Route, Navigate } from 'react-router-dom';
import DocLayout from './components/DocLayout';
import GettingStarted from './pages/GettingStarted';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import WarehouseOverview from './pages/WarehouseOverview';
import WarehouseZones from './pages/WarehouseZones';
import WarehouseFloorPlan from './pages/WarehouseFloorPlan';
import WarehouseBins from './pages/WarehouseBins';
import WarehouseLabels from './pages/WarehouseLabels';
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
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/warehouse" element={<WarehouseOverview />} />
        <Route path="/warehouse/zones" element={<WarehouseZones />} />
        <Route path="/warehouse/floor-plan" element={<WarehouseFloorPlan />} />
        <Route path="/warehouse/bins" element={<WarehouseBins />} />
        <Route path="/warehouse/labels" element={<WarehouseLabels />} />
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
