import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, [search]);

  async function loadProducts() {
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/inventory', { params });
      setProducts(data.data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Inventory</h2>
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>In Stock</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><code>{p.sku || '-'}</code></td>
                <td>{p.name}</td>
                <td>{p.stockQty}</td>
                <td>{p.reservedQty}</td>
                <td style={{ fontWeight: 600, color: (p.stockQty - p.reservedQty) <= p.lowStockThreshold ? 'var(--danger)' : 'var(--success)' }}>
                  {p.stockQty - p.reservedQty}
                </td>
                <td>{p.stockLocations?.map((sl) => sl.bin?.label).join(', ') || '-'}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No products. Sync from WooCommerce to populate inventory.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
