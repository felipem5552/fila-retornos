import { useState } from 'react';

export default function Header({ searchQuery, setSearchQuery, idSearch, setIdSearch, onNovo, onFoco }) {
  const [idOpen, setIdOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="header-actions" style={{ flex:1 }}>
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
        <button className="btn btn-icon" title="Modo Foco" onClick={onFoco}>
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        <button className="btn btn-primary" onClick={onNovo}>+ Novo Retorno</button>
      </div>
    </header>
  );
}
