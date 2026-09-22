import { MOTIVO_CLASS, formatDelay, formatDuration, minutesUntil, urgencyState, WARNING_MINUTES } from '../utils/format';

// ── Ícones de ação ────────────────────────────────────────────────────────────
const ICON_CHECK  = <svg viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ICON_EDIT   = <svg viewBox="0 0 24 24" fill="none"><path d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.4 18.5 6.6L17.4 5.5C16.6 4.7 15.3 4.7 14.5 5.5L4 16V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
const ICON_MORE   = <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/></svg>;
const ICON_REOPEN = <svg viewBox="0 0 24 24" fill="none"><path d="M4 12A8 8 0 1112 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 6V12H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ICON_CHAT   = <svg viewBox="0 0 24 24" fill="none"><path d="M20 12C20 16.4 16.4 20 12 20C10.7 20 9.5 19.7 8.4 19.1L4 20L5.1 16.1C4.4 14.9 4 13.5 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
const ICON_TICKET = <svg viewBox="0 0 24 24" fill="none"><path d="M4 8A2 2 0 016 6H18A2 2 0 0120 8V9A2 2 0 0020 13V14A2 2 0 0118 16H6A2 2 0 014 14V13A2 2 0 004 9V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>;

// ── Card de retorno PENDENTE ──────────────────────────────────────────────────
export function PendingCard({ t, onComplete, onEdit, onMore }) {
  const diff        = minutesUntil(t.data_hora);
  const state       = urgencyState(t.data_hora);
  const isStale     = diff < -1440;
  const motivoClass = MOTIVO_CLASS[t.motivo] || 'b-outros';

  let cardMod = '';
  if (isStale)               cardMod = 'task-card--stale';
  else if (state === 'critical') cardMod = 'task-card--critical';
  else if (state === 'warning')  cardMod = 'task-card--warning';

  // Texto e cor do pill de tempo
  let timingText, timingMod;
  if (diff < 0) {
    timingText = `Atrasado há ${formatDelay(diff)}`;
    timingMod  = 'pill--crit';
  } else if (diff <= WARNING_MINUTES) {
    timingText = `Em ${diff} min`;
    timingMod  = 'pill--warn';
  } else {
    timingText = `em ${formatDelay(diff)}`;
    timingMod  = 'pill--ok';
  }

  return (
    <article className={`task-card ${cardMod}`} onClick={() => onEdit(t)}>
      {/* Linha superior: ID + motivo + pill de tempo */}
      <div className="task-card__top">
        <span className="task-card__id">#{t.empresa_id}</span>
        <span className={`badge ${motivoClass}`}>
          <span className="badge-dot"></span>{t.motivo}
        </span>
        <span className={`task-card__pill ${timingMod}`}>{timingText}</span>
      </div>

      {/* Nome do cliente */}
      <h3 className="task-card__nome">{t.nome}</h3>

      {/* Anotações (se existirem) */}
      {t.anotacoes && (
        <p className="task-card__anot">{t.anotacoes}</p>
      )}

      {/* Badge de pendência — texto compacto, sem ícone SVG */}
      {t.ultima_pendencia && (
        <span className="pendencia-badge">
          <span className="pendencia-badge__dot">●</span>
          {t.ultima_pendencia}
        </span>
      )}

      {/* Rodapé: data agendada + links + ações */}
      <div className="task-card__footer" onClick={e => e.stopPropagation()}>
        <span className="task-card__date">
          {new Date(t.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>

        <div className="task-card__links">
          {t.link_chat   && <a className="link-btn" href={t.link_chat}   target="_blank" rel="noopener noreferrer" title="Chat">{ICON_CHAT}</a>}
          {t.link_ticket && <a className="link-btn" href={t.link_ticket} target="_blank" rel="noopener noreferrer" title="Ticket">{ICON_TICKET}</a>}
        </div>

        <div className="task-card__actions">
          <button
            className={`act-btn done${state === 'critical' || isStale ? ' act-btn--highlight' : ''}`}
            title="Concluir"
            onClick={() => onComplete(t)}
          >
            {ICON_CHECK}
          </button>
          <button className="act-btn edit" title="Editar" onClick={() => onEdit(t)}>
            {ICON_EDIT}
          </button>
          <button className="act-btn more" title="Mais ações" onClick={e => { e.stopPropagation(); onMore(e, t); }}>
            {ICON_MORE}
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Card de retorno CONCLUÍDO ─────────────────────────────────────────────────
export function DoneCard({ t, onReopen, onMore }) {
  const motivoClass = MOTIVO_CLASS[t.motivo] || 'b-outros';

  return (
    <article className="task-card task-card--done">
      <div className="task-card__top">
        <span className="task-card__id">#{t.empresa_id}</span>
        <span className={`badge ${motivoClass}`}>
          <span className="badge-dot"></span>{t.motivo}
        </span>
        <span className="duracao-badge">{formatDuration(t.tempo_resolucao_min)}</span>
      </div>

      <h3 className="task-card__nome">{t.nome}</h3>

      {t.anotacoes && <p className="task-card__anot">{t.anotacoes}</p>}

      <div className="task-card__footer" onClick={e => e.stopPropagation()}>
        <span className="task-card__date">
          {t.concluido_em
            ? new Date(t.concluido_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : '—'}
        </span>
        <div className="task-card__actions">
          <button className="act-btn reopen" title="Reabrir" onClick={() => onReopen(t)}>{ICON_REOPEN}</button>
          <button className="act-btn more"   title="Mais ações" onClick={e => { e.stopPropagation(); onMore(e, t); }}>{ICON_MORE}</button>
        </div>
      </div>
    </article>
  );
}
