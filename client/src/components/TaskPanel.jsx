import { useEffect, useState } from 'react';
import { formatDateTime, toLocalInputValue } from '../utils/format';

function stageLabel(it) {
  if (it.acao === 'criacao') return it.definitivo === false ? (it.motivo_pendencia || 'Aberto') : 'Aberto';
  if (it.acao === 'conclusao') return 'Encerrado';
  if (it.definitivo === false) return it.motivo_pendencia || 'Aguardando atualização';
  if (it.acao === 'adiamento') return 'Reagendado';
  return 'Pendência resolvida';
}
function stageClass(it) {
  if (it.acao === 'conclusao') return 'ok';
  if (it.definitivo === false) return 'warn';
  return '';
}

function StageTimeline({ task }) {
  if (!task) return null;
  const interacoes = (task.interacoes || []).slice().sort((a,b) => new Date(a.data) - new Date(b.data));
  const stages = interacoes.length === 0 || interacoes[0].acao !== 'criacao'
    ? [{ data: task.criado_em, acao: 'criacao', definitivo: true }, ...interacoes]
    : interacoes;

  return (
    <div className="stage-timeline">
      <h4>Estágios do atendimento</h4>
      <div className="stage-track">
        {stages.map((it, i) => (
          <div className={`stage-node ${stageClass(it)}`} key={i}>
            <div className="stage-dot"></div>
            <div className="stage-head">
              <span className="stage-label">{stageLabel(it)}</span>
              <span className="stage-time">{formatDateTime(it.data)}</span>
            </div>
            {it.observacao && <p className="stage-obs">{it.observacao}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

const EMPTY = { empresa_id:'', nome:'', motivo:'Suporte', data_hora:'', link_chat:'', link_ticket:'', anotacoes:'', pendencia:'' };

export default function TaskPanel({ task, open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(task ? {
      empresa_id: task.empresa_id, nome: task.nome, motivo: task.motivo,
      data_hora: toLocalInputValue(task.data_hora), link_chat: task.link_chat || '',
      link_ticket: task.link_ticket || '', anotacoes: task.anotacoes || '', pendencia: ''
    } : { ...EMPTY, data_hora: toLocalInputValue(new Date().toISOString()) });
  }, [task, open]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    const body = {
      empresa_id: form.empresa_id.trim(), nome: form.nome.trim(), motivo: form.motivo,
      data_hora: form.data_hora, link_chat: form.link_chat.trim(),
      link_ticket: form.link_ticket.trim(), anotacoes: form.anotacoes.trim()
    };
    onSave(body, form.pendencia, task);
  }

  return (
    <>
      <div className={`overlay ${open ? 'open' : ''}`} onClick={onClose}></div>
      <aside className={`panel ${open ? 'open' : ''}`}>
        <div className="panel-head">
          <div>
            <h2>{task ? 'Editar Retorno' : 'Novo Retorno'}</h2>
            <p>{task ? 'Atualize os dados do compromisso' : 'Preencha os dados do compromisso'}</p>
          </div>
          <button className="panel-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form className="panel-body" onSubmit={handleSubmit} id="taskForm">
          <StageTimeline task={task} />

          <div className="field">
            <label>ID da Empresa <span className="req">*</span></label>
            <input type="text" required value={form.empresa_id} onChange={e => set('empresa_id', e.target.value)} />
          </div>
          <div className="field">
            <label>Nome do cliente <span className="req">*</span></label>
            <input type="text" required value={form.nome} onChange={e => set('nome', e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Motivo <span className="req">*</span></label>
              <select value={form.motivo} onChange={e => set('motivo', e.target.value)}>
                <option>Financeiro</option><option>Suporte</option><option>Homologação</option><option>Dúvidas</option><option>Outros</option>
              </select>
            </div>
            <div className="field">
              <label>Data / Hora <span className="req">*</span></label>
              <input type="datetime-local" required value={form.data_hora} onChange={e => set('data_hora', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Link do chat</label>
            <input type="url" placeholder="https://wa.me/55..." value={form.link_chat} onChange={e => set('link_chat', e.target.value)} />
          </div>
          <div className="field">
            <label>Link do chamado/ticket <span className="hint-inline">(opcional)</span></label>
            <input type="url" value={form.link_ticket} onChange={e => set('link_ticket', e.target.value)} />
          </div>
          <div className="field">
            <label>Situação inicial <span className="hint-inline">(opcional)</span></label>
            <select value={form.pendencia} onChange={e => set('pendencia', e.target.value)}>
              <option value="">Nenhuma — retorno novo</option>
              <option>Aguardando outro setor</option>
              <option>Aguardando devolutiva do cliente</option>
              <option>Aguardando aprovação interna</option>
              <option>Outro</option>
            </select>
            <div className="hint">Marque se esse retorno já nasce esperando algo.</div>
          </div>
          <div className="field">
            <label>Anotações</label>
            <textarea value={form.anotacoes} onChange={e => set('anotacoes', e.target.value)}></textarea>
          </div>
        </form>

        <div className="panel-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" form="taskForm" className="btn btn-primary">{task ? 'Salvar alterações' : 'Salvar retorno'}</button>
        </div>
      </aside>
    </>
  );
}
