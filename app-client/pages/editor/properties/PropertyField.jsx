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
  // Handler générique pour tous les types d'input
  const handleChange = (e) => {
    if (disabled || !onChange) return;
    
    let newValue = e.target.value;
    
    // Traitement spécial pour les checkbox
    if (type === 'checkbox') {
      newValue = e.target.checked;
    }
    
    // Traitement spécial pour les numbers - IMPORTANT: permettre string vide
    if (type === 'number') {
      // Si c'est vide, garder vide (ne pas forcer à 0)
      newValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
    }
    
    onChange(newValue);
  };

  // ID unique pour le champ
  const fieldId = `field-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // 🔥 FIX CRITIQUE: Normaliser la valeur pour éviter undefined/null
  const normalizedValue = value === null || value === undefined ? '' : String(value);

  // Render du champ selon le type
  const renderInput = () => {
    const baseProps = {
      id: fieldId,
      // 🔥 FIX: Utiliser normalizedValue et gérer checkbox séparément
      value: type === 'checkbox' ? undefined : normalizedValue,
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
              // 🔥 FIX: Forcer boolean pour checked
              checked={Boolean(value)}
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
              // 🔥 FIX: Default color si vide
              value={normalizedValue || '#000000'}
              className="property-color-picker"
            />
            <input
              type="text"
              // 🔥 FIX: Même logique pour le text input
              value={normalizedValue || '#000000'}
              onChange={(e) => {
                if (!disabled && onChange) {
                  onChange(e.target.value);
                }
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
      </label>
      {renderInput()}
      {error && <div className="property-error">{error}</div>}
    </div>
  );
}

export default PropertyField;