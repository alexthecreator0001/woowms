import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Settings() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', consumerKey: '', consumerSecret: '', webhookSecret: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadStores = async () => {
    try {
      const { data } = await api.get('/stores');
      setStores(data.data);
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStores(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/stores', form);
      setForm({ name: '', url: '', consumerKey: '', consumerSecret: '', webhookSecret: '' });
      setShowForm(false);
      loadStores();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add store');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (storeId) => {
    try {
      await api.post(`/stores/${storeId}/sync`);
      loadStores();
    } catch (err) {
      alert('Sync failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDisconnect = async (storeId) => {
    if (!confirm('Disconnect this store? It will stop syncing.')) return;
    try {
      await api.delete(`/stores/${storeId}`);
      loadStores();
    } catch (err) {
      alert('Failed to disconnect: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>WooCommerce Stores</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Connect Store'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'var(--bg-secondary, #f5f5f5)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error && <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>{error}</p>}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Store Name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="My WooCommerce Store" />
              </div>
              <div className="form-group">
                <label>Store URL</label>
                <input name="url" value={form.url} onChange={handleChange} required placeholder="https://mystore.com" />
              </div>
              <div className="form-group">
                <label>Consumer Key</label>
                <input name="consumerKey" value={form.consumerKey} onChange={handleChange} required placeholder="ck_..." />
              </div>
              <div className="form-group">
                <label>Consumer Secret</label>
                <input name="consumerSecret" type="password" value={form.consumerSecret} onChange={handleChange} required placeholder="cs_..." />
              </div>
              <div className="form-group">
                <label>Webhook Secret (optional)</label>
                <input name="webhookSecret" value={form.webhookSecret} onChange={handleChange} placeholder="For verifying incoming webhooks" />
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Connecting...' : 'Connect Store'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading stores...</p>
        ) : stores.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No stores connected yet. Click "Connect Store" to add your first WooCommerce store.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Store</th>
                <th>URL</th>
                <th>Orders</th>
                <th>Products</th>
                <th>Last Sync</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td>{store.name}</td>
                  <td>{store.url}</td>
                  <td>{store._count?.orders ?? 0}</td>
                  <td>{store._count?.products ?? 0}</td>
                  <td>{store.lastSyncAt ? new Date(store.lastSyncAt).toLocaleString() : 'Never'}</td>
                  <td>
                    <span className={`badge ${store.isActive ? 'badge-success' : 'badge-secondary'}`}>
                      {store.isActive ? 'Active' : 'Disconnected'}
                    </span>
                  </td>
                  <td>
                    {store.isActive && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleSync(store.id)} style={{ marginRight: '0.5rem' }}>
                          Sync
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDisconnect(store.id)}>
                          Disconnect
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
