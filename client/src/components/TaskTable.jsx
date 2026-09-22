import { PendingCard, DoneCard } from './TaskCard.jsx';

export default function TaskTable({
  activeTab, setActiveTab,
  countPendentes, countHistorico,
  list,
  onComplete, onEdit, onMore, onReopen,
}) {
  return (
    <>
      {/* ── Abas ─────────────────────────────────────────────────────────── */}
      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'pendentes' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendentes')}
        >
          Pendentes <span className="count">{countPendentes}</span>
        </button>
        <button
          className={`tab ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico <span className="count">{countHistorico}</span>
        </button>
      </nav>

      {/* ── Grid de cards ────────────────────────────────────────────────── */}
      {list.length === 0 ? (
        <div className="empty-state">
          <h3>{activeTab === 'pendentes' ? 'Nenhum retorno pendente' : 'Nenhum retorno concluído ainda'}</h3>
          <p>
            {activeTab === 'pendentes'
              ? 'A fila está limpa. Clique em "+ Novo Retorno" para agendar um contato.'
              : 'Os retornos marcados como concluídos aparecem aqui.'}
          </p>
        </div>
      ) : (
        <div className="task-grid">
          {list.map(t =>
            activeTab === 'pendentes'
              ? <PendingCard key={t.id} t={t} onComplete={onComplete} onEdit={onEdit} onMore={onMore} />
              : <DoneCard    key={t.id} t={t} onReopen={onReopen} onMore={onMore} />
          )}
        </div>
      )}
    </>
  );
}
