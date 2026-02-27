import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    api.get('/warehouse').then(({ data }) => setWarehouses(data.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Warehouse</h2>
      </div>

      {warehouses.map((wh) => (
        <div className="card" key={wh.id}>
          <h3>{wh.name} {wh.isDefault && <span className="badge badge-shipped">Default</span>}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{wh.address}</p>

          {wh.zones?.map((zone) => (
            <div key={zone.id} style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid var(--primary)' }}>
              <strong>{zone.name}</strong> <span className="badge badge-pending">{zone.type}</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {zone.bins?.map((bin) => (
                  <span key={bin.id} style={{ background: 'var(--bg)', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.8rem' }}>
                    {bin.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {warehouses.length === 0 && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No warehouses. Run the database seed to create a default warehouse.</p>
        </div>
      )}
    </div>
  );
}
