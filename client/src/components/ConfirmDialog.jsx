import { useEffect } from 'react';

export default function ConfirmDialog({
  title = '¿Confirmas esta acción?',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="confirm-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <div className={`confirm-icon ${danger ? 'confirm-icon-danger' : ''}`} aria-hidden="true">
          {danger ? '!' : '?'}
        </div>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-cancel" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`confirm-accept ${danger ? 'confirm-accept-danger' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
