import { useEffect, useMemo, useState } from 'react';
import KpiGrid from '../components/KpiGrid.jsx';
import UrgencyStrip from '../components/UrgencyStrip.jsx';
import MetricsPanel from '../components/MetricsPanel.jsx';
import Toolbar from '../components/Toolbar.jsx';
import TaskTable from '../components/TaskTable.jsx';
import TaskPanel from '../components/TaskPanel.jsx';
import ActionDialog from '../components/ActionDialog.jsx';
import AlarmOverlay from '../components/AlarmOverlay.jsx';
import Popover from '../components/Popover.jsx';
import AlertBubble from '../components/AlertBubble.jsx';
import { IconCalendar, IconClock, IconCopy, IconTrash } from '../components/icons.jsx';
import { useTasks } from '../hooks/useTasks.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  buildCardSummary, buildICS, buildReturnMessage,
  copyToClipboard, downloadFile, minutesUntil,
  toDateInputValue, urgencyState,
} from '../utils/format';

const ICONS = {
  send:  <svg viewBox="0 0 24 24" fill="none"><path d="M4 12L20 4L14 20L11 13L4 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01M10.3 3.9L2.5 17A1.5 1.5 0 003.8 19H20.2A1.5 1.5 0 0021.5 17L13.7 3.9A1.5 1.5 0 0010.3 3.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
};

export default function DashboardPage() {
  const { tasks, ringingQueue, soundOn, setSoundOn, createTask, updateTask, deleteTask, runAction, dismissAlarm } = useTasks();
  const { showToast } = useToast();

  /* ── Filtros ─────────────────────────────────────────────────────────── */
  const [activeTab,    setActiveTab]    = useState('pendentes');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [idSearch,     setIdSearch]     = useState('');
  const [activeMotivos,setActiveMotivos]= useState(new Set());
  const [dateFilter,   setDateFilter]   = useState('');
  const [onlyAtrasados,setOnlyAtrasados]= useState(false);

  /* ── Painel de edição ────────────────────────────────────────────────── */
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  /* ── Dialog de ação (concluir/adiar) ────────────────────────────────── */
  const [actionTask, setActionTask] = useState(null);
  const [actionTipo, setActionTipo] = useState(null);

  /* ── Popover de contexto ─────────────────────────────────────────────── */
  const [popover, setPopover] = useState(null);

  function toggleMotivo(m) {
    setActiveMotivos(prev => {
      const s = new Set(prev);
      s.has(m) ? s.delete(m) : s.add(m);
      return s;
    });
  }

  /* ── Lista filtrada e ordenada ───────────────────────────────────────── */
  const filteredList = useMemo(() => {
    const status = activeTab === 'pendentes' ? 'Pendente' : 'Concluido';
    let list = tasks.filter(t => t.status === status);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(t => t.nome.toLowerCase().includes(q) || t.motivo.toLowerCase().includes(q));
    }
    if (idSearch.trim()) {
      list = list.filter(t => String(t.empresa_id).toLowerCase().includes(idSearch.trim().toLowerCase()));
    }
    if (activeMotivos.size > 0) list = list.filter(t => activeMotivos.has(t.motivo));
    if (dateFilter) {
      list = list.filter(t =>
        toDateInputValue(new Date(activeTab === 'pendentes' ? t.data_hora : (t.concluido_em || t.data_hora))) === dateFilter
      );
    }
    if (onlyAtrasados && activeTab === 'pendentes') {
      list = list.filter(t => minutesUntil(t.data_hora) < 0);
    }

    const prioridade = { critical: 0, warning: 1, normal: 2 };
    return list.slice().sort((a, b) => {
      if (activeTab !== 'pendentes') {
        return new Date(b.concluido_em || b.data_hora) - new Date(a.concluido_em || a.data_hora);
      }
      const pa = prioridade[urgencyState(a.data_hora)];
      const pb = prioridade[urgencyState(b.data_hora)];
      if (pa !== pb) return pa - pb;
      return new Date(a.data_hora) - new Date(b.data_hora);
    });
  }, [tasks, activeTab, searchQuery, idSearch, activeMotivos, dateFilter, onlyAtrasados]);

  const countPendentes = tasks.filter(t => t.status === 'Pendente').length;
  const countHistorico = tasks.filter(t => t.status === 'Concluido').length;

  /* ── Handlers do painel ──────────────────────────────────────────────── */
  function openNovo()  { setEditingTask(null); setPanelOpen(true); }
  function openEdit(t) { setEditingTask(t);    setPanelOpen(true); }
  function closePanel(){ setPanelOpen(false);  setEditingTask(null); }

  async function handleSave(body, pendencia, task) {
    try {
      if (task) await updateTask(task.id, body);
      else await createTask(pendencia ? { ...body, pendenciaInicial: pendencia } : body);
      closePanel();
      showToast('Retorno salvo.');
    } catch (err) { showToast(err.message, '', 'crit'); }
  }

  function openActionDialog(task, tipo) { setActionTask(task); setActionTipo(tipo); }
  function closeActionDialog()          { setActionTask(null); setActionTipo(null); }

  async function handleReopen(t) {
    try { await runAction(t.id, { tipo: 'reabrir' }); showToast('Retorno reaberto.'); }
    catch (err) { showToast(err.message, '', 'crit'); }
  }

  async function handleDelete(t) {
    if (!confirm(`Excluir o retorno de "${t.nome}"?`)) return;
    try { await deleteTask(t.id); showToast('Retorno excluído.'); }
    catch (err) { showToast(err.message, '', 'crit'); }
  }

  async function handleDuplicate(t) {
    const motivo = prompt('Por que está duplicando/reagendando?\nDeixe em branco para pular.');
    const anotacoesFinal = motivo?.trim()
      ? `[Reagendado — motivo: ${motivo.trim()}] ${t.anotacoes || ''}`.trim()
      : (t.anotacoes || '');
    await createTask({
      empresa_id: t.empresa_id, nome: t.nome, motivo: t.motivo,
      data_hora: new Date(Date.now() + 24 * 3600000).toISOString(),
      link_chat: t.link_chat, link_ticket: t.link_ticket, anotacoes: anotacoesFinal,
    });
    showToast('Retorno duplicado para amanhã.');
  }

  function openMore(e, task)  { setPopover({ el: e.currentTarget, task }); }
  function closePopover()     { setPopover(null); }

  /* ── Fechar com Esc ──────────────────────────────────────────────────── */
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

  /* ── Menu de contexto (popover) ──────────────────────────────────────── */
  function buildMenuItems(task) {
    const items = [];
    items.push({ icon: ICONS.send,  text: 'Copiar mensagem de retorno', action: () => { copyToClipboard(buildReturnMessage(task)); showToast('Mensagem copiada.'); } });
    items.push({ icon: IconCopy,    text: 'Copiar resumo do card',       action: () => { copyToClipboard(buildCardSummary(task));   showToast('Resumo copiado.'); } });
    items.push({ sep: true });
    if (task.status === 'Pendente') {
      items.push({ label: 'Adiar' });
      items.push({ icon: IconClock, text: '+ 15 minutos',          action: () => runAction(task.id, { tipo: 'adiar_rapido', minutos: 15   }) });
      items.push({ icon: IconClock, text: '+ 30 minutos',          action: () => runAction(task.id, { tipo: 'adiar_rapido', minutos: 30   }) });
      items.push({ icon: IconClock, text: '+ 1 hora',              action: () => runAction(task.id, { tipo: 'adiar_rapido', minutos: 60   }) });
      items.push({ icon: IconClock, text: 'Amanhã (mesmo horário)',action: () => runAction(task.id, { tipo: 'adiar_rapido', minutos: 1440 }) });
      items.push({ icon: ICONS.alert, text: 'Adiar com motivo…',   action: () => openActionDialog(task, 'adiar') });
      items.push({ sep: true });
    }
    if (task.interacoes?.length > 0) {
      items.push({ icon: IconClock, text: `Ver histórico (${task.interacoes.length})`, action: () => openEdit(task) });
    }
    items.push({ icon: IconCopy,    text: 'Duplicar retorno', action: () => handleDuplicate(task) });
    if (task.status === 'Pendente') {
      items.push({ icon: IconCalendar, text: 'Adicionar ao calendário (.ics)', action: () => downloadFile(`retorno-${task.nome.replace(/\s+/g, '-').toLowerCase()}.ics`, buildICS(task), 'text/calendar') });
    }
    items.push({ sep: true });
    items.push({ icon: IconTrash, text: 'Excluir', danger: true, action: () => handleDelete(task) });
    return items;
  }

  const ringingTask = ringingQueue.length ? tasks.find(t => t.id === ringingQueue[0]) : null;

  return (
    <div className="page-dashboard">
      {/* ── Cabeçalho da página ──────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Fila de Retornos</h1>
          <p className="page-subtitle">Customer Success · {countPendentes} pendente{countPendentes !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-header-right">
          {/* Busca inline */}
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Buscar nome ou motivo…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <input
            type="text"
            className="search-input search-input-id"
            placeholder="ID da empresa…"
            value={idSearch}
            onChange={e => setIdSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={openNovo}>+ Novo Retorno</button>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <KpiGrid
        tasks={tasks}
        onFilterAtrasados={() => setOnlyAtrasados(v => !v)}
        filterActive={onlyAtrasados}
      />

      {/* ── Próximo retorno ───────────────────────────────────────────────── */}
      <UrgencyStrip tasks={tasks} soundOn={soundOn} setSoundOn={setSoundOn} />

      {/* ── Métricas (colapsável) ─────────────────────────────────────────── */}
      <MetricsPanel tasks={tasks} />

      {/* ── Filtros de motivo e data ──────────────────────────────────────── */}
      <Toolbar
        activeMotivos={activeMotivos}
        toggleMotivo={toggleMotivo}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        tasks={tasks}
      />

      {/* ── Lista de retornos (cards) ─────────────────────────────────────── */}
      <TaskTable
        activeTab={activeTab}       setActiveTab={setActiveTab}
        countPendentes={countPendentes} countHistorico={countHistorico}
        list={filteredList}
        onComplete={(t) => openActionDialog(t, 'concluir')}
        onEdit={openEdit}
        onMore={openMore}
        onReopen={handleReopen}
      />

      {/* ── Painel de criação/edição ──────────────────────────────────────── */}
      <TaskPanel task={editingTask} open={panelOpen} onClose={closePanel} onSave={handleSave} />

      {/* ── Dialog de conclusão/adiamento ────────────────────────────────── */}
      <ActionDialog
        task={actionTask} tipo={actionTipo} onClose={closeActionDialog}
        onConfirmSim={() => runAction(actionTask.id, { tipo: 'concluir', definitivo: true }).then(() => showToast('Retorno concluído.'))}
        onSnoozeChip={(min) => runAction(actionTask.id, { tipo: 'adiar_rapido', minutos: min }).then(() => showToast('Retorno adiado.'))}
        onSnoozeCustom={(customData) => runAction(actionTask.id, { tipo: 'adiar_rapido', minutos: Math.round((new Date(customData) - new Date(actionTask.data_hora)) / 60000) }).then(() => showToast('Retorno adiado.'))}
        onConfirmMotivo={({ motivo_pendencia, observacao, nova_data }) => {
          const tipo = actionTipo === 'concluir' ? 'concluir' : 'adiar_motivo';
          runAction(actionTask.id, { tipo, definitivo: false, motivo_pendencia, observacao, nova_data })
            .then(() => showToast('Atualização registrada.'));
        }}
      />

      {/* ── Overlay de alarme ────────────────────────────────────────────── */}
      {ringingTask && (
        <AlarmOverlay
          task={ringingTask}
          onComplete={() => runAction(ringingTask.id, { tipo: 'concluir', definitivo: true }).then(() => showToast('Retorno concluído.'))}
          onSnooze={(min) => runAction(ringingTask.id, { tipo: 'adiar_rapido', minutos: min }).then(() => showToast('Retorno adiado.'))}
          onDismiss={() => dismissAlarm(ringingTask.id)}
        />
      )}

      {/* ── Popover de ações ─────────────────────────────────────────────── */}
      {popover && (
        <Popover anchorEl={popover.el} items={buildMenuItems(popover.task)} onClose={closePopover} />
      )}

      {/* ── Bolha de alertas de urgência ──────────────────────────────────── */}
      <AlertBubble />
    </div>
  );
}
