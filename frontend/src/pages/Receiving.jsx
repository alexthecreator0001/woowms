import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Receiving() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  useEffect(() => {
    api.get('/receiving').then(({ data }) => setPurchaseOrders(data.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Receiving</h2>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>PO #</th><th>Supplier</th><th>Status</th><th>Items</th><th>Expected</th></tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => (
              <tr key={po.id}>
                <td><strong>{po.poNumber}</strong></td>
                <td>{po.supplier}</td>
                <td><span className={`badge ${po.status === 'RECEIVED' ? 'badge-shipped' : 'badge-pending'}`}>{po.status}</span></td>
                <td>{po.items?.length || 0}</td>
                <td>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
            {purchaseOrders.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No purchase orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
