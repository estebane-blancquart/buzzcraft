import React from 'react';

/*
 * FAIT QUOI : Champ d'édition universal pour propriétés d'éléments
 * REÇOIT : label, value, type, onChange, disabled, error, children (pour select)
 * RETOURNE : Input styléé avec label et gestion d'erreurs
 * TYPES : text, textarea, number, select, checkbox, color, url
 */

function PropertyField({
  label = '',
  value = '', 
  type = 'text',
  onChange = () => {},
  disabled = false,
  error = null,
  children = null
}) {
  // Debug pour vérifier les props reçues
  console.log(`PropertyField ${label}:`, { value, type, disabled, hasOnChange: !!onChange });

  // Handler générique pour tous les types d'input
  const handleChange = (e) => {
    console.log(`Input change for ${label}:`, e.target.value);
    
    if (!disabled && onChange) {
      let newValue = e.target.value;
      
      // Traitement spécial pour les checkbox
      if (type === 'checkbox') {
        newValue = e.target.checked;
      }
      
      // Traitement spécial pour les numbers
      if (type === 'number') {
        newValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
      }
      
      console.log(`Calling onChange for ${label} with:`, newValue);
      onChange(newValue);
    } else {
      console.log(`Change blocked for ${label} - disabled:${disabled}, hasOnChange:${!!onChange}`);
    }
  };

  // ID unique pour le champ
  const fieldId = `field-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // Render du champ selon le type
  const renderInput = () => {
    const baseProps = {
      id: fieldId,
      value: type === 'checkbox' ? undefined : (value || ''),
      onChange: handleChange,
      disabled: disabled,
      className: `property-input property-input-${type}`,
      style: { 
        pointerEvents: disabled ? 'none' : 'auto',
        opacity: disabled ? 0.6 : 1 
      }
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...baseProps}
            rows={3}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        );

      case 'select':
        return (
          <select {...baseProps}>
            <option value="">-- Select {label} --</option>
            {children}
          </select>
        );

      case 'checkbox':
        return (
          <div className="checkbox-container">
            <input
              type="checkbox"
              id={fieldId}
              checked={!!value}
              onChange={handleChange}
              disabled={disabled}
              className="property-checkbox"
            />
            <label htmlFor={fieldId} className="checkbox-label">
              {label}
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            {...baseProps}
            type="number"
            min="0"
            step="1"
            placeholder="0"
          />
        );

      case 'color':
        return (
          <div className="color-input-container">
            <input
              {...baseProps}
              type="color"
              className="property-color-picker"
            />
            <input
              type="text"
              value={value || '#000000'}
              onChange={(e) => {
                console.log(`Color text change:`, e.target.value);
                if (!disabled) onChange(e.target.value);
              }}
              disabled={disabled}
              placeholder="#000000"
              className="property-color-text"
              style={{ 
                pointerEvents: disabled ? 'none' : 'auto',
                opacity: disabled ? 0.6 : 1 
              }}
            />
          </div>
        );

      case 'url':
        return (
          <input
            {...baseProps}
            type="url"
            placeholder="https://example.com"
          />
        );

      case 'text':
      default:
        return (
          <input
            {...baseProps}
            type="text"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        );
    }
  };

  // Rendu spécial pour checkbox (pas de label séparé)
  if (type === 'checkbox') {
    return (
      <div className="property-field property-field-checkbox">
        {renderInput()}
        {error && <div className="property-error">{error}</div>}
      </div>
    );
  }

  // Rendu normal avec label
  return (
    <div className="property-field">
      <label htmlFor={fieldId} className="property-label">
        {label}
        {disabled && <span className="disabled-indicator"> (read-only)</span>}
      </label>
      {renderInput()}
      {error && <div className="property-error">{error}</div>}
    </div>
  );
}

export default PropertyField;