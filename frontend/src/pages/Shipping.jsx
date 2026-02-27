import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Shipping() {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    api.get('/shipping').then(({ data }) => setShipments(data.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Shipping</h2>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Order</th><th>Carrier</th><th>Tracking</th><th>Status</th><th>Shipped</th></tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id}>
                <td>#{s.order?.orderNumber}</td>
                <td>{s.carrier || '-'}</td>
                <td>{s.trackingNumber || '-'}</td>
                <td><span className={`badge ${s.status === 'DELIVERED' ? 'badge-shipped' : 'badge-pending'}`}>{s.status}</span></td>
                <td>{s.shippedAt ? new Date(s.shippedAt).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
            {shipments.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No shipments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
