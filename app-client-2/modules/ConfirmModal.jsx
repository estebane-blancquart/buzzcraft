import React from 'react';
import Modal from '@components/Modal.jsx';
import Button from '@components/Button.jsx';

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
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ 
        margin: '0 0 var(--space-6) 0', 
        color: 'var(--color-text-primary)', 
        lineHeight: 1.5 
      }}>
        {message}
      </p>
      
      <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button 
          variant="primary" 
          onClick={onConfirm} 
          loading={loading}
          style={{ background: 'var(--color-danger)' }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
