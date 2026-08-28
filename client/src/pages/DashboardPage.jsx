import { useCallback, useMemo, useState } from 'react';
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
import { IconCopy, IconMessage, IconDuplicate, IconCalendar, IconTrash, IconClock } from '../components/icons.jsx';

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
  const closePopover = useCallback(() => setPopover(null), []);

  function buildMenuItems(task) {
    const items = [];
    items.push({ icon: IconMessage, text:'Copiar mensagem de retorno', action: () => { copyToClipboard(buildReturnMessage(task)); showToast('Mensagem copiada.'); } });
    items.push({ icon: IconCopy, text:'Copiar resumo do card', action: () => { copyToClipboard(buildCardSummary(task)); showToast('Resumo copiado.'); } });
    items.push({ sep:true });
    if (task.status === 'Pendente') {
      items.push({ label:'Adiar' });
      items.push({ icon: IconClock, text:'+ 15 minutos', action: () => runAction(task.id, { tipo:'adiar_rapido', minutos:15 }) });
      items.push({ icon: IconClock, text:'+ 30 minutos', action: () => runAction(task.id, { tipo:'adiar_rapido', minutos:30 }) });
      items.push({ icon: IconClock, text:'+ 1 hora', action: () => runAction(task.id, { tipo:'adiar_rapido', minutos:60 }) });
      items.push({ icon: IconClock, text:'Amanhã (mesmo horário)', action: () => runAction(task.id, { tipo:'adiar_rapido', minutos:1440 }) });
      items.push({ icon: IconClock, text:'Adiar com motivo…', action: () => openActionDialog(task, 'adiar') });
      items.push({ sep:true });
    }
    items.push({ icon: IconDuplicate, text:'Duplicar retorno', action: () => handleDuplicate(task) });
    if (task.status === 'Pendente') items.push({ icon: IconCalendar, text:'Baixar .ics (calendário)', action: () => downloadFile(`retorno-${task.nome.replace(/\s+/g,'-').toLowerCase()}.ics`, buildICS(task), 'text/calendar') });
    items.push({ sep:true });
    items.push({ icon: IconTrash, text:'Excluir', danger:true, action: () => handleDelete(task) });
    return items;
  }

  const ringingTask = ringingQueue.length ? tasks.find(t => t.id === ringingQueue[0]) : null;

  return (
    <div className="shell">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} idSearch={idSearch} setIdSearch={setIdSearch}
        onNovo={openNovo} />

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
