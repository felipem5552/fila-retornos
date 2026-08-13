/* ==================================================================
   PAINEL ADMIN — gestão de usuários (criar / editar / excluir).
   Todo acesso passa pela API; o servidor confirma de novo que quem
   está pedindo é realmente admin (nunca confia só no front-end).
   ================================================================== */
let editingId = null;

function showToast(text, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<b>${type === 'crit' ? 'Erro' : 'Pronto'}</b>${text}`;
  document.getElementById('toastStack').appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

async function checkSessionIsAdmin() {
  const res = await fetch('/api/auth/me');
  if (!res.ok) { window.location.href = 'login.html'; return; }
  const me = await res.json();
  if (me.role !== 'admin') { window.location.href = 'app.html'; return; }
  document.getElementById('whoami').textContent = `${me.nome} (admin)`;
}

async function loadUsers() {
  const res = await fetch('/api/users');
  const users = await res.json();
  const tbody = document.getElementById('usersBody');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.nome}</td>
      <td>${u.username}</td>
      <td><span class="badge role-${u.role}">${u.role === 'admin' ? 'Admin' : 'Usuário'}</span></td>
      <td>${new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm" data-edit="${u.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-del="${u.id}">Excluir</button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="5">Nenhum usuário cadastrado.</td></tr>';

  tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => startEdit(users, b.dataset.edit)));
  tbody.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteUser(b.dataset.del)));
}

function startEdit(users, id) {
  const u = users.find(x => x.id === id);
  if (!u) return;
  editingId = id;
  document.getElementById('formTitle').textContent = `Editando: ${u.nome}`;
  document.getElementById('f_id').value = u.id;
  document.getElementById('f_nome').value = u.nome;
  document.getElementById('f_username').value = u.username;
  document.getElementById('f_role').value = u.role;
  document.getElementById('f_password').value = '';
  document.getElementById('passwordHint').textContent = '(deixe em branco para manter a atual)';
  document.getElementById('btnSalvar').textContent = 'Salvar alterações';
  document.getElementById('btnCancelarEdicao').style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  document.getElementById('userForm').reset();
  document.getElementById('formTitle').textContent = 'Novo usuário';
  document.getElementById('passwordHint').textContent = '';
  document.getElementById('btnSalvar').textContent = 'Criar usuário';
  document.getElementById('btnCancelarEdicao').style.display = 'none';
}

async function deleteUser(id) {
  if (!confirm('Excluir este usuário? Os retornos dele também serão apagados.')) return;
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) return showToast(data.error, 'crit');
  showToast('Usuário excluído.');
  loadUsers();
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('f_nome').value.trim();
  const username = document.getElementById('f_username').value.trim();
  const password = document.getElementById('f_password').value;
  const role = document.getElementById('f_role').value;

  if (!editingId && (!password || password.length < 6)) {
    return showToast('A senha precisa ter pelo menos 6 caracteres.', 'crit');
  }

  const url = editingId ? `/api/users/${editingId}` : '/api/users';
  const method = editingId ? 'PUT' : 'POST';
  const body = editingId
    ? { nome, role, ...(password ? { password } : {}) }
    : { nome, username, role, password };

  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) return showToast(data.error, 'crit');

  showToast(editingId ? 'Usuário atualizado.' : 'Usuário criado.');
  resetForm();
  loadUsers();
});

document.getElementById('btnCancelarEdicao').addEventListener('click', resetForm);
document.getElementById('btnLogout').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = 'login.html';
});

checkSessionIsAdmin().then(loadUsers);
