import React, { useState } from 'react';
import PropertyField from './PropertyField.jsx';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Panel propriétés avec onglets horizontaux
 * REÇOIT : selectedElement, device, onElementUpdate
 * RETOURNE : Interface clean avec navigation par onglets
 * NOUVEAU : Sync avec project.json + garde le style onglets
 */

function PropertiesModule({ 
  selectedElement = null, 
  device = DEVICES.DESKTOP, 
  onElementUpdate = () => {} 
}) {
  const [activeTab, setActiveTab] = useState('general');

  const handlePropertyChange = (propertyName, value) => {
    if (!selectedElement || !onElementUpdate) return;
    
    // Créer l'élément mis à jour avec sync properties + props directes
    const updatedElement = {
      ...selectedElement,
      [propertyName]: value, // Propriété directe
      properties: {
        ...selectedElement.properties,
        [propertyName]: value // Dans properties aussi
      }
    };
    
    // Sync spéciale pour le contenu
    if (propertyName === 'text' || propertyName === 'content') {
      updatedElement.text = value;
      updatedElement.content = value;
      updatedElement.properties = {
        ...updatedElement.properties,
        text: value,
        content: value
      };
    }
    
    onElementUpdate(selectedElement.id, updatedElement);
  };

  const getPropertyValue = (key) => {
    if (!selectedElement) return '';
    
    // Priorité : propriété directe > properties > défaut
    return selectedElement[key] || 
           selectedElement.properties?.[key] || 
           (key === 'content' ? selectedElement.text : '') ||
           (key === 'text' ? selectedElement.content : '') ||
           '';
  };

  const getPropertyTabs = () => {
    if (!selectedElement) return [];

    const tabs = {
      // === 4 ONGLETS POUR TOUS ===
      general: {
        title: 'General',
        icon: '📋',
        fields: [
          { key: 'id', label: 'ID', type: 'text', disabled: true },
          { key: 'name', label: 'Name', type: 'text' }
        ]
      },

      content: {
        title: 'Content',
        icon: '📝',
        fields: getContentFields()
      },

      layout: {
        title: 'Layout',
        icon: '📐',
        fields: getLayoutFields()
      },

      style: {
        title: 'Style',
        icon: '🎨',
        fields: getStyleFields()
      }
    };

    // Fonctions pour générer les champs selon le type
    function getContentFields() {
      switch(selectedElement.type) {
        case 'project':
          return [
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'author', label: 'Author', type: 'text' },
            { key: 'version', label: 'Version', type: 'text' },
            { key: 'language', label: 'Language', type: 'text' },
            { key: 'charset', label: 'Charset', type: 'text' },
            { key: 'domain', label: 'Domain', type: 'url' },
            { key: 'favicon', label: 'Favicon URL', type: 'url' },
            { key: 'previewImage', label: 'Preview Image', type: 'url' }
          ];
        case 'page':
          return [
            { key: 'title', label: 'Page Title', type: 'text' },
            { key: 'slug', label: 'URL Slug', type: 'text' },
            { key: 'metaDescription', label: 'Meta Description', type: 'textarea' },
            { key: 'previewImage', label: 'Preview Image', type: 'url' },
            { key: 'index', label: 'Index Page', type: 'checkbox' }
          ];
        case 'heading':
        case 'title':
          return [
            { key: 'content', label: 'Text', type: 'text' }, // Unifié sur 'content'
            { key: 'level', label: 'Level', type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
            { key: 'tag', label: 'HTML Tag', type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }
          ];
        case 'paragraph':
          return [
            { key: 'content', label: 'Text', type: 'textarea' }, // Unifié sur 'content'
            { key: 'maxLines', label: 'Max Lines', type: 'number' },
            { key: 'allowHtml', label: 'Allow HTML', type: 'checkbox' }
          ];
        case 'button':
          return [
            { key: 'content', label: 'Button Text', type: 'text' }, // Unifié sur 'content'
            { key: 'action', label: 'Action', type: 'text' },
            { key: 'href', label: 'Link URL', type: 'url' },
            { key: 'target', label: 'Link Target', type: 'select', options: ['_self', '_blank'] },
            { key: 'buttonType', label: 'Type', type: 'select', options: ['button', 'submit', 'reset'] },
            { key: 'icon', label: 'Icon', type: 'text' },
            { key: 'iconPosition', label: 'Icon Position', type: 'select', options: ['left', 'right'] }
          ];
        case 'link':
          return [
            { key: 'content', label: 'Link Text', type: 'text' }, // Unifié sur 'content'
            { key: 'href', label: 'URL', type: 'url' },
            { key: 'target', label: 'Target', type: 'select', options: ['_self', '_blank', '_parent', '_top'] }
          ];
        case 'image':
          return [
            { key: 'src', label: 'Image URL', type: 'url' },
            { key: 'alt', label: 'Alt Text', type: 'text' },
            { key: 'width', label: 'Width', type: 'text' },
            { key: 'height', label: 'Height', type: 'text' },
            { key: 'lazy', label: 'Lazy Loading', type: 'checkbox' }
          ];
        case 'input':
          return [
            { key: 'value', label: 'Value', type: 'text' },
            { key: 'placeholder', label: 'Placeholder', type: 'text' },
            { key: 'inputType', label: 'Input Type', type: 'select', options: ['text', 'email', 'password', 'number', 'tel'] },
            { key: 'required', label: 'Required', type: 'checkbox' }
          ];
        default:
          return [
            { key: 'content', label: 'Content', type: 'textarea' },
            { key: 'classname', label: 'CSS Classes', type: 'text' }
          ];
      }
    }

    function getLayoutFields() {
      const commonLayout = [
        { key: 'widthDesktop', label: 'Width Desktop', type: 'text' },
        { key: 'widthTablet', label: 'Width Tablet', type: 'text' },
        { key: 'widthMobile', label: 'Width Mobile', type: 'text' },
        { key: 'heightDesktop', label: 'Height Desktop', type: 'text' },
        { key: 'heightTablet', label: 'Height Tablet', type: 'text' },
        { key: 'heightMobile', label: 'Height Mobile', type: 'text' },
        { key: 'padding', label: 'Padding', type: 'text' },
        { key: 'margin', label: 'Margin', type: 'text' }
      ];

      switch(selectedElement.type) {
        case 'project':
          return [
            { key: 'breakpointDesktop', label: 'Desktop Breakpoint', type: 'text' },
            { key: 'breakpointTablet', label: 'Tablet Breakpoint', type: 'text' },
            { key: 'breakpointMobile', label: 'Mobile Breakpoint', type: 'text' }
          ];
        case 'section':
          return [
            { key: 'desktopColumns', label: 'Desktop Columns', type: 'number' },
            { key: 'tabletColumns', label: 'Tablet Columns', type: 'number' },
            { key: 'mobileColumns', label: 'Mobile Columns', type: 'number' },
            { key: 'gap', label: 'Gap', type: 'text' },
            ...commonLayout
          ];
        case 'div':
        case 'list':
        case 'form':
          return [
            ...commonLayout,
            { key: 'display', label: 'Display', type: 'select', options: ['block', 'flex', 'grid', 'inline-block'] },
            { key: 'flexDirection', label: 'Flex Direction', type: 'select', options: ['row', 'column'] },
            { key: 'justifyContent', label: 'Justify Content', type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between'] },
            { key: 'alignItems', label: 'Align Items', type: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch'] }
          ];
        default:
          return commonLayout;
      }
    }

    function getStyleFields() {
      const commonStyle = [
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
        { key: 'textColor', label: 'Text Color', type: 'color' },
        { key: 'border', label: 'Border', type: 'text' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text' },
        { key: 'boxShadow', label: 'Box Shadow', type: 'text' },
        { key: 'opacity', label: 'Opacity', type: 'number' }
      ];

      switch(selectedElement.type) {
        case 'project':
          return [
            { key: 'theme', label: 'Theme', type: 'select', options: ['light', 'dark', 'auto'] },
            { key: 'fontFamily', label: 'Font Family', type: 'text' },
            { key: 'lightPrimaryColor', label: 'Primary Light', type: 'color' },
            { key: 'lightSecondaryColor', label: 'Secondary Light', type: 'color' },
            { key: 'darkPrimaryColor', label: 'Primary Dark', type: 'color' },
            { key: 'darkSecondaryColor', label: 'Secondary Dark', type: 'color' }
          ];
        case 'heading':
        case 'paragraph':
        case 'title':
          return [
            ...commonStyle,
            { key: 'fontSize', label: 'Font Size', type: 'text' },
            { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '300', '400', '500', '600', '700'] },
            { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
            { key: 'lineHeight', label: 'Line Height', type: 'text' },
            { key: 'letterSpacing', label: 'Letter Spacing', type: 'text' }
          ];
        case 'image':
          return [
            ...commonStyle,
            { key: 'objectFit', label: 'Object Fit', type: 'select', options: ['contain', 'cover', 'fill', 'none'] }
          ];
        default:
          return commonStyle;
      }
    };

    return Object.entries(tabs).map(([key, tab]) => ({
      key,
      ...tab
    }));
  };

  const renderActiveTab = () => {
    const tabs = getPropertyTabs();
    const currentTab = tabs.find(tab => tab.key === activeTab);
    
    if (!currentTab) return null;

    return (
      <div className="properties-tab-content">
        {currentTab.fields.map(field => {
          const value = getPropertyValue(field.key); // Utilise la fonction de récupération

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
        })}
        
        {/* Debug en développement */}
        {process.env.NODE_ENV === 'development' && (
          <details className="properties-debug" style={{ marginTop: '16px', fontSize: '11px' }}>
            <summary>Debug Selected Element</summary>
            <pre style={{ maxHeight: '150px', overflow: 'auto', background: '#f5f5f5', padding: '8px' }}>
              {JSON.stringify(selectedElement, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  const tabs = getPropertyTabs();

  return (
    <div className="project-properties">
      <div className="properties-content">
        {selectedElement ? (
          <>
            {/* Tabs Navigation */}
            <div className="properties-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  className={`properties-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  title={tab.title}
                >
                  <span className="tab-icon">{tab.icon}</span>
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            {renderActiveTab()}
          </>
        ) : (
          <div className="properties-empty">
            <div className="empty-icon">🎯</div>
            <div className="empty-text">
              <h4>No Element Selected</h4>
              <p>Select an element from the structure or preview to edit its properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertiesModule;