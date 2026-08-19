// client/src/components/Popover.jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Renderizado via Portal direto no <body>: assim ele nunca fica preso
// pelo overflow:hidden/auto da tabela, independente de onde o botão
// que o abriu esteja no DOM.
export default function Popover({ anchorRect, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    const t = setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 0);
    document.addEventListener('keydown', onEsc);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  const width = 210;
  const style = {
    display: 'block',
    position: 'fixed',
    top: anchorRect.bottom + 6,
    left: Math.max(8, Math.min(anchorRect.right - width, window.innerWidth - width - 8)),
  };

  return createPortal(
    <div className="popover open" style={style} ref={ref}>
      {items.map((it, i) => it.sep
        ? <div className="sep" key={i}></div>
        : it.label
          ? <div className="p-label" key={i}>{it.label}</div>
          : <button key={i} className={it.danger ? 'danger' : ''} onClick={() => { onClose(); it.action(); }}>{it.text}</button>
      )}
    </div>,
    document.body
  );
}