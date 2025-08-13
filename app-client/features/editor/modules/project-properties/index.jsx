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
          <p>Sélectionnez un élément</p>
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

  const renderField = (field, label, type = 'text', options = null) => (
    <div className="property-field" key={field}>
      <label>{label}</label>
      {type === 'select' ? (
        <select
          value={getValue(field)}
          onChange={(e) => handleInputChange(field, e.target.value)}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={getValue(field)}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={`${label}...`}
        />
      )}
    </div>
  );

  const getElementFields = () => {
    const commonFields = [
      { field: 'id', label: 'ID' },
      { field: 'name', label: 'Nom' }
    ];

    const typeFields = {
      page: [
        { field: 'name', label: 'Nom de la page' }
      ],
      section: [
        { field: 'name', label: 'Nom de la section' },
        { field: 'desktop', label: 'Colonnes Desktop', type: 'select', options: [
          { value: 1, label: '1 colonne' },
          { value: 2, label: '2 colonnes' },
          { value: 3, label: '3 colonnes' }
        ]},
        { field: 'tablet', label: 'Colonnes Tablet', type: 'select', options: [
          { value: 1, label: '1 colonne' },
          { value: 2, label: '2 colonnes' }
        ]},
        { field: 'mobile', label: 'Colonnes Mobile', type: 'select', options: [
          { value: 1, label: '1 colonne' }
        ]}
      ],
      div: [
        { field: 'name', label: 'Nom du div' },
        { field: 'classname', label: 'Classes CSS' }
      ],
      heading: [
        { field: 'tag', label: 'Balise', type: 'select', options: [
          { value: 'h1', label: 'h1' },
          { value: 'h2', label: 'h2' },
          { value: 'h3', label: 'h3' },
          { value: 'h4', label: 'h4' },
          { value: 'h5', label: 'h5' },
          { value: 'h6', label: 'h6' }
        ]},
        { field: 'content', label: 'Contenu' },
        { field: 'classname', label: 'Classes CSS' }
      ],
      paragraph: [
        { field: 'content', label: 'Contenu' },
        { field: 'classname', label: 'Classes CSS' }
      ],
      button: [
        { field: 'content', label: 'Texte du bouton' },
        { field: 'href', label: 'Lien (optionnel)' },
        { field: 'classname', label: 'Classes CSS' }
      ],
      image: [
        { field: 'src', label: 'URL de l\'image' },
        { field: 'alt', label: 'Texte alternatif' },
        { field: 'classname', label: 'Classes CSS' }
      ]
    };

    const elementType = element.type || 'div';
    const fields = typeFields[elementType] || commonFields;
    
    return fields;
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
        {getElementFields().map(({ field, label, type, options }) => 
          renderField(field, label, type, options)
        )}
      </div>
    </div>
  );
}