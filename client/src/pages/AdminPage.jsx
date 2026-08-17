import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UsersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const EMPTY = { id:null, nome:'', username:'', password:'', role:'user' };

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const editing = !!form.id;

  async function load() { setUsers(await UsersAPI.list()); }
  useEffect(() => { load(); }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function startEdit(u) { setForm({ id:u.id, nome:u.nome, username:u.username, password:'', role:u.role }); window.scrollTo({ top:0, behavior:'smooth' }); }
  function resetForm() { setForm(EMPTY); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editing && (!form.password || form.password.length < 6)) {
      return showToast('A senha precisa ter pelo menos 6 caracteres.', '', 'crit');
    }
    try {
      if (editing) {
        const body = { nome: form.nome, role: form.role, ...(form.password ? { password: form.password } : {}) };
        await UsersAPI.update(form.id, body);
        showToast('Usuário atualizado.');
      } else {
        await UsersAPI.create({ nome: form.nome, username: form.username, role: form.role, password: form.password });
        showToast('Usuário criado.');
      }
      resetForm(); load();
    } catch (err) { showToast(err.message, '', 'crit'); }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este usuário? Os retornos dele também serão apagados.')) return;
    try { await UsersAPI.remove(id); showToast('Usuário excluído.'); load(); }
    catch (err) { showToast(err.message, '', 'crit'); }
  }

  async function handleLogout() { await logout(); navigate('/login', { replace:true }); }

  return (
    <div>
      <header className="topbar">
        <div className="brand"><span className="brand-mark"></span> Painel Admin</div>
        <div className="nav-actions">
          <span className="user-pill">{user?.nome} (admin)</span>
          <Link className="btn btn-sm" to="/">Ir para o app</Link>
          <button className="btn btn-sm" onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <div className="shell" style={{ maxWidth:760 }}>
        <h1 style={{ fontSize:18, margin:'0 0 4px' }}>Gestão de usuários</h1>
        <p style={{ fontSize:13, color:'var(--text-tertiary)', margin:'0 0 22px' }}>Cadastre os logins da equipe. Cada pessoa só enxerga a própria fila de retornos.</p>

        <form className="card" onSubmit={handleSubmit} style={{ padding:'18px 20px', marginBottom:22 }}>
          <h2 style={{ fontSize:14, margin:'0 0 14px' }}>{editing ? `Editando: ${form.nome}` : 'Novo usuário'}</h2>
          <div className="field-row">
            <div className="field"><label>Nome</label><input required value={form.nome} onChange={e => set('nome', e.target.value)} /></div>
            <div className="field"><label>Login</label><input required disabled={editing} value={form.username} onChange={e => set('username', e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Senha {editing && <span style={{ fontWeight:400, color:'var(--text-tertiary)' }}>(deixe em branco para manter)</span>}</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="field">
              <label>Papel</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="user">Usuário (fila própria)</option>
                <option value="admin">Admin (gerencia usuários)</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="submit" className="btn btn-primary">{editing ? 'Salvar alterações' : 'Criar usuário'}</button>
            {editing && <button type="button" className="btn" onClick={resetForm}>Cancelar edição</button>}
          </div>
        </form>

        <div className="card">
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left', fontSize:11, textTransform:'uppercase', color:'var(--text-tertiary)', padding:'10px 12px', borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-elevated)' }}>Nome</th>
                <th style={{ textAlign:'left', fontSize:11, textTransform:'uppercase', color:'var(--text-tertiary)', padding:'10px 12px', borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-elevated)' }}>Login</th>
                <th style={{ textAlign:'left', fontSize:11, textTransform:'uppercase', color:'var(--text-tertiary)', padding:'10px 12px', borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-elevated)' }}>Papel</th>
                <th style={{ textAlign:'left', fontSize:11, textTransform:'uppercase', color:'var(--text-tertiary)', padding:'10px 12px', borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-elevated)' }}>Criado em</th>
                <th style={{ background:'var(--bg-elevated)' }}></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={5} style={{ padding:'10px 12px', fontSize:13 }}>Nenhum usuário cadastrado.</td></tr>}
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding:'10px 12px', fontSize:13, borderBottom:'1px solid var(--border-subtle)' }}>{u.nome}</td>
                  <td style={{ padding:'10px 12px', fontSize:13, borderBottom:'1px solid var(--border-subtle)' }}>{u.username}</td>
                  <td style={{ padding:'10px 12px', fontSize:13, borderBottom:'1px solid var(--border-subtle)' }}>
                    <span className={`badge role-${u.role}`}>{u.role === 'admin' ? 'Admin' : 'Usuário'}</span>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:13, borderBottom:'1px solid var(--border-subtle)' }}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--border-subtle)' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-sm" onClick={() => startEdit(u)}>Editar</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
