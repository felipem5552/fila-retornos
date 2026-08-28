import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Popover({ anchorRect, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    // Atraso de 1 tick: evita que o MESMO clique que abriu o menu
    // (o clique nos "⋮") seja interpretado como "clique fora" e feche
    // o popover imediatamente antes de aparecer na tela.
    const t = setTimeout(() => {
      function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
      function onEsc(e) { if (e.key === 'Escape') onClose(); }
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onEsc);
      ref.current.__cleanup = () => {
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onEsc);
      };
    }, 0);
    return () => { clearTimeout(t); ref.current?.__cleanup?.(); };
  }, [onClose]);

  if (!anchorRect) return null;

  const width = 220;
  let left = anchorRect.right - width;
  if (left < 8) left = 8;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
  let top = anchorRect.bottom + 6;
  const estimatedHeight = Math.min(items.length * 36 + 20, 400);
  if (top + estimatedHeight > window.innerHeight - 8) top = Math.max(8, anchorRect.top - estimatedHeight - 6);

  const style = { display: 'block', position: 'fixed', top, left, width, zIndex: 9999 };

  return createPortal(
    <div className="popover open" style={style} ref={ref} onClick={(e) => e.stopPropagation()}>
      {items.map((it, i) => it.sep
        ? <div className="sep" key={i}></div>
        : it.label
          ? <div className="p-label" key={i}>{it.label}</div>
          : <button key={i} className={it.danger ? 'danger' : ''} onClick={() => { onClose(); it.action(); }}>{it.icon}{it.text}</button>
      )}
    </div>,
    document.body
  );
}
