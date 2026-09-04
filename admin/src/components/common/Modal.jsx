import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, title, description, onClose, children, width='560px' }) {
  const titleId = React.useId();
  const closeRef = React.useRef(null);
  const previousFocusRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}>
    <section className="modal-card" style={{maxWidth:width}} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-head"><div><h2 id={titleId}>{title}</h2>{description&&<p>{description}</p>}</div><button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}
