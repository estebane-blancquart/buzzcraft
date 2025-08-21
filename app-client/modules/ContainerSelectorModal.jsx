import React, { useState } from 'react';
import Modal from '@components/Modal.jsx';
import Button from '@components/Button.jsx';

const CONTAINER_TYPES = [
  {
    type: 'div',
    name: 'Div',
    icon: 'í³¦',
    description: 'Conteneur simple',
    defaults: {
      name: 'Nouveau Div',
      classname: 'p-4',
      components: []
    }
  },
  {
    type: 'form',
    name: 'Formulaire',
    icon: 'í³',
    description: 'Formulaire avec champs',
    defaults: {
      name: 'Nouveau Formulaire',
      action: '/api/submit',
      method: 'POST',
      classname: 'max-w-lg mx-auto p-6 bg-gray-50 rounded-lg',
      inputs: [],
      buttons: [{
        type: 'submit',
        content: 'Envoyer',
        classname: 'bg-blue-600 text-white px-4 py-2 rounded'
      }]
    }
  },
  {
    type: 'list',
    name: 'Liste',
    icon: 'í³‹',
    description: 'Liste ul/ol',
    defaults: {
      name: 'Nouvelle Liste',
      tag: 'ul',
      classname: 'space-y-2',
      items: [
        { id: 'item-1', content: 'Premier Ã©lÃ©ment' },
        { id: 'item-2', content: 'DeuxiÃ¨me Ã©lÃ©ment' }
      ]
    }
  }
];

function ContainerSelectorModal({ isOpen, onClose, onSelectContainer }) {
  const [selectedType, setSelectedType] = useState(null);

  const handleContainerClick = (containerType) => {
    setSelectedType(containerType);
  };

  const handleConfirm = () => {
    if (selectedType) {
      const newContainer = {
        id: `${selectedType.type}-${Date.now()}`,
        type: selectedType.type,
        ...selectedType.defaults
      };
      
      onSelectContainer(newContainer);
      setSelectedType(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Choisir un conteneur">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--size-sm)' }}>
          SÃ©lectionnez le type de conteneur Ã  ajouter
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)'
      }}>
        {CONTAINER_TYPES.map((containerType) => (
          <div
            key={containerType.type}
            onClick={() => handleContainerClick(containerType)}
            style={{
              padding: 'var(--space-4)',
              border: selectedType?.type === containerType.type 
                ? '2px solid var(--color-primary)' 
                : '1px solid color-mix(in srgb, var(--color-bg-secondary) 85%, white 15%)',
              borderRadius: 'var(--radius-md)',
              background: selectedType?.type === containerType.type 
                ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-bg-secondary))'
                : 'var(--color-bg-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ 
              fontSize: '2rem', 
              marginBottom: 'var(--space-2)'
            }}>
              {containerType.icon}
            </div>
            
            <div style={{ 
              fontWeight: 600, 
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-1)'
            }}>
              {containerType.name}
            </div>
            
            <div style={{ 
              fontSize: 'var(--size-xs)', 
              color: 'var(--color-text-secondary)'
            }}>
              {containerType.description}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-4)', 
        justifyContent: 'flex-end' 
      }}>
        <Button variant="secondary" onClick={handleCancel}>
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={handleConfirm}
          disabled={!selectedType}
        >
          Ajouter {selectedType?.name || 'Conteneur'}
        </Button>
      </div>
    </Modal>
  );
}

export default ContainerSelectorModal;
