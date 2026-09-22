import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ICON_DASHBOARD = (
  <svg viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const ICON_ADMIN = (
  <svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M5 20C5 16.5 8 14 12 14C16 14 19 16.5 19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const ICON_LOGOUT = (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5A2 2 0 013 19V5A2 2 0 015 3H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ICON_CLOCK = (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2"/>
  </svg>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = (user?.nome || '?').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Marca */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">{ICON_CLOCK}</div>
        <span className="sidebar-brand-name">Retornos</span>
      </div>

      {/* Navegação */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Operação</p>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          {ICON_DASHBOARD}
          <span>Painel</span>
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            {ICON_ADMIN}
            <span>Usuários</span>
          </NavLink>
        )}
      </nav>

      {/* Rodapé: usuário + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.nome}</span>
            <span className="sidebar-user-role">{user?.role === 'admin' ? 'Admin' : 'Analista'}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Sair">
          {ICON_LOGOUT}
        </button>
      </div>
    </aside>
  );
}
