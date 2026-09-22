import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const EMPTY = { id: null, nome: '', username: '', password: '', role: 'user' };

function UserAvatar({ nome }) {
  const initials = (nome || '?').slice(0, 2).toUpperCase();
  return <div className="admin-avatar">{initials}</div>;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [users,  setUsers]  = useState([]);
  const [form,   setForm]   = useState(EMPTY);
  const editing = !!form.id;

  const load = useCallback(async () => {
    try { setUsers(await UsersAPI.list()); }
    catch (err) { showToast(err.message, '', 'crit'); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function startEdit(u)   { setForm({ id: u.id, nome: u.nome, username: u.username, password: '', role: u.role }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function resetForm()    { setForm(EMPTY); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editing && (!form.password || form.password.length < 6)) {
      return showToast('A senha precisa ter pelo menos 6 caracteres.', '', 'crit');
    }
    try {
      if (editing) {
        await UsersAPI.update(form.id, { nome: form.nome, role: form.role, ...(form.password ? { password: form.password } : {}) });
        showToast('Usuário atualizado.');
      } else {
        await UsersAPI.create({ nome: form.nome, username: form.username, role: form.role, password: form.password });
        showToast('Usuário criado.');
      }
      resetForm();
      load();
    } catch (err) { showToast(err.message, '', 'crit'); }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este usuário? Os retornos dele também serão apagados.')) return;
    try { await UsersAPI.remove(id); showToast('Usuário excluído.'); load(); }
    catch (err) { showToast(err.message, '', 'crit'); }
  }

  return (
    <div className="page-admin">

      {/* ── Cabeçalho da página ──────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">Gerencie os logins da equipe. Cada analista enxerga só a própria fila.</p>
        </div>
        <div className="page-header-right">
          <button className="btn" onClick={() => navigate('/')}>← Voltar ao painel</button>
        </div>
      </div>

      <div className="admin-layout">

        {/* ── Formulário de criação / edição ───────────────────────────── */}
        <section className="admin-form-section">
          <div className="admin-form-card">
            <div className="admin-form-card__header">
              {editing ? (
                <>
                  <UserAvatar nome={form.nome} />
                  <div>
                    <h2 className="admin-form-card__title">Editando usuário</h2>
                    <p className="admin-form-card__sub">{form.nome}</p>
                  </div>
                </>
              ) : (
                <h2 className="admin-form-card__title">Novo usuário</h2>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-row">
                <div className="field">
                  <label>Nome completo</label>
                  <input required value={form.nome} onChange={e => setField('nome', e.target.value)} placeholder="Ex: Felipe Santos" />
                </div>
                <div className="field">
                  <label>Login</label>
                  <input required disabled={editing} value={form.username} onChange={e => setField('username', e.target.value)} placeholder="Ex: felipe" />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>
                    Senha{' '}
                    {editing && <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(em branco = manter atual)</span>}
                  </label>
                  <input type="password" value={form.password} onChange={e => setField('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="field">
                  <label>Papel</label>
                  <select value={form.role} onChange={e => setField('role', e.target.value)}>
                    <option value="user">Analista — vê só a própria fila</option>
                    <option value="admin">Admin — gerencia usuários</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Salvar alterações' : 'Criar usuário'}
                </button>
                {editing && (
                  <button type="button" className="btn" onClick={resetForm}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* ── Lista de usuários ────────────────────────────────────────── */}
        <section className="admin-list-section">
          <h2 className="admin-list-title">Equipe cadastrada <span className="admin-list-count">{users.length}</span></h2>

          {users.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Nenhum usuário cadastrado ainda.</p>
          ) : (
            <div className="admin-user-list">
              {users.map(u => (
                <div key={u.id} className={`admin-user-card${u.id === user?.id ? ' admin-user-card--me' : ''}`}>
                  <UserAvatar nome={u.nome} />
                  <div className="admin-user-card__info">
                    <span className="admin-user-card__name">
                      {u.nome}
                      {u.id === user?.id && <span className="admin-user-card__you">você</span>}
                    </span>
                    <span className="admin-user-card__username">@{u.username}</span>
                  </div>
                  <span className={`badge role-${u.role}`}>{u.role === 'admin' ? 'Admin' : 'Analista'}</span>
                  <span className="admin-user-card__date">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="admin-user-card__actions">
                    <button className="btn btn-sm" onClick={() => startEdit(u)}>Editar</button>
                    {u.id !== user?.id && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Excluir</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
