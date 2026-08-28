import { createContext, useCallback, useContext, useState } from 'react';
import { IconX } from '../components/icons.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, sub = '', type = 'ok', task = null, onSnooze = null) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, title, sub, type, task, onSnooze }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), task ? 20000 : 8000);
    return id;
  }, []);
  const dismissToast = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div style={{ flex: 1 }}>
              <p className="toast-title">{t.title}</p>
              {t.sub && <p className="toast-sub">{t.sub}</p>}
              {t.task && (
                <div className="toast-actions">
                  {[15,30,60].map(m => (
                    <button key={m} onClick={() => { t.onSnooze?.(t.task, m); dismissToast(t.id); }}>
                      {m === 60 ? '+1 h' : `+${m} min`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="toast-x" onClick={() => dismissToast(t.id)}>{IconX}</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
