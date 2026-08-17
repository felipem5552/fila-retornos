import { formatDuration, isSameDay, minutesUntil, WARNING_MINUTES } from '../utils/format';

export default function KpiGrid({ tasks }) {
  const pendentes = tasks.filter(t => t.status === 'Pendente');
  const concluidos = tasks.filter(t => t.status === 'Concluido');

  const atrasados = pendentes.filter(t => minutesUntil(t.data_hora) < 0).length;
  const proximos = pendentes.filter(t => { const d = minutesUntil(t.data_hora); return d >= 0 && d <= WARNING_MINUTES; }).length;
  const hoje = new Date();
  const concluidosHoje = concluidos.filter(t => t.concluido_em && isSameDay(new Date(t.concluido_em), hoje)).length;
  const durs = concluidos.map(t => t.tempo_resolucao_min).filter(v => v != null);
  const tempoMedio = durs.length ? formatDuration(durs.reduce((a,b)=>a+b,0)/durs.length) : '—';
  const acompanhamento = pendentes.filter(t => t.ultima_pendencia).length;

  return (
    <div className="kpi-grid" id="kpiGrid">
      <div className="kpi-card"><div className="kpi-label">Atrasados agora</div><div className="kpi-value crit">{atrasados}</div><div className="kpi-sub">passaram do horário</div></div>
      <div className="kpi-card"><div className="kpi-label">Próximos 15 min</div><div className="kpi-value warn">{proximos}</div><div className="kpi-sub">atenção nos próximos minutos</div></div>
      <div className="kpi-card"><div className="kpi-label">Concluídos hoje</div><div className="kpi-value ok">{concluidosHoje}</div><div className="kpi-sub">retornos finalizados hoje</div></div>
      <div className="kpi-card"><div className="kpi-label">Tempo médio de atendimento</div><div className="kpi-value accent">{tempoMedio}</div><div className="kpi-sub">criação até conclusão</div></div>
      <div className="kpi-card"><div className="kpi-label">Em acompanhamento</div><div className="kpi-value" style={{ color:'var(--accent-indigo)' }}>{acompanhamento}</div><div className="kpi-sub">aguardando setor, cliente etc.</div></div>
    </div>
  );
}
