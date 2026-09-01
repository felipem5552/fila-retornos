import { MOTIVOS, formatDuration } from '../utils/format';

const ACUMULO_LIMITE = 5;

export default function MetricsPanel({ tasks }) {
  const pendentes = tasks.filter(t => t.status === 'Pendente');
  const concluidos = tasks.filter(t => t.status === 'Concluido');

  const contagens = MOTIVOS.map(m => pendentes.filter(t => t.motivo === m).length);
  const maxCont = Math.max(...contagens, 1);

  const medias = MOTIVOS.map(m => {
    const durs = concluidos.filter(t => t.motivo === m).map(t => t.tempo_resolucao_min).filter(v => v != null);
    return durs.length ? durs.reduce((a,b)=>a+b,0)/durs.length : null;
  });
  const maxMedia = Math.max(...medias.filter(v => v != null), 1);

  return (
    <div className="card metrics-card" style={{ padding:'16px 18px', marginBottom:14 }}>
      <div className="metrics-cols">
        <div className="metrics-col">
          <h3>Retornos pendentes por motivo</h3>
          <p className="hint">Ajuda a ver onde está concentrado o volume do dia. Acima de {ACUMULO_LIMITE} pendentes, o motivo é destacado.</p>
          {MOTIVOS.map((m,i) => {
            const acumulado = contagens[i] >= ACUMULO_LIMITE;
            return (
              <div className={`bar-row${acumulado ? ' bar-row-alert' : ''}`} key={m}>
                <span className="bar-label">{acumulado && '⚠ '}{m}</span>
                <span className="bar-track"><span className={`bar-fill${acumulado ? ' bar-fill-alert' : ''}`} style={{ width: `${(contagens[i]/maxCont)*100}%` }}></span></span>
                <span className="bar-count">{contagens[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="metrics-col">
          <h3>Tempo médio de atendimento por motivo</h3>
          <p className="hint">Baseado nos retornos já concluídos — ajuda a ver onde o tempo realmente vai.</p>
          {MOTIVOS.map((m,i) => (
            <div className="bar-row" key={m}>
              <span className="bar-label">{m}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: medias[i] != null ? `${(medias[i]/maxMedia)*100}%` : '0%' }}></span></span>
              <span className="bar-count">{formatDuration(medias[i])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
