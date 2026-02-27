import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, pending: 0, inventory: 0, lowStock: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, inventoryRes] = await Promise.all([
          api.get('/orders', { params: { limit: 1 } }),
          api.get('/inventory', { params: { limit: 1 } }),
        ]);

        const pendingRes = await api.get('/orders', { params: { status: 'PENDING', limit: 1 } });

        setStats({
          orders: ordersRes.data.meta.total,
          pending: pendingRes.data.meta.total,
          inventory: inventoryRes.data.meta.total,
          lowStock: 0,
        });
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

      <div className="card">
        <h3 style={{ marginBottom: '0.5rem' }}>Getting Started</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Connect your WooCommerce store in Settings to start syncing orders and products.
        </p>
      </div>
    </div>
  );
}
