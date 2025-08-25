import React from 'react';

/*
 * FAIT QUOI : Composant atomique pour éditer UNE propriété
 * REÇOIT : label, value, type, onChange, disabled, error
 * RETOURNE : Champ d'édition avec label et validation
 * ERREURS : Défensif avec valeurs par défaut
 */

function PropertyField({ 
  label = '', 
  value = '', 
  type = 'text', 
  onChange = () => {}, 
  disabled = false,
  error = null,
  placeholder = ''
}) {
  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.value);
    }
  };

  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="property-field">
      <label htmlFor={fieldId}>
        {label}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`property-value ${error ? 'error' : ''}`}
          rows={3}
        />
      ) : type === 'select' ? (
        <select
          id={fieldId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`property-value ${error ? 'error' : ''}`}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {/* Options will be passed as children or separate prop */}
        </select>
      ) : (
        <input
          type={type}
          id={fieldId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`property-value ${error ? 'error' : ''}`}
        />
      )}
      
      {error && (
        <small className="property-error">{error}</small>
      )}
    </div>
  );
}

export default PropertyField;