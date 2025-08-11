import React, { useState } from 'react';

/*
 * FAIT QUOI : Panel propriétés de l'élément sélectionné (panel droite)
 * REÇOIT : selectedElement: object, device: string, onElementUpdate: function
 * RETOURNE : JSX formulaire propriétés
 */

export default function PropertiesPanel({ selectedElement, device, onElementUpdate }) {
  const [localValues, setLocalValues] = useState({});

  if (!selectedElement || !selectedElement.element) {
    return (
      <div className="properties-panel">
        <div className="properties-header">
          <h3>Propriétés</h3>
        </div>
        <div className="properties-empty">
          <p>Sélectionnez un élément pour éditer ses propriétés</p>
        </div>
      </div>
    );
  }

  const { element, path } = selectedElement;

  const handleInputChange = (field, value) => {
    setLocalValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update immédiat pour preview temps réel
    const updatedElement = {
      ...element,
      [field]: value
    };
    
    onElementUpdate(path, updatedElement);
  };

  const getValue = (field) => {
    return localValues[field] !== undefined ? localValues[field] : element[field] || '';
  };

  const renderField = (fieldName, fieldConfig) => {
    const value = getValue(fieldName);

    switch (fieldConfig.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={fieldConfig.default || ''}
          />
        );

      case 'enum':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
          >
            {fieldConfig.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleInputChange(fieldName, e.target.checked)}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(fieldName, parseInt(e.target.value) || 0)}
            placeholder={fieldConfig.default?.toString() || '0'}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={fieldConfig.default || ''}
          />
        );
    }
  };

  // Champs de base pour tous les éléments
  const baseFields = {
    id: { type: 'string', label: 'ID' },
    name: { type: 'string', label: 'Nom' },
    classname: { type: 'string', label: 'Classes CSS' }
  };

  // Champs spécifiques selon le type
  const getTypeSpecificFields = () => {
    switch (element.type) {
      case 'heading':
        return {
          content: { type: 'string', label: 'Contenu' },
          tag: { type: 'enum', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], label: 'Balise' }
        };

      case 'paragraph':
        return {
          content: { type: 'string', label: 'Contenu' }
        };

      case 'button':
        return {
          content: { type: 'string', label: 'Texte' },
          href: { type: 'string', label: 'Lien' }
        };

      case 'image':
        return {
          src: { type: 'string', label: 'URL Image' },
          alt: { type: 'string', label: 'Texte alternatif' },
          width: { type: 'number', label: 'Largeur' },
          height: { type: 'number', label: 'Hauteur' }
        };

      case 'link':
        return {
          content: { type: 'string', label: 'Texte' },
          href: { type: 'string', label: 'URL' },
          target: { type: 'enum', options: ['_self', '_blank', '_parent', '_top'], label: 'Cible' }
        };

      default:
        return {};
    }
  };

  const allFields = { ...baseFields, ...getTypeSpecificFields() };

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>Propriétés</h3>
        <span className="element-type">{element.type || 'Element'}</span>
      </div>

      <div className="properties-device-indicator">
        <span className="device-label">{device.toUpperCase()}</span>
      </div>

      <div className="properties-content">
        {Object.entries(allFields).map(([fieldName, fieldConfig]) => (
          <div key={fieldName} className="property-field">
            <label>
              {fieldConfig.label}
              {fieldConfig.required && <span className="required">*</span>}
            </label>
            {renderField(fieldName, fieldConfig)}
          </div>
        ))}

        {element.type === 'div' && element.components && (
          <div className="property-section">
            <h4>Composants ({element.components.length})</h4>
            <div className="components-list">
              {element.components.map((comp, index) => (
                <div key={index} className="component-item">
                  {comp.type}: {comp.content || comp.id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}