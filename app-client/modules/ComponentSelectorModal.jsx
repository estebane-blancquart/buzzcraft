import React, { useState } from 'react';
import { ELEMENT_TYPES } from '@config/constants.js';
import Modal from '@components/Modal.jsx';
import Button from '@components/Button.jsx';

const COMPONENT_TYPES = [
  {
    type: ELEMENT_TYPES.HEADING,
    name: 'Titre',
    icon: 'í³',
    description: 'Titres H1 Ã  H6',
    defaults: {
      tag: 'h2',
      content: 'Nouveau titre',
      classname: 'text-2xl font-bold'
    }
  },
  {
    type: ELEMENT_TYPES.PARAGRAPH,
    name: 'Paragraphe',
    icon: 'í³„',
    description: 'Texte simple',
    defaults: {
      content: 'Nouveau paragraphe de texte.',
      classname: 'text-base'
    }
  },
  {
    type: ELEMENT_TYPES.BUTTON,
    name: 'Bouton',
    icon: 'í´˜',
    description: 'Bouton ou lien',
    defaults: {
      content: 'Nouveau bouton',
      href: '',
      classname: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
    }
  },
  {
    type: ELEMENT_TYPES.IMAGE,
    name: 'Image',
    icon: 'í¶¼ï¸',
    description: 'Image avec src/alt',
    defaults: {
      src: 'https://picsum.photos/400/300',
      alt: 'Description de l\'image',
      classname: 'w-full rounded'
    }
  },
  {
    type: ELEMENT_TYPES.VIDEO,
    name: 'VidÃ©o',
    icon: 'í¾¥',
    description: 'Lecteur vidÃ©o',
    defaults: {
      src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4',
      controls: true,
      classname: 'w-full rounded'
    }
  },
  {
    type: ELEMENT_TYPES.LINK,
    name: 'Lien',
    icon: 'í´—',
    description: 'Lien hypertexte',
    defaults: {
      content: 'Nouveau lien',
      href: 'https://example.com',
      target: '_blank',
      classname: 'text-blue-600 hover:text-blue-800 underline'
    }
  }
];

function ComponentSelectorModal({ isOpen, onClose, onSelectComponent }) {
  const [selectedType, setSelectedType] = useState(null);

  const handleComponentClick = (componentType) => {
    setSelectedType(componentType);
  };

  const handleConfirm = () => {
    if (selectedType) {
      const newComponent = {
        id: `component-${Date.now()}`,
        type: selectedType.type,
        ...selectedType.defaults
      };
      
      onSelectComponent(newComponent);
      setSelectedType(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Choisir un composant">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--size-sm)' }}>
          SÃ©lectionnez le type de composant Ã  ajouter
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)'
      }}>
        {COMPONENT_TYPES.map((componentType) => (
          <div
            key={componentType.type}
            onClick={() => handleComponentClick(componentType)}
            style={{
              padding: 'var(--space-4)',
              border: selectedType?.type === componentType.type 
                ? '2px solid var(--color-primary)' 
                : '1px solid color-mix(in srgb, var(--color-bg-secondary) 85%, white 15%)',
              borderRadius: 'var(--radius-md)',
              background: selectedType?.type === componentType.type 
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
              {componentType.icon}
            </div>
            
            <div style={{ 
              fontWeight: 600, 
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-1)'
            }}>
              {componentType.name}
            </div>
            
            <div style={{ 
              fontSize: 'var(--size-xs)', 
              color: 'var(--color-text-secondary)'
            }}>
              {componentType.description}
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
          Ajouter {selectedType?.name || 'Composant'}
        </Button>
      </div>
    </Modal>
  );
}

export default ComponentSelectorModal;
