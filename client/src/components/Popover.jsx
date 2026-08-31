import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function Popover({ anchorEl, items, onClose }) {
  const ref = useRef(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [style, setStyle] = useState({ visibility: 'hidden', top: 0, left: 0 });

  useEffect(() => {
    if (!anchorEl) return;
    function reposition() { setAnchorRect(anchorEl.getBoundingClientRect()); }
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [anchorEl]);

  useLayoutEffect(() => {
    if (!anchorRect || !ref.current) return;
    const popRect = ref.current.getBoundingClientRect();
    let top = anchorRect.bottom + 6;
    let left = anchorRect.right - popRect.width;
    if (left < 8) left = 8;
    if (left + popRect.width > window.innerWidth - 8) left = window.innerWidth - popRect.width - 8;
    if (top + popRect.height > window.innerHeight - 8) top = anchorRect.top - popRect.height - 6;
    if (top < 8) top = 8;
    setStyle({ visibility: 'visible', top, left });
  }, [anchorRect, items]);

  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target) && e.target !== anchorEl) onClose(); }
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onEsc); };
  }, [onClose, anchorEl]);

  if (!anchorRect) return null;

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
