import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() { await logout(); navigate('/login', { replace: true }); }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 6V12L16 14" stroke="#04211C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#04211C" strokeWidth="2.2"/></svg>
        </div>
        <span>Fila de Retornos</span>
      </div>

      <div className="sidebar-section-label">Operação</div>
      <nav className="sidebar-nav">
        <a className="sidebar-link active">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>
          Painel
        </a>
        {user?.role === 'admin' && (
          <a className="sidebar-link" onClick={() => navigate('/admin')}>
            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8"/><path d="M5 20C5 16.5 8 14 12 14C16 14 19 16.5 19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Painel Admin
          </a>
        )}
      </nav>

      <div className="sidebar-spacer"></div>

      <div className="sidebar-user">
        <div className="user-avatar">{(user?.nome || '?').slice(0,2).toUpperCase()}</div>
        <div className="user-meta"><strong>{user?.nome}</strong><span>usuário</span></div>
      </div>
      <a className="sidebar-link sidebar-logout" onClick={handleLogout}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5A2 2 0 013 19V5A2 2 0 015 3H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Sair
      </a>
    </aside>
  );
}
