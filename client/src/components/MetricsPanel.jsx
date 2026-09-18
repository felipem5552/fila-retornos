import { useState } from 'react';
import { MOTIVOS, formatDuration } from '../utils/format';

const ACUMULO_LIMITE = 5;

export default function MetricsPanel({ tasks }) {
  const [open, setOpen] = useState(false);

  const pendentes  = tasks.filter(t => t.status === 'Pendente');
  const concluidos = tasks.filter(t => t.status === 'Concluido');

  const contagens = MOTIVOS.map(m => pendentes.filter(t => t.motivo === m).length);
  const maxCont   = Math.max(...contagens, 1);

  const medias = MOTIVOS.map(m => {
    const durs = concluidos.filter(t => t.motivo === m).map(t => t.tempo_resolucao_min).filter(v => v != null);
    return durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : null;
  });
  const maxMedia = Math.max(...medias.filter(v => v != null), 1);

  return (
    <div className="card metrics-card" style={{ padding: 0, marginBottom: 14, overflow: 'hidden' }}>
      {/* Cabeçalho clicável — painel colapsado por padrão para não roubar foco da fila */}
      <button
        className="metrics-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="metrics-toggle-label">Métricas por motivo</span>
        <span className="metrics-toggle-counts">
          {MOTIVOS.map((m, i) => contagens[i] > 0 && (
            <span key={m} className={`metrics-mini-badge${contagens[i] >= ACUMULO_LIMITE ? ' alert' : ''}`}>
              {m}: {contagens[i]}
            </span>
          ))}
        </span>
        <span
          className="metrics-toggle-chevron"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s ease' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <div className="metrics-body">
          <div className="metrics-cols">
            <div className="metrics-col">
              <h3>Pendentes por motivo</h3>
              <p className="hint">Acima de {ACUMULO_LIMITE} pendentes, o motivo é destacado.</p>
              {MOTIVOS.map((m, i) => {
                const acumulado = contagens[i] >= ACUMULO_LIMITE;
                return (
                  <div className={`bar-row${acumulado ? ' bar-row-alert' : ''}`} key={m}>
                    <span className="bar-label">{acumulado && '⚠ '}{m}</span>
                    <span className="bar-track">
                      <span
                        className={`bar-fill${acumulado ? ' bar-fill-alert' : ''}`}
                        style={{ width: `${(contagens[i] / maxCont) * 100}%` }}
                      ></span>
                    </span>
                    <span className="bar-count">{contagens[i]}</span>
                  </div>
                );
              })}
            </div>
            <div className="metrics-col">
              <h3>Tempo médio por motivo</h3>
              <p className="hint">Baseado nos retornos já concluídos.</p>
              {MOTIVOS.map((m, i) => (
                <div className="bar-row" key={m}>
                  <span className="bar-label">{m}</span>
                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: medias[i] != null ? `${(medias[i] / maxMedia) * 100}%` : '0%' }}
                    ></span>
                  </span>
                  <span className="bar-count">{formatDuration(medias[i])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
