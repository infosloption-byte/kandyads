import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, title, description, onClose, children, width='560px' }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previous; };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}>
    <section className="modal-card" style={{maxWidth:width}} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-head"><div><h2 id="modal-title">{title}</h2>{description&&<p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}
