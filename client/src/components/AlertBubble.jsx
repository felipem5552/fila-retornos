import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';

function formatarDataHora(isoString) {
  const data = new Date(isoString);
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function AlertBubble() {
  const { alerts, markAsRead, clearAll } = useAlerts();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {open && (
        <div style={{ width: 340, maxHeight: 440, display: 'flex', flexDirection: 'column', background: '#1e2327', borderRadius: 12, marginBottom: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {alerts.length > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderBottom: '1px solid #333' }}>
              <button
                onClick={() => clearAll(true)}
                style={{ flex: 1, fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid #444', background: 'transparent', color: '#ccc', cursor: 'pointer' }}
              >
                Limpar não urgentes
              </button>
              <button
                onClick={() => clearAll(false)}
                style={{ flex: 1, fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid #444', background: 'transparent', color: '#ccc', cursor: 'pointer' }}
              >
                Limpar tudo
              </button>
            </div>
          )}

          <div style={{ overflowY: 'auto', padding: 12 }}>
            {alerts.length === 0 && <p style={{ color: '#888', margin: 0 }}>Nenhum alerta novo</p>}
            {alerts.map(a => (
              <div key={a.id} style={{ borderBottom: '1px solid #333', padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{a.cliente}</strong>
                  <span style={{ fontSize: 11, color: '#888' }}>{formatarDataHora(a.created_at)}</span>
                </div>
                <span style={{ color: a.urgencia === 'Alta' ? '#e74c3c' : '#f1c40f', fontSize: 12, fontWeight: 600 }}>
                  {a.urgencia}
                </span>
                <p style={{ fontSize: 13, margin: '4px 0' }}>{a.resumo}</p>
                <button
                  onClick={() => markAsRead(a.id)}
                  style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #444', background: 'transparent', color: '#ccc', cursor: 'pointer' }}
                >
                  Marcar como lido
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{ borderRadius: '50%', width: 56, height: 56, background: '#0084ff', color: '#fff', border: 'none', position: 'relative', cursor: 'pointer', fontSize: 22 }}
      >
        💬
        {alerts.length > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: 'red', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {alerts.length}
          </span>
        )}
      </button>
    </div>
  );
}
