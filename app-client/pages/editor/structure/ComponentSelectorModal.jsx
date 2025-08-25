import React from 'react';

function ComponentSelectorModal({ isOpen, onClose, onSelectComponent }) {
  const componentTypes = [
    { id: 'heading', name: 'Heading', icon: '���' },
    { id: 'paragraph', name: 'Paragraph', icon: '���' },
    { id: 'button', name: 'Button', icon: '���' },
    { id: 'image', name: 'Image', icon: '���️' },
    { id: 'video', name: 'Video', icon: '���' },
    { id: 'link', name: 'Link', icon: '���' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Component">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {componentTypes.map(type => (
          <button
            key={type.id}
            onClick={() => onSelectComponent(type.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem',
              border: '1px solid var(--color-text-secondary)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer'
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

export default ComponentSelectorModal;
