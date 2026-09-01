import { MOTIVOS, downloadCSV, formatDateTime, formatDuration, isThisMonth, isThisWeek, toDateInputValue } from '../utils/format';

export default function Toolbar({ activeMotivos, toggleMotivo, dateFilter, setDateFilter, tasks }) {
  function exportPendentes() {
    const pend = tasks.filter(t => t.status === 'Pendente');
    const header = ['ID Empresa','Cliente','Motivo','Data/Hora','Situação atual','Anotações','Link chat','Link ticket'];
    const rows = pend.map(t => [t.empresa_id, t.nome, t.motivo, formatDateTime(t.data_hora), t.ultima_pendencia || 'Novo', t.anotacoes || '', t.link_chat || '', t.link_ticket || '']);
    downloadCSV(`pendentes-${toDateInputValue(new Date())}.csv`, [header, ...rows]);
  }
  function exportHistorico() {
    const conc = tasks.filter(t => t.status === 'Concluido');
    const header = ['ID Empresa','Cliente','Motivo','Criado em','Concluído em','Tempo de atendimento','Qtd. atualizações','Histórico completo'];
    const rows = conc.map(t => {
      const hist = (t.interacoes || []).map(it =>
        `${formatDateTime(it.data)} - ${it.acao}${it.motivo_pendencia ? ' (' + it.motivo_pendencia + ')' : ''}${it.observacao ? ': ' + it.observacao : ''}`
      ).join(' | ');
      const qtd = (t.interacoes || []).filter(it => it.definitivo === false).length;
      return [t.empresa_id, t.nome, t.motivo, formatDateTime(t.criado_em), t.concluido_em ? formatDateTime(t.concluido_em) : '', formatDuration(t.tempo_resolucao_min), qtd, hist];
    });
    downloadCSV(`historico-${toDateInputValue(new Date())}.csv`, [header, ...rows]);
  }
  function exportMetricas(periodo) {
    const filtroData = periodo === 'semana' ? isThisWeek : isThisMonth;
    const conc = tasks.filter(t => t.status === 'Concluido' && t.concluido_em && filtroData(new Date(t.concluido_em)));
    const criadosPeriodo = tasks.filter(t => filtroData(new Date(t.criado_em)));
    const header = ['Motivo','Retornos criados','Retornos concluídos','Tempo médio de atendimento'];
    const rows = MOTIVOS.map(m => {
      const criados = criadosPeriodo.filter(t => t.motivo === m).length;
      const concM = conc.filter(t => t.motivo === m);
      const durs = concM.map(t => t.tempo_resolucao_min).filter(v => v != null);
      const media = durs.length ? formatDuration(durs.reduce((a,b)=>a+b,0)/durs.length) : '—';
      return [m, criados, concM.length, media];
    });
    const totalCriados = criadosPeriodo.length, totalConc = conc.length;
    const dursTotal = conc.map(t => t.tempo_resolucao_min).filter(v => v != null);
    const mediaTotal = dursTotal.length ? formatDuration(dursTotal.reduce((a,b)=>a+b,0)/dursTotal.length) : '—';
    rows.push(['TOTAL', totalCriados, totalConc, mediaTotal]);
    const label = periodo === 'semana' ? 'semana-atual' : 'mes-atual';
    downloadCSV(`metricas-${label}-${toDateInputValue(new Date())}.csv`, [header, ...rows]);
  }

  return (
    <div className="toolbar">
      <div className="chip-group">
        {MOTIVOS.map(m => (
          <button key={m} className={`chip ${activeMotivos.has(m) ? 'active' : ''}`} onClick={() => toggleMotivo(m)}>{m}</button>
        ))}
      </div>
      <input type="date" className="date-mini" value={dateFilter} onChange={e => setDateFilter(e.target.value)} title="Buscar por data específica" />
      <button className="date-clear" onClick={() => setDateFilter('')}>limpar data</button>
      <div className="toolbar-spacer"></div>
      <button className="btn btn-sm" onClick={() => exportMetricas('semana')} title="Volume e TMA por motivo, últimos 7 dias">⬇ Métricas (semana)</button>
      <button className="btn btn-sm" onClick={() => exportMetricas('mes')} title="Volume e TMA por motivo, mês atual">⬇ Métricas (mês)</button>
      <button className="btn btn-sm" onClick={exportPendentes}>⬇ Pendentes (CSV)</button>
      <button className="btn btn-sm" onClick={exportHistorico}>⬇ Histórico (CSV)</button>
    </div>
  );
}
