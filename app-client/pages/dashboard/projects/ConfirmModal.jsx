import React from 'react';

/*
 * FAIT QUOI : Modal de confirmation générique
 * REÇOIT : isOpen, onClose, onConfirm, title, message, confirmText, cancelText, loading
 * RETOURNE : Modal avec actions confirm/cancel
 * ERREURS : Défensif avec props par défaut
 */

function ConfirmModal({ 
  isOpen = false, 
  onClose = () => {}, 
  onConfirm = () => {}, 
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir continuer ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  loading = false
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!loading && onConfirm) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading && onClose) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={handleClose} className="modal-close" disabled={loading}>×</button>
        </div>
        
        <div className="modal-body">
          <p>{message}</p>
        </div>
        
        <div className="modal-footer">
          <button onClick={handleClose} disabled={loading} className="btn-secondary">
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={loading}
            className="btn-danger"
          >
            {loading ? 'En cours...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;