import React, { useState } from 'react';
import { ELEMENT_TYPES, RESPONSIVE_COLUMNS, UI_MESSAGES } from '@config/constants.js';
import Input from '@components/Input.jsx';

function ProjectProperties({ selectedElement, device, onElementUpdate }) {
  const [localValues, setLocalValues] = useState({});

  if (!selectedElement || !selectedElement.element) {
    return (
      <div className="project-properties">
        <div className="properties-header">
          <h3>Propriétés</h3>
        </div>
        <div className="properties-empty">
          <p>{UI_MESSAGES.SELECT_ELEMENT}</p>
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
          style={{
            width: '100%',
            background: 'color-mix(in srgb, var(--color-bg-secondary) 95%, white 5%)',
            border: '1px solid color-mix(in srgb, var(--color-bg-secondary) 85%, white 15%)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--size-sm)'
          }}
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
          style={{
            width: '100%',
            background: 'color-mix(in srgb, var(--color-bg-secondary) 95%, white 5%)',
            border: '1px solid color-mix(in srgb, var(--color-bg-secondary) 85%, white 15%)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--size-sm)'
          }}
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
      [ELEMENT_TYPES.PAGE]: [
        { field: 'name', label: 'Nom de la page' }
      ],
      [ELEMENT_TYPES.SECTION]: [
        { field: 'name', label: 'Nom de la section' },
        { field: 'desktop', label: 'Colonnes Desktop', type: 'select', options: 
          RESPONSIVE_COLUMNS.DESKTOP.map(num => ({ value: num, label: `${num} colonne${num > 1 ? 's' : ''}` }))
        },
        { field: 'tablet', label: 'Colonnes Tablet', type: 'select', options: 
          RESPONSIVE_COLUMNS.TABLET.map(num => ({ value: num, label: `${num} colonne${num > 1 ? 's' : ''}` }))
        },
        { field: 'mobile', label: 'Colonnes Mobile', type: 'select', options: 
          RESPONSIVE_COLUMNS.MOBILE.map(num => ({ value: num, label: `${num} colonne` }))
        }
      ],
      [ELEMENT_TYPES.DIV]: [
        { field: 'name', label: 'Nom du div' },
        { field: 'classname', label: 'Classes CSS' }
      ],
      [ELEMENT_TYPES.HEADING]: [
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
      [ELEMENT_TYPES.PARAGRAPH]: [
        { field: 'content', label: 'Contenu' },
        { field: 'classname', label: 'Classes CSS' }
      ],
      [ELEMENT_TYPES.BUTTON]: [
        { field: 'content', label: 'Texte du bouton' },
        { field: 'href', label: 'Lien (optionnel)' },
        { field: 'classname', label: 'Classes CSS' }
      ],
      [ELEMENT_TYPES.IMAGE]: [
        { field: 'src', label: 'URL de l\'image' },
        { field: 'alt', label: 'Texte alternatif' },
        { field: 'classname', label: 'Classes CSS' }
      ]
    };

    const elementType = element.type || ELEMENT_TYPES.DIV;
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

export default ProjectProperties;
