import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, pending: 0, inventory: 0, lowStock: 0 });
  const [storeCount, setStoreCount] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, inventoryRes, storesRes] = await Promise.all([
          api.get('/orders', { params: { limit: 1 } }),
          api.get('/inventory', { params: { limit: 1 } }),
          api.get('/stores'),
        ]);

        const pendingRes = await api.get('/orders', { params: { status: 'PENDING', limit: 1 } });

        setStats({
          orders: ordersRes.data.meta.total,
          pending: pendingRes.data.meta.total,
          inventory: inventoryRes.data.meta.total,
          lowStock: 0,
        });

        setStoreCount(storesRes.data.data.filter((s) => s.isActive).length);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      {storeCount === 0 && (
        <div className="card" style={{ background: 'var(--primary, #4f46e5)', color: '#fff', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Welcome! Let's get started</h3>
          <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
            Connect your first WooCommerce store to start syncing orders and managing inventory.
          </p>
          <Link to="/settings" className="btn" style={{ background: '#fff', color: 'var(--primary, #4f46e5)' }}>
            Connect a Store
          </Link>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Orders</div>
          <div className="value">{stats.orders}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pending Orders</div>
          <div className="value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="label">Products</div>
          <div className="value">{stats.inventory}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low Stock Alerts</div>
          <div className="value" style={{ color: 'var(--danger)' }}>{stats.lowStock}</div>
        </div>
      </div>
    </div>
  );
}
