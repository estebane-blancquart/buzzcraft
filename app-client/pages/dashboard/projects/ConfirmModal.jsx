import React from 'react';

function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir continuer ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  loading = false
}) {
  return (
    <div isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ 
        margin: '0 0 var(--space-6) 0', 
        color: 'var(--color-text-primary)', 
        lineHeight: 1.5 
      }}>
        {message}
      </p>
      
      <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
        <button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </button>
        <button 
          variant="primary" 
          onClick={onConfirm} 
          loading={loading}
          style={{ background: 'var(--color-danger)' }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}

export default ConfirmModal;
