import { formatDateTime } from '../utils/format';

export default function AlarmOverlay({ task, onComplete, onSnooze, onDismiss }) {
  if (!task) return null;
  return (
    <div className="alarm-overlay open">
      <div className="alarm-card">
        <div className="alarm-icon">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01M10.3 3.9L2.5 17A1.5 1.5 0 003.8 19H20.2A1.5 1.5 0 0021.5 17L13.7 3.9A1.5 1.5 0 0010.3 3.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
        </div>
        <h3>Hora de retornar para o cliente</h3>
        <div className="alarm-client">{task.nome}</div>
        <div className="alarm-meta">{task.motivo} · Agendado para {formatDateTime(task.data_hora)}</div>
        <div className="alarm-actions">
          <button className="btn btn-primary" onClick={onComplete}>Concluir agora</button>
          <button className="btn" onClick={() => onSnooze(15)}>+15 min</button>
          <button className="btn" onClick={() => onSnooze(30)}>+30 min</button>
          <button className="btn" onClick={() => onSnooze(60)}>+1 h</button>
        </div>
        <button className="alarm-dismiss" onClick={onDismiss}>Fechar e silenciar este alerta</button>
      </div>
    </div>
  );
}
