import { useEffect, useRef } from 'react';

export default function Popover({ anchorRect, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onEsc); };
  }, [onClose]);

  if (!anchorRect) return null;
  const style = { display:'block', top: anchorRect.bottom + 6, left: Math.max(8, anchorRect.right - 210) };

  return (
    <div className="popover open" style={style} ref={ref}>
      {items.map((it, i) => it.sep
        ? <div className="sep" key={i}></div>
        : it.label
          ? <div className="p-label" key={i}>{it.label}</div>
          : <button key={i} className={it.danger ? 'danger' : ''} onClick={() => { onClose(); it.action(); }}>{it.text}</button>
      )}
    </div>
  );
}
