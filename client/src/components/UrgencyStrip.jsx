import { formatDateTime, minutesUntil, urgencyState } from '../utils/format';

export default function UrgencyStrip({ tasks, soundOn, setSoundOn }) {
  const pendentes = tasks.filter(t => t.status === 'Pendente');

  const soundToggle = (
    <button className={`sound-toggle ${soundOn ? 'active' : ''}`} title="Ativar/desativar som dos alertas" onClick={() => setSoundOn(!soundOn)}>
      <svg viewBox="0 0 24 24" fill="none"><path d="M4 9V15H8L13 20V4L8 9H4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M16 8.5C17 9.5 17 14.5 16 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      <span>{soundOn ? 'Som ligado' : 'Som desligado'}</span>
    </button>
  );

  if (pendentes.length === 0) {
    return (
      <div className="urgency-strip">
        <span className="urgency-dot"></span>
        <div>
          <span className="urgency-label">Próximo retorno</span><br/>
          <span className="urgency-main">Nenhum retorno pendente</span>
          <div className="urgency-sub">Cadastre um retorno para começar a acompanhar o tempo.</div>
        </div>
        {soundToggle}
        <span className="urgency-countdown">—</span>
      </div>
    );
  }

  const next = pendentes.slice().sort((a,b) => new Date(a.data_hora) - new Date(b.data_hora))[0];
  const state = urgencyState(next.data_hora);
  const diff = minutesUntil(next.data_hora);
  const stripClass = state === 'critical' ? 'crit' : state === 'warning' ? 'warn' : '';

  let countdownText, countdownColor;
  if (diff < 0) { countdownText = `atrasado ${Math.abs(diff)} min`; countdownColor = 'var(--crit-text)'; }
  else if (diff === 0) { countdownText = 'agora'; countdownColor = 'var(--warn-text)'; }
  else {
    const h = Math.floor(diff/60), m = diff % 60;
    countdownText = h > 0 ? `em ${h}h ${m}min` : `em ${m} min`;
    countdownColor = state === 'warning' ? 'var(--warn-text)' : 'var(--accent)';
  }

  return (
    <div className={`urgency-strip ${stripClass}`}>
      <span className={`urgency-dot ${stripClass}`}></span>
      <div>
        <span className="urgency-label">Próximo retorno</span><br/>
        <span className="urgency-main">{next.nome} · {next.motivo}</span>
        <div className="urgency-sub">Agendado para {formatDateTime(next.data_hora)}</div>
      </div>
      {soundToggle}
      <span className="urgency-countdown" style={{ color: countdownColor }}>{countdownText}</span>
    </div>
  );
}
