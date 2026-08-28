import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header({ searchQuery, setSearchQuery, idSearch, setIdSearch, onNovo }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [idOpen, setIdOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 6V12L16 14" stroke="#04211C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#04211C" strokeWidth="2.2"/></svg>
        </div>
        <div className="brand-text">
          <h1>Fila de Retornos</h1>
          <p>Gestão de retornos de clientes · Customer Success</p>
        </div>
      </div>

      <div className="header-actions">
        <div className="search-wrap">
          <div className="search-box">
            <button className="search-icon-btn" title="Buscar por ID" onClick={() => setIdOpen(o => !o)}>
              <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <input className="search-input" type="text" placeholder="Buscar por nome ou motivo…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className={`id-search-box ${idOpen ? 'open' : ''}`}>
            <input type="text" placeholder="ID da empresa…" value={idSearch}
              onChange={e => setIdSearch(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={onNovo}>+ Novo Retorno</button>
        <span className="user-pill" style={{ fontSize:12.5, color:'var(--text-secondary)' }}>{user?.nome}</span>
        {user?.role === 'admin' && <button className="btn btn-sm" onClick={() => navigate('/admin')}>Painel Admin</button>}
        <button className="btn btn-sm" onClick={handleLogout}>Sair</button>
      </div>
    </header>
  );
}
