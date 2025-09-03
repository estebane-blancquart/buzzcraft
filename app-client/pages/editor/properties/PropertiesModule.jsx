import React from 'react';
import PropertyField from './PropertyField.jsx';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Container propriétés avec PropertyField multiples + header
 * REÇOIT : selectedElement, device, onElementUpdate
 * RETOURNE : Module complet édition propriétés
 * ERREURS : Défensif avec élément non sélectionné
 */

function PropertiesModule({ 
  selectedElement = null, 
  device = DEVICES.DESKTOP, 
  onElementUpdate = () => {} 
}) {
  const getDeviceLabel = () => {
    const deviceLabels = {
      [DEVICES.DESKTOP]: 'Desktop',
      [DEVICES.TABLET]: 'Tablet',
      [DEVICES.MOBILE]: 'Mobile'
    };
    return deviceLabels[device] || 'Unknown';
  };

  const getElementTypeLabel = () => {
    if (!selectedElement?.type) return 'Unknown';
    return selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1);
  };

  const handlePropertyChange = (propertyName, value) => {
    if (selectedElement && onElementUpdate) {
      onElementUpdate(selectedElement.id, { [propertyName]: value });
    }
  };

  const renderPropertyFields = () => {
    if (!selectedElement) return null;

    const commonFields = [
      { key: 'id', label: 'ID', type: 'text', disabled: true },
      { key: 'classname', label: 'CSS Classes', type: 'text' }
    ];

    const typeSpecificFields = {
      heading: [
        { key: 'content', label: 'Content', type: 'text' },
        { key: 'tag', label: 'Tag', type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }
      ],
      paragraph: [
        { key: 'content', label: 'Content', type: 'textarea' }
      ],
      button: [
        { key: 'content', label: 'Text', type: 'text' },
        { key: 'href', label: 'Link URL', type: 'text' }
      ],
      image: [
        { key: 'src', label: 'Image URL', type: 'text' },
        { key: 'alt', label: 'Alt Text', type: 'text' },
        { key: 'width', label: 'Width', type: 'number' },
        { key: 'height', label: 'Height', type: 'number' }
      ],
      video: [
        { key: 'src', label: 'Video URL', type: 'text' },
        { key: 'controls', label: 'Show Controls', type: 'checkbox' },
        { key: 'autoplay', label: 'Autoplay', type: 'checkbox' },
        { key: 'loop', label: 'Loop', type: 'checkbox' }
      ],
      link: [
        { key: 'content', label: 'Text', type: 'text' },
        { key: 'href', label: 'URL', type: 'text' },
        { key: 'target', label: 'Target', type: 'select', options: ['_self', '_blank', '_parent', '_top'] }
      ]
    };

    const specificFields = typeSpecificFields[selectedElement.type] || [];
    const allFields = [...commonFields, ...specificFields];

    return allFields.map(field => {
      const value = selectedElement[field.key] || '';
      
      if (field.type === 'select') {
        return (
          <PropertyField
            key={field.key}
            label={field.label}
            value={value}
            type="select"
            onChange={(newValue) => handlePropertyChange(field.key, newValue)}
            disabled={field.disabled}
          >
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </PropertyField>
        );
      }

      return (
        <PropertyField
          key={field.key}
          label={field.label}
          value={field.type === 'checkbox' ? !!value : value}
          type={field.type}
          onChange={(newValue) => handlePropertyChange(field.key, newValue)}
          disabled={field.disabled}
        />
      );
    });
  };

  return (
    <div className="project-properties">      
      <div className="properties-content">
        {selectedElement ? (
          <div className="properties-form">
            {renderPropertyFields()}
          </div>
        ) : (
          <div className="properties-empty">
            Select an element to edit properties
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertiesModule;