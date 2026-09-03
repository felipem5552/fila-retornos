import { formatDuration, isSameDay, minutesUntil, WARNING_MINUTES } from '../utils/format';

export default function KpiGrid({ tasks, onFilterAtrasados, filterActive }) {
  const pendentes = tasks.filter(t => t.status === 'Pendente');
  const concluidos = tasks.filter(t => t.status === 'Concluido');

  const atrasados = pendentes.filter(t => minutesUntil(t.data_hora) < 0).length;
  const proximos = pendentes.filter(t => { const d = minutesUntil(t.data_hora); return d >= 0 && d <= WARNING_MINUTES; }).length;
  const saudavel = pendentes.length - atrasados - proximos;
  const hoje = new Date();
  const concluidosHoje = concluidos.filter(t => t.concluido_em && isSameDay(new Date(t.concluido_em), hoje)).length;
  const durs = concluidos.map(t => t.tempo_resolucao_min).filter(v => v != null);
  const tempoMedio = durs.length ? formatDuration(durs.reduce((a,b)=>a+b,0)/durs.length) : '—';

  const items = [
    { key:'crit', label:'Em Risco', sub:'requer atenção imediata', value:atrasados, tone:'crit',
      icon: <path d="M12 8V13M12 16.5H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>,
      onClick: atrasados > 0 ? onFilterAtrasados : null, active: filterActive },
    { key:'warn', label:'Atenção', sub:'acompanhe de perto', value:proximos, tone:'warn',
      icon: <path d="M12 8V13M12 16.5H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/> },
    { key:'ok', label:'Saudável', sub:'dentro do esperado', value:Math.max(saudavel,0), tone:'ok',
      icon: <path d="M6 12L10 16L18 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/> },
    { key:'accent', label:'Concluídos hoje', sub:'retornos finalizados', value:concluidosHoje, tone:'accent',
      icon: <path d="M9 12L11 14L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> },
    { key:'indigo', label:'Tempo médio', sub:'criação até conclusão', value:tempoMedio, tone:'indigo',
      icon: <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/> },
  ];

  return (
    <div className="farol-strip" id="kpiGrid">
      {items.map(it => (
        <div key={it.key} className={`farol-item farol-${it.tone}${it.onClick ? ' farol-clickable' : ''}${it.active ? ' farol-active' : ''}`}
          onClick={() => it.onClick && it.onClick()} title={it.onClick ? 'Clique para filtrar' : ''}>
          <div className="farol-icon"><svg viewBox="0 0 24 24" fill="none">{it.icon}</svg></div>
          <div className="farol-value">{it.value}</div>
          <div className="farol-label">{it.label}</div>
          <div className="farol-sub">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
