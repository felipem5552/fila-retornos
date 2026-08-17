import { MOTIVOS, downloadCSV, formatDateTime, formatDuration, toDateInputValue } from '../utils/format';

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
      <button className="btn btn-sm" onClick={exportPendentes}>⬇ Pendentes (CSV)</button>
      <button className="btn btn-sm" onClick={exportHistorico}>⬇ Histórico (CSV)</button>
    </div>
  );
}
