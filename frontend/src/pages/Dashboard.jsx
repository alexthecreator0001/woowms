import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
  ClipboardList,
  Truck,
  PackageOpen,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import api from '../services/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, pending: 0, inventory: 0, lowStock: 0 });
  const [storeCount, setStoreCount] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, inventoryRes, storesRes] = await Promise.all([
          api.get('/orders', { params: { limit: 5 } }),
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

        setRecentOrders(ordersRes.data.data || []);
        setStoreCount(storesRes.data.data.filter((s) => s.isActive).length);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statusColor = (status) => {
    const map = {
      PENDING: '#ff9f0a',
      AWAITING_PICK: '#0071e3',
      PICKING: '#5856d6',
      PICKED: '#af52de',
      PACKING: '#ff9f0a',
      SHIPPED: '#34c759',
      DELIVERED: '#30d158',
      CANCELLED: '#ff3b30',
      ON_HOLD: '#8e8e93',
    };
    return map[status] || '#8e8e93';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{greeting()}</h2>
          <p className="subtitle">Here's what's happening with your warehouse today.</p>
        </div>
      </div>

      {storeCount === 0 && (
        <div className="welcome-banner">
          <h3>Welcome to WooWMS</h3>
          <p>
            Connect your first WooCommerce store to start syncing orders and managing your warehouse inventory.
          </p>
          <Link to="/settings" className="btn">
            <Plus size={16} />
            Connect a Store
          </Link>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <ShoppingCart />
          </div>
          <div className="label">Total Orders</div>
          <div className="value">{loading ? '—' : stats.orders.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">
            <Clock />
          </div>
          <div className="label">Pending Orders</div>
          <div className="value" style={{ color: stats.pending > 0 ? 'var(--warning)' : undefined }}>
            {loading ? '—' : stats.pending.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Package />
          </div>
          <div className="label">Products</div>
          <div className="value">{loading ? '—' : stats.inventory.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <AlertTriangle />
          </div>
          <div className="label">Low Stock Alerts</div>
          <div className="value" style={{ color: stats.lowStock > 0 ? 'var(--danger)' : undefined }}>
            {loading ? '—' : stats.lowStock}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/orders" className="quick-action">
          <div className="qa-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <ShoppingCart />
          </div>
          <span>View Orders</span>
        </Link>
        <Link to="/picking" className="quick-action">
          <div className="qa-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>
            <ClipboardList />
          </div>
          <span>Pick Lists</span>
        </Link>
        <Link to="/shipping" className="quick-action">
          <div className="qa-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <Truck />
          </div>
          <span>Shipping</span>
        </Link>
        <Link to="/receiving" className="quick-action">
          <div className="qa-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <PackageOpen />
          </div>
          <span>Receiving</span>
        </Link>
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="section-header">
            <h3>Recent Orders</h3>
            <Link to="/orders">View all <ArrowRight size={14} style={{ marginLeft: 2, verticalAlign: 'middle' }} /></Link>
          </div>
          <div className="activity-card">
            {recentOrders.length === 0 && !loading ? (
              <div className="empty-state">
                <ShoppingCart />
                <p>No orders yet. Connect a store to get started.</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div className="activity-item" key={order.id}>
                  <span className="activity-dot" style={{ background: statusColor(order.status) }} />
                  <div className="activity-text">
                    <strong>#{order.orderNumber}</strong> — {order.customerName}
                  </div>
                  <span className="badge" style={{
                    background: `${statusColor(order.status)}15`,
                    color: statusColor(order.status),
                  }}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="section-header">
            <h3>Quick Stats</h3>
          </div>
          <div className="activity-card">
            <div className="activity-item">
              <div className="qa-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={18} />
              </div>
              <div className="activity-text">
                <strong>{storeCount ?? '—'}</strong> active store{storeCount !== 1 ? 's' : ''} connected
              </div>
              <Link to="/settings" style={{ color: 'var(--primary)' }}>
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="activity-item">
              <div className="qa-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={18} />
              </div>
              <div className="activity-text">
                <strong>{stats.pending}</strong> order{stats.pending !== 1 ? 's' : ''} awaiting fulfillment
              </div>
              <Link to="/orders" style={{ color: 'var(--primary)' }}>
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="activity-item">
              <div className="qa-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} />
              </div>
              <div className="activity-text">
                <strong>{stats.lowStock}</strong> product{stats.lowStock !== 1 ? 's' : ''} below threshold
              </div>
              <Link to="/inventory" style={{ color: 'var(--primary)' }}>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
