import { useEffect, useState } from 'react';
import api from '../services/api.js';

const statusBadge = (status) => {
  const map = {
    PENDING: 'badge-pending',
    AWAITING_PICK: 'badge-picking',
    PICKING: 'badge-picking',
    PICKED: 'badge-picking',
    PACKING: 'badge-picking',
    SHIPPED: 'badge-shipped',
    DELIVERED: 'badge-shipped',
    CANCELLED: 'badge-cancelled',
    ON_HOLD: 'badge-pending',
  };
  return `badge ${map[status] || 'badge-pending'}`;
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({});
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  async function loadOrders() {
    try {
      const params = { limit: 25 };
      if (filter) params.status = filter;
      const { data } = await api.get('/orders', { params });
      setOrders(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Orders</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 200 }}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="AWAITING_PICK">Awaiting Pick</option>
          <option value="PICKING">Picking</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><strong>#{order.orderNumber}</strong></td>
                <td>{order.customerName}</td>
                <td><span className={statusBadge(order.status)}>{order.status}</span></td>
                <td>{order.items?.length || 0}</td>
                <td>{order.currency} {order.total}</td>
                <td>{new Date(order.wooCreatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No orders yet. Connect your WooCommerce store to sync orders.</td></tr>
            )}
          </tbody>
        </table>
        {meta.total > 0 && (
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Showing {orders.length} of {meta.total} orders
          </div>
        )}
      </div>
    </div>
  );
}
