/* ==================================================================
   FILA DE RETORNOS — front-end conectado à API (server/routes/tasks.routes.js).
   Mesma regra de negócio da versão local (localStorage), só que agora
   os dados moram no servidor e cada usuário só vê os próprios retornos.
   ================================================================== */
const MOTIVOS = ['Financeiro','Suporte','Homologação','Dúvidas','Outros'];
const WARNING_MINUTES = 15;

let tasks = [];
let activeTab = 'Pendente';
let searchQuery = '';
let activeMotivos = new Set();
let editingId = null;
let actionContext = { taskId: null, tipo: null };

/* ---------- Helpers de API ---------- */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

function showToast(text, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<b>${type === 'crit' ? 'Erro' : 'Pronto'}</b>${text}`;
  document.getElementById('toastStack').appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function formatDateTime(iso) {
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function formatDuration(min) {
  if (min == null || isNaN(min)) return '—';
  min = Math.max(0, Math.round(min));
  const h = Math.floor(min/60), m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
function toLocalInput(iso) {
  const d = new Date(iso);
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function minutesUntil(iso) { return Math.round((new Date(iso) - Date.now()) / 60000); }

/* ---------- Sessão ---------- */
async function checkSession() {
  try {
    const me = await api('/api/auth/me');
    document.getElementById('whoami').textContent = me.nome;
    if (me.role === 'admin') document.getElementById('linkAdmin').style.display = 'inline-flex';
  } catch {
    window.location.href = 'login.html';
  }
}
document.getElementById('btnLogout').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.href = 'login.html';
});

/* ---------- Carregar / renderizar ---------- */
async function loadTasks() {
  tasks = await api('/api/tasks');
  render();
}

function render() {
  const pendentes = tasks.filter(t => t.status === 'Pendente');
  const concluidos = tasks.filter(t => t.status === 'Concluido');
  document.getElementById('countPendentes').textContent = pendentes.length;
  document.getElementById('countHistorico').textContent = concluidos.length;

  let list = activeTab === 'Pendente' ? pendentes : concluidos;
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(t => t.nome.toLowerCase().includes(q) || t.motivo.toLowerCase().includes(q));
  }
  if (activeMotivos.size > 0) list = list.filter(t => activeMotivos.has(t.motivo));
  list = list.slice().sort((a,b) => activeTab === 'Pendente'
    ? new Date(a.data_hora) - new Date(b.data_hora)
    : new Date(b.concluido_em || b.data_hora) - new Date(a.concluido_em || a.data_hora));

  renderHead();
  renderRows(list);
  renderChips();
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  document.getElementById('emptyState').style.display = list.length === 0 ? 'block' : 'none';
}

function renderHead() {
  const thead = document.getElementById('theadRow');
  thead.innerHTML = activeTab === 'Pendente'
    ? '<th>ID</th><th>Cliente</th><th>Motivo</th><th>Data/Hora</th><th>Anotações</th><th>Chat</th><th></th>'
    : '<th>ID</th><th>Cliente</th><th>Motivo</th><th>Concluído em</th><th>Duração</th><th>Anotações</th><th></th>';
}

function urgencyClass(iso) {
  const diff = minutesUntil(iso);
  if (diff < 0) return 'row-critical';
  if (diff <= WARNING_MINUTES) return 'row-warning';
  return '';
}

function renderRows(list) {
  document.getElementById('tableBody').innerHTML = list.map(t => {
    const isPending = t.status === 'Pendente';
    const links = `${t.link_chat ? `<a href="${t.link_chat}" target="_blank">chat</a>` : ''} ${t.link_ticket ? `<a href="${t.link_ticket}" target="_blank">ticket</a>` : ''}` || '—';
    const anot = t.anotacoes || '<span style="color:var(--text-3)">—</span>';

    if (isPending) {
      const diff = minutesUntil(t.data_hora);
      const timing = diff < 0 ? `<span class="cell-sub" style="color:var(--crit-text)">Atrasado ${Math.abs(diff)} min</span>`
        : diff <= WARNING_MINUTES ? `<span class="cell-sub" style="color:var(--warn-text)">Em ${diff} min</span>` : '';
      const pend = t.ultima_pendencia ? `<span class="cell-sub" style="color:var(--accent-indigo)">⏳ ${t.ultima_pendencia}</span>` : '';
      return `
        <tr class="${urgencyClass(t.data_hora)}" data-id="${t.id}">
          <td>#${t.empresa_id}</td>
          <td>${t.nome}${timing}${pend}</td>
          <td><span class="badge">${t.motivo}</span></td>
          <td>${formatDateTime(t.data_hora)}</td>
          <td>${anot}</td>
          <td>${links}</td>
          <td><div class="actions">
            <button class="act-btn" data-action="concluir" title="Concluir">✓</button>
            <button class="act-btn" data-action="adiar" title="Adiar">⏱</button>
            <button class="act-btn" data-action="editar" title="Editar">✎</button>
            <button class="act-btn" data-action="excluir" title="Excluir">✕</button>
          </div></td>
        </tr>`;
    }
    return `
      <tr data-id="${t.id}">
        <td>#${t.empresa_id}</td>
        <td>${t.nome}</td>
        <td><span class="badge">${t.motivo}</span></td>
        <td>${t.concluido_em ? formatDateTime(t.concluido_em) : '—'}</td>
        <td>${formatDuration(t.tempo_resolucao_min)}</td>
        <td>${anot}</td>
        <td><div class="actions">
          <button class="act-btn" data-action="reabrir" title="Reabrir">↺</button>
          <button class="act-btn" data-action="excluir" title="Excluir">✕</button>
        </div></td>
      </tr>`;
  }).join('');
}

function renderChips() {
  const wrap = document.getElementById('motivoChips');
  if (wrap.dataset.built === '1') {
    wrap.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', activeMotivos.has(c.dataset.m)));
    return;
  }
  wrap.dataset.built = '1';
  wrap.innerHTML = MOTIVOS.map(m => `<button class="chip" data-m="${m}">${m}</button>`).join('');
  wrap.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    activeMotivos.has(c.dataset.m) ? activeMotivos.delete(c.dataset.m) : activeMotivos.add(c.dataset.m);
    render();
  }));
}

document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { activeTab = b.dataset.tab; render(); }));
document.getElementById('searchInput').addEventListener('input', e => { searchQuery = e.target.value; render(); });

/* ---------- Painel criar/editar ---------- */
function openPanel(task) {
  editingId = task ? task.id : null;
  document.getElementById('panelTitle').textContent = task ? 'Editar Retorno' : 'Novo Retorno';
  document.getElementById('f_empresa_id').value = task ? task.empresa_id : '';
  document.getElementById('f_nome').value = task ? task.nome : '';
  document.getElementById('f_motivo').value = task ? task.motivo : 'Suporte';
  document.getElementById('f_data_hora').value = task ? toLocalInput(task.data_hora) : toLocalInput(new Date().toISOString());
  document.getElementById('f_link_chat').value = task ? (task.link_chat || '') : '';
  document.getElementById('f_link_ticket').value = task ? (task.link_ticket || '') : '';
  document.getElementById('f_anotacoes').value = task ? (task.anotacoes || '') : '';
  document.getElementById('f_pendencia').value = '';
  renderHistoryTimeline(task);
  document.getElementById('overlay').classList.add('open');
  document.getElementById('panel').classList.add('open');
}
function closePanel() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('panel').classList.remove('open');
  document.getElementById('taskForm').reset();
  editingId = null;
}
document.getElementById('btnNovo').addEventListener('click', () => openPanel(null));
document.getElementById('btnCancelar').addEventListener('click', closePanel);
document.getElementById('overlay').addEventListener('click', closePanel);

function renderHistoryTimeline(task) {
  const wrap = document.getElementById('historyWrap');
  if (!task) { wrap.innerHTML = ''; return; }
  const stages = (task.interacoes || []).slice();
  if (stages.length === 0 || stages[0].acao !== 'criacao') {
    stages.unshift({ data: task.criado_em, acao: 'criacao', definitivo: true });
  }
  const html = stages.map(it => {
    const cls = it.acao === 'conclusao' ? 'ok' : (it.definitivo === false ? 'warn' : '');
    const label = it.acao === 'conclusao' ? 'Encerrado'
      : it.definitivo === false ? (it.motivo_pendencia || 'Aguardando atualização')
      : it.acao === 'criacao' ? 'Aberto' : 'Reagendado';
    return `<div class="stage-node ${cls}"><span class="stage-dot"></span><span class="stage-label">${label}</span><span class="stage-time">${formatDateTime(it.data)}</span>${it.observacao ? `<p class="stage-obs">${it.observacao}</p>` : ''}</div>`;
  }).join('');
  wrap.innerHTML = `<div class="stage-track">${html}</div>`;
}

document.getElementById('taskForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    empresa_id: document.getElementById('f_empresa_id').value.trim(),
    nome: document.getElementById('f_nome').value.trim(),
    motivo: document.getElementById('f_motivo').value,
    data_hora: document.getElementById('f_data_hora').value,
    link_chat: document.getElementById('f_link_chat').value.trim(),
    link_ticket: document.getElementById('f_link_ticket').value.trim(),
    anotacoes: document.getElementById('f_anotacoes').value.trim()
  };
  const pendencia = document.getElementById('f_pendencia').value;
  try {
    if (editingId) {
      await api(`/api/tasks/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      if (pendencia) body.pendenciaInicial = pendencia;
      await api('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
    }
    closePanel();
    await loadTasks();
    showToast('Retorno salvo.');
  } catch (err) { showToast(err.message, 'crit'); }
});

/* ---------- Ações da linha ---------- */
document.getElementById('tableBody').addEventListener('click', async e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.closest('tr').dataset.id;
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const action = btn.dataset.action;

  if (action === 'editar') return openPanel(task);
  if (action === 'excluir') {
    if (!confirm(`Excluir o retorno de "${task.nome}"?`)) return;
    await api(`/api/tasks/${id}`, { method: 'DELETE' });
    await loadTasks();
    return showToast('Retorno excluído.');
  }
  if (action === 'reabrir') {
    await api(`/api/tasks/${id}/action`, { method: 'POST', body: JSON.stringify({ tipo: 'reabrir' }) });
    await loadTasks();
    return showToast('Retorno reaberto.');
  }
  if (action === 'concluir' || action === 'adiar') openActionDialog(task, action);
});

/* ---------- Diálogo: definitivo ou atualização ---------- */
function openActionDialog(task, tipo) {
  actionContext = { taskId: task.id, tipo };
  document.getElementById('actionTitle').textContent = tipo === 'concluir' ? 'Concluir retorno' : 'Adiar retorno';
  document.getElementById('actionQuestion').textContent = tipo === 'concluir'
    ? 'Esse retorno foi resolvido definitivamente?'
    : 'É só remarcar, ou está pendente de algo (aguardando setor, cliente etc)?';
  const sugestao = new Date(new Date(task.data_hora).getTime() + 24*3600000);
  document.getElementById('actionNovaData').value = toLocalInput(sugestao.toISOString());
  showStep('actionStep1');
  document.getElementById('actionBox').classList.add('open');
}
function closeActionDialog() { document.getElementById('actionBox').classList.remove('open'); actionContext = { taskId: null, tipo: null }; }
function showStep(id) { ['actionStep1','actionStep1b','actionStep2'].forEach(s => document.getElementById(s).style.display = s === id ? 'block' : 'none'); }

document.getElementById('actionYes').addEventListener('click', async () => {
  if (actionContext.tipo === 'concluir') {
    await api(`/api/tasks/${actionContext.taskId}/action`, { method: 'POST', body: JSON.stringify({ tipo: 'concluir', definitivo: true }) });
    closeActionDialog(); await loadTasks(); showToast('Retorno concluído.');
  } else {
    showStep('actionStep1b');
  }
});
document.getElementById('actionNo').addEventListener('click', () => showStep('actionStep2'));
document.getElementById('actionBack1b').addEventListener('click', () => showStep('actionStep1'));
document.getElementById('actionBack2').addEventListener('click', () => showStep('actionStep1'));

document.querySelectorAll('#actionStep1b [data-min]').forEach(b => b.addEventListener('click', async () => {
  await api(`/api/tasks/${actionContext.taskId}/action`, { method: 'POST', body: JSON.stringify({ tipo: 'adiar_rapido', minutos: parseInt(b.dataset.min,10) }) });
  closeActionDialog(); await loadTasks(); showToast('Retorno adiado.');
}));

document.getElementById('actionConfirm').addEventListener('click', async () => {
  const motivo_pendencia = document.getElementById('actionMotivo').value;
  const observacao = document.getElementById('actionObs').value.trim();
  const nova_data = document.getElementById('actionNovaData').value;
  if (!nova_data) return showToast('Informe o novo horário.', 'crit');
  const tipo = actionContext.tipo === 'concluir' ? 'concluir' : 'adiar_motivo';
  const body = { tipo, definitivo: false, motivo_pendencia, observacao, nova_data };
  await api(`/api/tasks/${actionContext.taskId}/action`, { method: 'POST', body: JSON.stringify(body) });
  document.getElementById('actionObs').value = '';
  closeActionDialog(); await loadTasks(); showToast('Atualização registrada.');
});

/* ---------- Boot ---------- */
checkSession().then(loadTasks);
setInterval(loadTasks, 30000); // reflete atrasos e mudanças a cada 30s
