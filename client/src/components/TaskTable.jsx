import { MOTIVO_CLASS, formatDelay, formatDuration, minutesUntil, urgencyState, WARNING_MINUTES } from '../utils/format';
import { IconAlertClock } from './icons.jsx';

// ── Ícones inline (SVG estático, sem dependência externa) ──────────────────────
const ICON_CHAT   = <svg viewBox="0 0 24 24" fill="none"><path d="M20 12C20 16.4 16.4 20 12 20C10.7 20 9.5 19.7 8.4 19.1L4 20L5.1 16.1C4.4 14.9 4 13.5 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
const ICON_TICKET = <svg viewBox="0 0 24 24" fill="none"><path d="M4 8A2 2 0 016 6H18A2 2 0 0120 8V9A2 2 0 0020 13V14A2 2 0 0118 16H6A2 2 0 014 14V13A2 2 0 004 9V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>;
const ICON_CHECK  = <svg viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ICON_EDIT   = <svg viewBox="0 0 24 24" fill="none"><path d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.4 18.5 6.6L17.4 5.5C16.6 4.7 15.3 4.7 14.5 5.5L4 16V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
const ICON_MORE   = <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/></svg>;
const ICON_REOPEN = <svg viewBox="0 0 24 24" fill="none"><path d="M4 12A8 8 0 1112 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 6V12H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ── Links de chat / ticket ─────────────────────────────────────────────────────
function Links({ t }) {
  if (!t.link_chat && !t.link_ticket) return <span className="link-empty">—</span>;
  return (
    <div className="link-group">
      {t.link_chat   && <a className="link-btn" href={t.link_chat}   target="_blank" rel="noopener noreferrer" title="Abrir conversa">{ICON_CHAT}</a>}
      {t.link_ticket && <a className="link-btn" href={t.link_ticket} target="_blank" rel="noopener noreferrer" title="Abrir chamado/ticket">{ICON_TICKET}</a>}
    </div>
  );
}

// ── Célula de anotações com tooltip rico (CSS puro, sem JS extra) ─────────────
function AnotacaoCell({ texto }) {
  if (!texto) return <span style={{ color: 'var(--text-tertiary)' }}>Sem anotações</span>;
  return (
    <span className="anot-wrap">
      <span className="anot-preview">{texto}</span>
      <span className="anot-tooltip">{texto}</span>
    </span>
  );
}

// ── Pill de tempo: formata atraso de forma legível ────────────────────────────
function TimingPill({ diff }) {
  if (diff < 0) {
    return <span className="timing-pill crit">Atrasado há {formatDelay(diff)}</span>;
  }
  if (diff <= WARNING_MINUTES) {
    return <span className="timing-pill warn">Em {diff} min</span>;
  }
  return <span className="timing-pill ok">em {diff} min</span>;
}

// ── Linha de retorno PENDENTE ─────────────────────────────────────────────────
function PendingRow({ t, onComplete, onEdit, onMore }) {
  const diff       = minutesUntil(t.data_hora);
  const state      = urgencyState(t.data_hora);
  const isStale    = diff < -1440; // mais de 24 h atrasado
  const motivoClass = MOTIVO_CLASS[t.motivo] || 'b-outros';

  let rowClass = '';
  if (isStale)                 rowClass = 'row-stale';
  else if (state === 'critical') rowClass = 'row-critical';
  else if (state === 'warning')  rowClass = 'row-warning';

  return (
    <tr className={rowClass}>
      <td className="cell-empresa">#{t.empresa_id}</td>
      <td className="cell-nome">
        {t.nome}
        <span className="cell-sub"><TimingPill diff={diff} /></span>
        {t.ultima_pendencia && (
          <span className="pendencia-badge">{IconAlertClock}{t.ultima_pendencia}</span>
        )}
      </td>
      <td>
        <span className={`badge ${motivoClass}`}>
          <span className="badge-dot"></span>{t.motivo}
        </span>
      </td>
      <td className="cell-datahora">{t.data_hora ? new Date(t.data_hora).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}</td>
      <td className="cell-anot"><AnotacaoCell texto={t.anotacoes} /></td>
      <td><Links t={t} /></td>
      <td>
        <div className="actions" style={{ justifyContent: 'flex-end' }}>
          <button className="act-btn done"  title="Concluir"    onClick={() => onComplete(t)}>{ICON_CHECK}</button>
          <button className="act-btn edit"  title="Editar"      onClick={() => onEdit(t)}>{ICON_EDIT}</button>
          <button className="act-btn more"  title="Mais ações"  onClick={(e) => { e.stopPropagation(); onMore(e, t); }}>{ICON_MORE}</button>
        </div>
      </td>
    </tr>
  );
}

// ── Linha de retorno CONCLUÍDO ────────────────────────────────────────────────
function DoneRow({ t, onReopen, onMore }) {
  const motivoClass = MOTIVO_CLASS[t.motivo] || 'b-outros';
  return (
    <tr>
      <td className="cell-empresa">#{t.empresa_id}</td>
      <td className="cell-nome">{t.nome}</td>
      <td>
        <span className={`badge ${motivoClass}`}>
          <span className="badge-dot"></span>{t.motivo}
        </span>
      </td>
      <td className="cell-datahora">
        {t.concluido_em
          ? new Date(t.concluido_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
          : '—'}
      </td>
      <td><span className="duracao-badge">{formatDuration(t.tempo_resolucao_min)}</span></td>
      <td className="cell-anot"><AnotacaoCell texto={t.anotacoes} /></td>
      <td><Links t={t} /></td>
      <td>
        <div className="actions" style={{ justifyContent: 'flex-end' }}>
          <button className="act-btn reopen" title="Reabrir"     onClick={() => onReopen(t)}>{ICON_REOPEN}</button>
          <button className="act-btn more"   title="Mais ações"  onClick={(e) => { e.stopPropagation(); onMore(e, t); }}>{ICON_MORE}</button>
        </div>
      </td>
    </tr>
  );
}

// ── Cabeçalho da tabela (evita duplicação de JSX inline) ─────────────────────
function TableHead({ activeTab }) {
  if (activeTab === 'pendentes') {
    return (
      <tr>
        <th>ID Empresa</th><th>Cliente</th><th>Motivo</th>
        <th>Data / Hora</th><th>Anotações</th><th>Chat</th>
        <th style={{ textAlign: 'right' }}>Ações</th>
      </tr>
    );
  }
  return (
    <tr>
      <th>ID Empresa</th><th>Cliente</th><th>Motivo</th>
      <th>Concluído em</th><th>Duração</th><th>Anotações</th>
      <th>Chat</th><th style={{ textAlign: 'right' }}>Ações</th>
    </tr>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TaskTable({
  activeTab, setActiveTab,
  countPendentes, countHistorico,
  list,
  onComplete, onEdit, onMore, onReopen,
}) {
  return (
    <>
      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'pendentes' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendentes')}
        >
          Pendentes <span className="count">{countPendentes}</span>
        </button>
        <button
          className={`tab ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico <span className="count">{countHistorico}</span>
        </button>
      </nav>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead><TableHead activeTab={activeTab} /></thead>
            <tbody>
              {list.map(t =>
                activeTab === 'pendentes'
                  ? <PendingRow key={t.id} t={t} onComplete={onComplete} onEdit={onEdit} onMore={onMore} />
                  : <DoneRow    key={t.id} t={t} onReopen={onReopen} onMore={onMore} />
              )}
            </tbody>
          </table>
        </div>

        {list.length === 0 && (
          <div className="empty-state">
            <h3>{activeTab === 'pendentes' ? 'Nenhum retorno pendente' : 'Nenhum retorno concluído ainda'}</h3>
            <p>
              {activeTab === 'pendentes'
                ? 'A fila está limpa. Clique em "Novo Retorno" para agendar um contato.'
                : 'Os retornos marcados como concluídos aparecem aqui.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
