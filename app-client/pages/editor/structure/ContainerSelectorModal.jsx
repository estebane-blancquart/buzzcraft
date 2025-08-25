import React from 'react';

function ContainerSelectorModal({ isOpen, onClose, onSelectContainer }) {
  const containerTypes = [
    { id: 'div', name: 'Div Container', icon: '���' },
    { id: 'list', name: 'List Container', icon: '���' },
    { id: 'form', name: 'Form Container', icon: '���' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem' }}>
        {containerTypes.map(type => (
          <button
            key={type.id}
            onClick={() => onSelectContainer(type.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              border: '1px solid var(--color-text-secondary)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
            <span>{type.name}</span>
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

export default ContainerSelectorModal;
