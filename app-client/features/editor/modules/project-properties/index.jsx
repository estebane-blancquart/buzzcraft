import React, { useState } from 'react';

export default function ProjectProperties({ selectedElement, device, onElementUpdate }) {
  const [localValues, setLocalValues] = useState({});

  if (!selectedElement || !selectedElement.element) {
    return (
      <div className="project-properties">
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
    
    const updatedElement = {
      ...element,
      [field]: value
    };
    
    onElementUpdate(path, updatedElement);
  };

  const getValue = (field) => {
    return localValues[field] !== undefined ? localValues[field] : element[field] || '';
  };

  return (
    <div className="project-properties">
      <div className="properties-header">
        <h3>Propriétés</h3>
        <span className="element-type">{element.type || 'Element'}</span>
      </div>

      <div className="properties-device-indicator">
        <span className="device-label">{device.toUpperCase()}</span>
      </div>

      <div className="properties-content">
        <div className="property-field">
          <label>ID</label>
          <input
            type="text"
            value={getValue('id')}
            onChange={(e) => handleInputChange('id', e.target.value)}
          />
        </div>

        <div className="property-field">
          <label>Nom</label>
          <input
            type="text"
            value={getValue('name')}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        {element.type === 'heading' && (
          <div className="property-field">
            <label>Balise</label>
            <select
              value={getValue('tag')}
              onChange={(e) => handleInputChange('tag', e.target.value)}
            >
              <option value="h1">h1</option>
              <option value="h2">h2</option>
              <option value="h3">h3</option>
              <option value="h4">h4</option>
              <option value="h5">h5</option>
              <option value="h6">h6</option>
            </select>
          </div>
        )}

        {(element.type === 'heading' || element.type === 'paragraph') && (
          <div className="property-field">
            <label>Contenu</label>
            <input
              type="text"
              value={getValue('content')}
              onChange={(e) => handleInputChange('content', e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}