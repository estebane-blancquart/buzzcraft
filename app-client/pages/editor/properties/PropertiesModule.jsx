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
  const handlePropertyChange = (propertyName, value) => {
    if (!selectedElement || !onElementUpdate) return;
    onElementUpdate(selectedElement.id, { [propertyName]: value });
  };

  const renderPropertyFields = () => {
    if (!selectedElement) return null;

    const commonFields = [
      { key: 'id', label: 'ID', type: 'text', disabled: true },
      { key: 'classname', label: 'CSS Classes', type: 'text' }
    ];

    const typeSpecificFields = {
      // === PROJECT ===
      project: [
        { key: 'name', label: 'Project Name', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'theme', label: 'Theme', type: 'select', options: ['light', 'dark', 'auto'] },
        { key: 'fontFamily', label: 'Font Family', type: 'text' },
        { key: 'lightPrimaryColor', label: 'Primary Color (Light)', type: 'color' },
        { key: 'darkPrimaryColor', label: 'Primary Color (Dark)', type: 'color' }
      ],

      // === PAGE ===
      page: [
        { key: 'name', label: 'Page Name', type: 'text' },
        { key: 'slug', label: 'URL Slug', type: 'text' },
        { key: 'title', label: 'Page Title', type: 'text' }
      ],

      // === SECTION ===
      section: [
        { key: 'name', label: 'Section Name', type: 'text' },
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'desktopColumns', label: 'Desktop Columns', type: 'number' },
        { key: 'tabletColumns', label: 'Tablet Columns', type: 'number' },
        { key: 'mobileColumns', label: 'Mobile Columns', type: 'number' }
      ],

      // === CONTAINERS ===
      div: [
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'textColor', label: 'Text Color', type: 'color' },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'margin', label: 'Margin', type: 'text' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'border', label: 'Border', type: 'text' },
        { key: 'display', label: 'Display', type: 'select', options: ['block', 'flex', 'inline', 'inline-block', 'grid'] },
        { key: 'flexDirection', label: 'Flex Direction', type: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'] },
        { key: 'justifyContent', label: 'Justify Content', type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] },
        { key: 'alignItems', label: 'Align Items', type: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'] }
      ],

      list: [
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'textColor', label: 'Text Color', type: 'color' },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'margin', label: 'Margin', type: 'text' },
        { key: 'gap', label: 'Gap', type: 'text' },
        { key: 'listStyle', label: 'List Style', type: 'select', options: ['none', 'disc', 'circle', 'square', 'decimal', 'decimal-leading-zero'] }
      ],

      form: [
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'margin', label: 'Margin', type: 'text' },
        { key: 'border', label: 'Border', type: 'text' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'gap', label: 'Gap', type: 'text' },
        { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST'] },
        { key: 'action', label: 'Action URL', type: 'url' }
      ],

      // === COMPONENTS ===
      heading: [
        { key: 'content', label: 'Content', type: 'text' },
        { key: 'tag', label: 'Tag', type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
        { key: 'fontSize', label: 'Font Size', type: 'text' },
        { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
        { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
        { key: 'textColor', label: 'Text Color', type: 'color' },
        { key: 'lineHeight', label: 'Line Height', type: 'text' },
        { key: 'margin', label: 'Margin', type: 'text' }
      ],

      paragraph: [
        { key: 'content', label: 'Content', type: 'textarea' },
        { key: 'fontSize', label: 'Font Size', type: 'text' },
        { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '300', '400', '500', '600', '700'] },
        { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
        { key: 'textColor', label: 'Text Color', type: 'color' },
        { key: 'lineHeight', label: 'Line Height', type: 'text' },
        { key: 'maxLines', label: 'Max Lines', type: 'number' },
        { key: 'margin', label: 'Margin', type: 'text' }
      ],

      button: [
        { key: 'content', label: 'Text', type: 'text' },
        { key: 'href', label: 'Link URL', type: 'url' },
        { key: 'target', label: 'Open In', type: 'select', options: ['_self', '_blank'] },
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'textColor', label: 'Text Color', type: 'color' },
        { key: 'fontSize', label: 'Font Size', type: 'text' },
        { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '400', '500', '600', '700'] },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'border', label: 'Border', type: 'text' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'buttonType', label: 'Button Type', type: 'select', options: ['button', 'submit', 'reset'] },
        // États hover
        { key: 'hoverBackgroundColor', label: 'Hover Background', type: 'color' },
        { key: 'hoverTextColor', label: 'Hover Text Color', type: 'color' }
      ],

      link: [
        { key: 'content', label: 'Text', type: 'text' },
        { key: 'href', label: 'URL', type: 'url' },
        { key: 'target', label: 'Target', type: 'select', options: ['_self', '_blank', '_parent', '_top'] },
        { key: 'textColor', label: 'Text Color', type: 'color' },
        { key: 'fontSize', label: 'Font Size', type: 'text' },
        { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '400', '500', '600', '700'] },
        { key: 'textDecoration', label: 'Text Decoration', type: 'select', options: ['none', 'underline', 'overline', 'line-through'] },
        // États hover
        { key: 'hoverTextColor', label: 'Hover Text Color', type: 'color' },
        { key: 'hoverTextDecoration', label: 'Hover Decoration', type: 'select', options: ['none', 'underline', 'overline', 'line-through'] }
      ],

      image: [
        { key: 'src', label: 'Image URL', type: 'url' },
        { key: 'alt', label: 'Alt Text', type: 'text' },
        { key: 'width', label: 'Width', type: 'text' },
        { key: 'height', label: 'Height', type: 'text' },
        { key: 'objectFit', label: 'Object Fit', type: 'select', options: ['fill', 'contain', 'cover', 'scale-down', 'none'] },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'border', label: 'Border', type: 'text' },
        { key: 'lazy', label: 'Lazy Loading', type: 'checkbox' },
        { key: 'margin', label: 'Margin', type: 'text' }
      ],

      video: [
        { key: 'src', label: 'Video URL', type: 'url' },
        { key: 'width', label: 'Width', type: 'text' },
        { key: 'height', label: 'Height', type: 'text' },
        { key: 'controls', label: 'Show Controls', type: 'checkbox' },
        { key: 'autoplay', label: 'Autoplay', type: 'checkbox' },
        { key: 'loop', label: 'Loop', type: 'checkbox' },
        { key: 'muted', label: 'Muted', type: 'checkbox' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'margin', label: 'Margin', type: 'text' }
      ],

      // === INPUT COMPONENTS ===
      input: [
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'value', label: 'Default Value', type: 'text' },
        { key: 'inputType', label: 'Input Type', type: 'select', options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'] },
        { key: 'required', label: 'Required', type: 'checkbox' },
        { key: 'disabled', label: 'Disabled', type: 'checkbox' },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'border', label: 'Border', type: 'text' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'fontSize', label: 'Font Size', type: 'text' },
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'textColor', label: 'Text Color', type: 'color' }
      ],

      textarea: [
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'value', label: 'Default Value', type: 'textarea' },
        { key: 'rows', label: 'Rows', type: 'number' },
        { key: 'cols', label: 'Columns', type: 'number' },
        { key: 'required', label: 'Required', type: 'checkbox' },
        { key: 'disabled', label: 'Disabled', type: 'checkbox' },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'border', label: 'Border', type: 'text' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'fontSize', label: 'Font Size', type: 'text' },
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'textColor', label: 'Text Color', type: 'color' },
        { key: 'resize', label: 'Resize', type: 'select', options: ['none', 'both', 'horizontal', 'vertical'] }
      ],

      select: [
        { key: 'options', label: 'Options (JSON)', type: 'textarea' },
        { key: 'defaultValue', label: 'Default Value', type: 'text' },
        { key: 'required', label: 'Required', type: 'checkbox' },
        { key: 'disabled', label: 'Disabled', type: 'checkbox' },
        { key: 'multiple', label: 'Multiple Selection', type: 'checkbox' },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'border', label: 'Border', type: 'text' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'fontSize', label: 'Font Size', type: 'text' },
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'textColor', label: 'Text Color', type: 'color' }
      ]
    };

    // Obtenir les champs spécifiques au type d'élément
    const specificFields = typeSpecificFields[selectedElement.type] || [];
    
    // Combiner les champs communs et spécifiques
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