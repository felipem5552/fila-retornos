import { useEffect, useState } from 'react';
import { localInputToISO, toLocalInputValue } from '../utils/format';

const SETORES = ['Financeiro', 'Suporte N2/Dev', 'Comercial', 'Homologação/Meta', 'Outro setor'];

export default function ActionDialog({ task, tipo, onClose, onConfirmSim, onSnoozeChip, onSnoozeCustom, onConfirmMotivo }) {
  const [step, setStep] = useState('1');
  const [motivo, setMotivo] = useState('Aguardando outro setor');
  const [setor, setSetor] = useState(SETORES[0]);
  const [obs, setObs] = useState('');
  const [novaData, setNovaData] = useState('');
  const [customData, setCustomData] = useState('');

  useEffect(() => {
    if (!task) return;
    setStep('1'); setObs('');
    const sugestao = new Date(new Date(task.data_hora).getTime() + 24*3600000);
    setNovaData(toLocalInputValue(sugestao.toISOString()));
    setCustomData(toLocalInputValue(sugestao.toISOString()));
  }, [task]);

  if (!task) return null;

  const title = tipo === 'concluir' ? 'Concluir retorno' : 'Adiar retorno';
  const question = tipo === 'concluir'
    ? 'Esse retorno foi resolvido definitivamente?'
    : 'Esse adiamento é definitivo (só remarcando) ou o atendimento ainda está pendente de algo?';
  const yesLabel = tipo === 'concluir' ? 'Sim, é definitivo' : 'Sim, só remarcar';
  const noLabel = tipo === 'concluir' ? 'Não, é só uma atualização' : 'Não, está pendente de algo';

  return (
    <div className="action-box open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="action-card">
        <button className="action-close" title="Fechar sem salvar" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <h3>{title}</h3>
        <p className="action-client">{task.nome} · {task.motivo}</p>

        {step === '1' && (
          <div>
            <p className="action-question">{question}</p>
            <div className="action-choice-row">
              <button className="btn btn-primary" onClick={() => {
                if (tipo === 'concluir') { onConfirmSim(); onClose(); }
                else setStep('1b');
              }}>{yesLabel}</button>
              <button className="btn" onClick={() => setStep('2')}>{noLabel}</button>
            </div>
          </div>
        )}

        {step === '1b' && (
          <div>
            <p className="action-question">Escolha o novo horário:</p>
            <div className="snooze-chip-row">
              {[15,30,60,1440].map(m => (
                <button key={m} onClick={() => { onSnoozeChip(m); onClose(); }}>{m === 1440 ? 'Amanhã' : m === 60 ? '+1 h' : `+${m} min`}</button>
              ))}
            </div>
            <div className="field">
              <label>Ou uma data/hora específica</label>
              <input type="datetime-local" value={customData} onChange={e => setCustomData(e.target.value)} />
            </div>
            <div className="action-choice-row">
              <button className="btn" onClick={() => setStep('1')}>Voltar</button>
              <button className="btn btn-primary" onClick={() => { onSnoozeCustom(localInputToISO(customData)); onClose(); }}>Confirmar data específica</button>
            </div>
          </div>
        )}

        {step === '2' && (
          <div>
            <div className="field">
              <label>Motivo da pendência</label>
              <select value={motivo} onChange={e => setMotivo(e.target.value)}>
                <option>Aguardando outro setor</option>
                <option>Aguardando devolutiva do cliente</option>
                <option>Aguardando aprovação interna</option>
                <option>Outro</option>
              </select>
            </div>
            {motivo === 'Aguardando outro setor' && (
              <div className="field">
                <label>Qual setor?</label>
                <select value={setor} onChange={e => setSetor(e.target.value)}>
                  {SETORES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label>Observação (opcional)</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Detalhe rápido do que está pendente…"></textarea>
            </div>
            <div className="field">
              <label>Novo horário de retorno</label>
              <input type="datetime-local" value={novaData} onChange={e => setNovaData(e.target.value)} />
            </div>
            <div className="action-choice-row">
              <button className="btn" onClick={() => setStep('1')}>Voltar</button>
              <button className="btn btn-primary" onClick={() => { onConfirmMotivo({ motivo_pendencia: motivo === 'Aguardando outro setor' ? `Aguardando outro setor (${setor})` : motivo, observacao: obs, nova_data: localInputToISO(novaData) }); onClose(); }}>
                {tipo === 'concluir' ? 'Registrar atualização' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
