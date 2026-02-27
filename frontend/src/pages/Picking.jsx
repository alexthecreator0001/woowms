import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Picking() {
  const [pickLists, setPickLists] = useState([]);

  useEffect(() => {
    api.get('/picking').then(({ data }) => setPickLists(data.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Picking</h2>
      </div>

      {pickLists.map((pl) => (
        <div className="card" key={pl.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <strong>Pick List #{pl.id}</strong> — Order #{pl.order?.orderNumber}
            </div>
            <span className={`badge ${pl.status === 'COMPLETED' ? 'badge-shipped' : pl.status === 'IN_PROGRESS' ? 'badge-picking' : 'badge-pending'}`}>
              {pl.status}
            </span>
          </div>
          <table>
            <thead>
              <tr><th>SKU</th><th>Product</th><th>Bin</th><th>Qty</th><th>Picked</th></tr>
            </thead>
            <tbody>
              {pl.items?.map((item) => (
                <tr key={item.id}>
                  <td><code>{item.sku}</code></td>
                  <td>{item.productName}</td>
                  <td>{item.binLabel}</td>
                  <td>{item.quantity}</td>
                  <td>{item.isPicked ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {pickLists.length === 0 && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No pick lists yet. Generate one from an order.</p>
        </div>
      )}
    </div>
  );
}
