import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';

export default function AlertBubble() {
  const { alerts, markAsRead } = useAlerts();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {open && (
        <div style={{ width: 320, maxHeight: 400, overflowY: 'auto', background: '#1e2327', borderRadius: 12, padding: 12, marginBottom: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {alerts.length === 0 && <p style={{ color: '#888' }}>Nenhum alerta novo</p>}
          {alerts.map(a => (
            <div key={a.id} style={{ borderBottom: '1px solid #333', padding: '8px 0' }}>
              <strong>{a.cliente}</strong> — <span style={{ color: a.urgencia === 'alta' ? '#e74c3c' : '#f1c40f' }}>{a.urgencia}</span>
              <p style={{ fontSize: 13, margin: '4px 0' }}>{a.resumo}</p>
              <button onClick={() => markAsRead(a.id)}>Marcar como lido</button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{ borderRadius: '50%', width: 56, height: 56, background: '#0084ff', color: '#fff', border: 'none', position: 'relative', cursor: 'pointer' }}
      >
        💬
        {alerts.length > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: 'red', borderRadius: '50%', width: 20, height: 20, fontSize: 12 }}>
            {alerts.length}
          </span>
        )}
      </button>
    </div>
  );
}
