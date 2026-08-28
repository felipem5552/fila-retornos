import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import KpiGrid from '../components/KpiGrid.jsx';
import UrgencyStrip from '../components/UrgencyStrip.jsx';
import MetricsPanel from '../components/MetricsPanel.jsx';
import Toolbar from '../components/Toolbar.jsx';
import TaskTable from '../components/TaskTable.jsx';
import TaskPanel from '../components/TaskPanel.jsx';
import ActionDialog from '../components/ActionDialog.jsx';
import AlarmOverlay from '../components/AlarmOverlay.jsx';
import Popover from '../components/Popover.jsx';
import { useTasks } from '../hooks/useTasks.js';
import { useToast } from '../context/ToastContext.jsx';
import { buildCardSummary, buildICS, buildReturnMessage, copyToClipboard, downloadFile, formatDateTime, isSameDay, isThisWeek, toDateInputValue } from '../utils/format';

const ICONS = {
  clock: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 8V6A2 2 0 0014 4H6A2 2 0 004 6V14A2 2 0 006 16H8" stroke="currentColor" strokeWidth="1.8"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M4 10H20M8 4V7M16 4V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none"><path d="M5 7H19M9 7V5A1 1 0 0110 4H14A1 1 0 0115 5V7M18 7L17.3 19A1 1 0 0116.3 20H7.7A1 1 0 016.7 19L6 7H18Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  send: <svg viewBox="0 0 24 24" fill="none"><path d="M4 12L20 4L14 20L11 13L4 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01M10.3 3.9L2.5 17A1.5 1.5 0 003.8 19H20.2A1.5 1.5 0 0021.5 17L13.7 3.9A1.5 1.5 0 0010.3 3.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
};

export default function DashboardPage() {
  const { tasks, ringingQueue, soundOn, setSoundOn, createTask, updateTask, deleteTask, runAction, dismissAlarm, load } = useTasks();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('pendentes');
  const [searchQuery, setSearchQuery] = useState('');
  const [idSearch, setIdSearch] = useState('');
  const [activeMotivos, setActiveMotivos] = useState(new Set());
  const [dateFilter, setDateFilter] = useState('');

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [actionTask, setActionTask] = useState(null);
  const [actionTipo, setActionTipo] = useState(null);

  const [popover, setPopover] = useState(null); // { rect, task }

  function toggleMotivo(m) {
    setActiveMotivos(prev => { const s = new Set(prev); s.has(m) ? s.delete(m) : s.add(m); return s; });
  }

  const filteredList = useMemo(() => {
    const status = activeTab === 'pendentes' ? 'Pendente' : 'Concluido';
    let list = tasks.filter(t => t.status === status);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(t => t.nome.toLowerCase().includes(q) || t.motivo.toLowerCase().includes(q));
    }
    if (idSearch.trim()) list = list.filter(t => String(t.empresa_id).toLowerCase().includes(idSearch.trim().toLowerCase()));
    if (activeMotivos.size > 0) list = list.filter(t => activeMotivos.has(t.motivo));
    if (dateFilter) {
      list = list.filter(t => toDateInputValue(new Date(activeTab === 'pendentes' ? t.data_hora : (t.concluido_em || t.data_hora))) === dateFilter);
    }
    return list.slice().sort((a,b) => activeTab === 'pendentes'
      ? new Date(a.data_hora) - new Date(b.data_hora)
      : new Date(b.concluido_em || b.data_hora) - new Date(a.concluido_em || a.data_hora));
  }, [tasks, activeTab, searchQuery, idSearch, activeMotivos, dateFilter]);

  const countPendentes = tasks.filter(t => t.status === 'Pendente').length;
  const countHistorico = tasks.filter(t => t.status === 'Concluido').length;

  function openNovo() { setEditingTask(null); setPanelOpen(true); }
  function openEdit(t) { setEditingTask(t); setPanelOpen(true); }
  function closePanel() { setPanelOpen(false); setEditingTask(null); }

  async function handleSave(body, pendencia, task) {
    try {
      if (task) await updateTask(task.id, body);
      else await createTask(pendencia ? { ...body, pendenciaInicial: pendencia } : body);
      closePanel();
      showToast('Retorno salvo.');
    } catch (err) { showToast(err.message, '', 'crit'); }
  }

  function openActionDialog(task, tipo) { setActionTask(task); setActionTipo(tipo); }
  function closeActionDialog() { setActionTask(null); setActionTipo(null); }

  async function handleReopen(t) { await runAction(t.id, { tipo:'reabrir' }); showToast('Retorno reaberto.'); }
  async function handleDelete(t) {
    if (!confirm(`Excluir o retorno de "${t.nome}"?`)) return;
    await deleteTask(t.id); showToast('Retorno excluído.');
  }
  async function handleDuplicate(t) {
    await createTask({
      empresa_id: t.empresa_id, nome: t.nome, motivo: t.motivo,
      data_hora: new Date(Date.now() + 24*3600000).toISOString(),
      link_chat: t.link_chat, link_ticket: t.link_ticket, anotacoes: t.anotacoes
    });
    showToast('Retorno duplicado para amanhã.');
  }

  function openMore(e, task) { setPopover({ rect: e.currentTarget.getBoundingClientRect(), task }); }
  function closePopover() { setPopover(null); }

  useEffect(() => {
    function onEsc(e) {
      if (e.key !== 'Escape') return;
      closePanel();
      closePopover();
      closeActionDialog();
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, []);

  function buildMenuItems(task) {
    const items = [];
    items.push({ icon: ICONS.send, text:'Copiar mensagem de retorno', action: () => { copyToClipboard(buildReturnMessage(task)); showToast('Mensagem copiada.'); } });
    items.push({ icon: ICONS.copy, text:'Copiar resumo do card', action: () => { copyToClipboard(buildCardSummary(task)); showToast('Resumo copiado.'); } });
    items.push({ sep:true });
    if (task.status === 'Pendente') {
      items.push({ label:'Adiar' });
      items.push({ icon: ICONS.clock, text:'+ 15 minutos', action: () => runAction(task.id, { tipo:'adiar_rapido', minutos:15 }) });
      items.push({ icon: ICONS.clock, text:'+ 30 minutos', action: () => runAction(task.id, { tipo:'adiar_rapido', minutos:30 }) });
      items.push({ icon: ICONS.clock, text:'+ 1 hora', action: () => runAction(task.id, { tipo:'adiar_rapido', minutos:60 }) });
      items.push({ icon: ICONS.clock, text:'Amanhã (mesmo horário)', action: () => runAction(task.id, { tipo:'adiar_rapido', minutos:1440 }) });
      items.push({ icon: ICONS.alert, text:'Adiar com motivo…', action: () => openActionDialog(task, 'adiar') });
      items.push({ sep:true });
    }
    if (task.interacoes && task.interacoes.length > 0) {
      items.push({ icon: ICONS.clock, text:`Ver histórico (${task.interacoes.length})`, action: () => openEdit(task) });
    }
    items.push({ icon: ICONS.copy, text:'Duplicar retorno', action: () => handleDuplicate(task) });
    if (task.status === 'Pendente') items.push({ icon: ICONS.calendar, text:'Adicionar ao calendário (.ics)', action: () => downloadFile(`retorno-${task.nome.replace(/\s+/g,'-').toLowerCase()}.ics`, buildICS(task), 'text/calendar') });
    items.push({ sep:true });
    items.push({ icon: ICONS.trash, text:'Excluir', danger:true, action: () => handleDelete(task) });
    return items;
  }

  const ringingTask = ringingQueue.length ? tasks.find(t => t.id === ringingQueue[0]) : null;

  return (
    <div className="shell">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} idSearch={idSearch} setIdSearch={setIdSearch}
        onNovo={openNovo} onFoco={() => {}} />

      <KpiGrid tasks={tasks} />
      <UrgencyStrip tasks={tasks} soundOn={soundOn} setSoundOn={setSoundOn} />
      <MetricsPanel tasks={tasks} />
      <Toolbar activeMotivos={activeMotivos} toggleMotivo={toggleMotivo} dateFilter={dateFilter} setDateFilter={setDateFilter} tasks={tasks} />

      <TaskTable
        activeTab={activeTab} setActiveTab={setActiveTab}
        countPendentes={countPendentes} countHistorico={countHistorico}
        list={filteredList}
        onComplete={(t) => openActionDialog(t, 'concluir')}
        onEdit={openEdit}
        onMore={openMore}
        onReopen={handleReopen}
      />

      <TaskPanel task={editingTask} open={panelOpen} onClose={closePanel} onSave={handleSave} />

      <ActionDialog
        task={actionTask} tipo={actionTipo} onClose={closeActionDialog}
        onConfirmSim={() => runAction(actionTask.id, { tipo:'concluir', definitivo:true }).then(() => showToast('Retorno concluído.'))}
        onSnoozeChip={(min) => runAction(actionTask.id, { tipo:'adiar_rapido', minutos:min }).then(() => showToast('Retorno adiado.'))}
        onSnoozeCustom={(customData) => runAction(actionTask.id, { tipo:'adiar_rapido', minutos: Math.round((new Date(customData) - new Date(actionTask.data_hora))/60000) }).then(() => showToast('Retorno adiado.'))}
        onConfirmMotivo={({ motivo_pendencia, observacao, nova_data }) => {
          const tipo = actionTipo === 'concluir' ? 'concluir' : 'adiar_motivo';
          runAction(actionTask.id, { tipo, definitivo:false, motivo_pendencia, observacao, nova_data })
            .then(() => showToast('Atualização registrada.'));
        }}
      />

      {ringingTask && (
        <AlarmOverlay
          task={ringingTask}
          onComplete={() => runAction(ringingTask.id, { tipo:'concluir', definitivo:true }).then(() => showToast('Retorno concluído.'))}
          onSnooze={(min) => runAction(ringingTask.id, { tipo:'adiar_rapido', minutos:min }).then(() => showToast('Retorno adiado.'))}
          onDismiss={() => dismissAlarm(ringingTask.id)}
        />
      )}

      {popover && <Popover anchorRect={popover.rect} items={buildMenuItems(popover.task)} onClose={closePopover} />}
    </div>
  );
}
