import { useEffect, useRef, useState } from 'react';

export default function Popover({ anchorEl, items, onClose }) {
  const ref = useRef(null);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!anchorEl) return;
    function reposition() { setRect(anchorEl.getBoundingClientRect()); }
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [anchorEl]);

  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target) && e.target !== anchorEl) onClose(); }
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onEsc); };
  }, [onClose, anchorEl]);

  if (!rect) return null;
  const style = { display:'block', top: rect.bottom + 6, left: Math.max(8, rect.right - 210) };

  return (
    <div className="popover open" style={style} ref={ref}>
      {items.map((it, i) => it.sep
        ? <div className="sep" key={i}></div>
        : it.label
          ? <div className="p-label" key={i}>{it.label}</div>
          : <button key={i} className={it.danger ? 'danger' : ''} onClick={() => { onClose(); it.action(); }}>{it.icon}{it.text}</button>
      )}
    </div>
  );
}
