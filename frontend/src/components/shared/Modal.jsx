import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Generic modal container.
 *
 * Props:
 *   isOpen   boolean        — controls visibility
 *   onClose  () => void     — called on overlay click or × button
 *   title    string         — header title
 *   footer   ReactNode      — optional footer slot (buttons go here)
 *   maxWidth number         — override max-width in px (default 480)
 *   children ReactNode      — body content
 */
export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 480 }) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="ccp-modal-overlay modal-overlay open" onClick={onClose}>
      <div
        className="ccp-modal-box modal-box"
        style={maxWidth !== 480 ? { maxWidth } : undefined}
        onClick={e => e.stopPropagation()}
      >
        <div className="ccp-modal-header modal-header">
          <div className="ccp-modal-title modal-title">{title}</div>
          <button className="ccp-modal-close modal-close" onClick={onClose} aria-label="Close modal">
            <span className="material-symbols-rounded icon">close</span>
          </button>
        </div>

        <div className="ccp-modal-body modal-body">{children}</div>

        {footer && <div className="ccp-modal-footer modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
