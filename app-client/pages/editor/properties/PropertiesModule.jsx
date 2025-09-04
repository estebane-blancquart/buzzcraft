import React, { useState } from 'react';
import PropertyField from './PropertyField.jsx';
import { DEVICES } from '@config/constants.js';

// ✅ DEFAULTS POUR PROJECT
const PROJECT_DEFAULTS = {
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  protocol: 'https',
  
  // Header defaults
  headerEnabled: true,
  headerHeight: '60px',
  headerPosition: 'static',
  headerBackgroundColor: '#ffffff',
  
  // Footer defaults  
  footerEnabled: true,
  footerHeight: '80px',
  footerPosition: 'static',
  footerBackgroundColor: '#f8f9fa',
  
  // Breakpoints defaults
  breakpointDesktop: '1200px',
  breakpointTablet: '768px', 
  breakpointMobile: '480px'
};

// ✅ FONCTION POUR INITIALISER PROJET AVEC DEFAULTS
export function initializeProjectWithDefaults(projectData) {
  return {
    ...PROJECT_DEFAULTS,
    ...projectData,
    updated: new Date().toISOString() // Always update timestamp
  };
}

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
    
    // ✅ MISE À JOUR AUTO DU TIMESTAMP POUR PROJECT
    if (selectedElement.type === 'project') {
      updatedElement.updated = new Date().toISOString();
      updatedElement.properties = {
        ...updatedElement.properties,
        updated: updatedElement.updated
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

    // ✅ FONCTIONS CORRIGÉES POUR GÉNÉRER LES CHAMPS SELON LE TYPE
    function getContentFields() {
      switch(selectedElement.type) {
        case 'project':
          return [
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'author', label: 'Author', type: 'text' },
            { key: 'version', label: 'Version', type: 'text' },
            
            // ✅ AJOUT DES CHAMPS MANQUANTS
            { key: 'created', label: 'Created', type: 'datetime-local', disabled: true },
            { key: 'updated', label: 'Updated', type: 'datetime-local', disabled: true },
            
            { key: 'language', label: 'Language', type: 'text', placeholder: 'fr' },
            { key: 'charset', label: 'Charset', type: 'text', placeholder: 'UTF-8' },
            { key: 'domain', label: 'Domain', type: 'url', placeholder: 'https://example.com' },
            
            // ✅ AJOUT PROTOCOL MANQUANT
            { key: 'protocol', label: 'Protocol', type: 'select', options: ['https', 'http'] },
            
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

        // ✅ HARMONISATION title/heading -> title partout
        case 'title':
          return [
            // ✅ PROPRIÉTÉS CORRIGÉES SELON SPEC
            { key: 'text', label: 'Text', type: 'text' }, 
            { key: 'level', label: 'Level', type: 'select', options: ['1', '2', '3', '4', '5', '6'] },
            // ✅ AJOUT lineHeight et letterSpacing manquants
            { key: 'lineHeight', label: 'Line Height', type: 'text', placeholder: '1.5' },
            { key: 'letterSpacing', label: 'Letter Spacing', type: 'text', placeholder: '0px' }
          ];

        case 'paragraph':
          return [
            { key: 'text', label: 'Text', type: 'textarea' },
            // ✅ AJOUT PROPRIÉTÉS SPEC MANQUANTES
            { key: 'maxLines', label: 'Max Lines', type: 'number' },
            { key: 'wordBreak', label: 'Word Break', type: 'select', options: ['normal', 'break-all', 'break-word'] },
            { key: 'allowHtml', label: 'Allow HTML', type: 'checkbox' }
          ];

        case 'button':
          return [
            { key: 'text', label: 'Button Text', type: 'text' },
            // ✅ PROPRIÉTÉS SPEC COMPLÈTES
            { key: 'icon', label: 'Icon', type: 'text', placeholder: 'fa-home' },
            { key: 'iconPosition', label: 'Icon Position', type: 'select', options: ['left', 'right'] },
            { key: 'buttonType', label: 'Button Type', type: 'select', options: ['button', 'submit', 'reset'] },
            { key: 'action', label: 'Action', type: 'text' }
          ];

        case 'link':
          return [
            { key: 'text', label: 'Link Text', type: 'text' },
            { key: 'href', label: 'URL', type: 'url' },
            { key: 'target', label: 'Target', type: 'select', options: ['_self', '_blank', '_parent', '_top'] }
          ];

        // ✅ AJOUT TYPE ICON MANQUANT
        case 'icon':
          return [
            { key: 'iconName', label: 'Icon Name', type: 'text', placeholder: 'fa-home' },
            { key: 'iconFamily', label: 'Icon Family', type: 'select', options: ['fontawesome', 'material', 'feather'] },
            { key: 'alt', label: 'Alt Text', type: 'text' }
          ];

        case 'image':
          return [
            { key: 'src', label: 'Image URL', type: 'url' },
            { key: 'alt', label: 'Alt Text', type: 'text' },
            // ✅ AJOUT PROPRIÉTÉS SPEC
            { key: 'lazy', label: 'Lazy Loading', type: 'checkbox' },
            { key: 'objectFit', label: 'Object Fit', type: 'select', options: ['contain', 'cover', 'fill', 'none', 'scale-down'] }
          ];

        case 'video':
          return [
            { key: 'src', label: 'Video URL', type: 'url' },
            { key: 'poster', label: 'Poster Image', type: 'url' },
            { key: 'autoplay', label: 'Autoplay', type: 'checkbox' },
            { key: 'controls', label: 'Controls', type: 'checkbox' },
            { key: 'loop', label: 'Loop', type: 'checkbox' },
            { key: 'muted', label: 'Muted', type: 'checkbox' }
          ];

        case 'input':
          return [
            { key: 'value', label: 'Value', type: 'text' },
            { key: 'placeholder', label: 'Placeholder', type: 'text' },
            { key: 'inputType', label: 'Input Type', type: 'select', options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'] },
            { key: 'required', label: 'Required', type: 'checkbox' }
          ];

        // ✅ AJOUT TYPE TEXTAREA MANQUANT  
        case 'textarea':
          return [
            { key: 'value', label: 'Value', type: 'textarea' },
            { key: 'placeholder', label: 'Placeholder', type: 'text' },
            { key: 'rows', label: 'Rows', type: 'number', placeholder: '4' },
            { key: 'maxLength', label: 'Max Length', type: 'number' },
            { key: 'required', label: 'Required', type: 'checkbox' }
          ];

        // ✅ AJOUT TYPE SELECT MANQUANT
        case 'select':
          return [
            { key: 'options', label: 'Options (JSON)', type: 'textarea', placeholder: '["Option 1", "Option 2"]' },
            { key: 'value', label: 'Selected Value', type: 'text' },
            { key: 'multiple', label: 'Multiple', type: 'checkbox' },
            { key: 'required', label: 'Required', type: 'checkbox' }
          ];

        default:
          return [
            { key: 'text', label: 'Content', type: 'textarea' },
            { key: 'classname', label: 'CSS Classes', type: 'text' }
          ];
      }
    }

    function getLayoutFields() {
      const commonLayout = [
        { key: 'widthDesktop', label: 'Width Desktop', type: 'text', placeholder: '100%' },
        { key: 'widthTablet', label: 'Width Tablet', type: 'text', placeholder: '100%' },
        { key: 'widthMobile', label: 'Width Mobile', type: 'text', placeholder: '100%' },
        { key: 'heightDesktop', label: 'Height Desktop', type: 'text', placeholder: 'auto' },
        { key: 'heightTablet', label: 'Height Tablet', type: 'text', placeholder: 'auto' },
        { key: 'heightMobile', label: 'Height Mobile', type: 'text', placeholder: 'auto' },
        { key: 'padding', label: 'Padding', type: 'text', placeholder: '0px' },
        { key: 'margin', label: 'Margin', type: 'text', placeholder: '0px' }
      ];

      switch(selectedElement.type) {
        case 'project':
          return [
            // ✅ BREAKPOINTS EXISTANTS avec placeholders
            { key: 'breakpointDesktop', label: 'Desktop Breakpoint', type: 'text', placeholder: '1200px' },
            { key: 'breakpointTablet', label: 'Tablet Breakpoint', type: 'text', placeholder: '768px' },
            { key: 'breakpointMobile', label: 'Mobile Breakpoint', type: 'text', placeholder: '480px' },
            
            // ✅ AJOUT HEADER CONFIGURATION MANQUANT
            { key: 'headerEnabled', label: 'Header Enabled', type: 'checkbox' },
            { key: 'headerHeight', label: 'Header Height', type: 'text', placeholder: '60px' },
            { key: 'headerPosition', label: 'Header Position', type: 'select', options: ['static', 'fixed', 'sticky'] },
            { key: 'headerBackgroundColor', label: 'Header Background', type: 'color' },
            
            // ✅ AJOUT FOOTER CONFIGURATION MANQUANT  
            { key: 'footerEnabled', label: 'Footer Enabled', type: 'checkbox' },
            { key: 'footerHeight', label: 'Footer Height', type: 'text', placeholder: '80px' },
            { key: 'footerPosition', label: 'Footer Position', type: 'select', options: ['static', 'fixed', 'sticky'] },
            { key: 'footerBackgroundColor', label: 'Footer Background', type: 'color' }
          ];

        case 'section':
          return [
            { key: 'desktopColumns', label: 'Desktop Columns', type: 'number', placeholder: '12' },
            { key: 'tabletColumns', label: 'Tablet Columns', type: 'number', placeholder: '6' },
            { key: 'mobileColumns', label: 'Mobile Columns', type: 'number', placeholder: '1' },
            { key: 'gap', label: 'Gap', type: 'text', placeholder: '16px' },
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
        { key: 'border', label: 'Border', type: 'text', placeholder: '1px solid #ccc' },
        { key: 'borderRadius', label: 'Border Radius', type: 'text', placeholder: '4px' },
        { key: 'boxShadow', label: 'Box Shadow', type: 'text' },
        { key: 'opacity', label: 'Opacity', type: 'number', min: '0', max: '1', step: '0.1' }
      ];

      switch(selectedElement.type) {
        case 'project':
          return [
            { key: 'theme', label: 'Theme', type: 'select', options: ['light', 'dark', 'auto'] },
            { key: 'fontFamily', label: 'Font Family', type: 'text', placeholder: 'Arial, sans-serif' },
            // ✅ COULEURS THEME COMPLÈTES
            { key: 'lightPrimaryColor', label: 'Primary Light', type: 'color' },
            { key: 'lightSecondaryColor', label: 'Secondary Light', type: 'color' },
            { key: 'darkPrimaryColor', label: 'Primary Dark', type: 'color' },
            { key: 'darkSecondaryColor', label: 'Secondary Dark', type: 'color' }
          ];

        case 'title':
        case 'paragraph':
          return [
            ...commonStyle,
            { key: 'fontSize', label: 'Font Size', type: 'text', placeholder: '16px' },
            { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '300', '400', '500', '600', '700'] },
            { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] }
          ];

        case 'image':
          return [
            ...commonStyle,
            { key: 'objectFit', label: 'Object Fit', type: 'select', options: ['contain', 'cover', 'fill', 'none', 'scale-down'] }
          ];

        default:
          return commonStyle;
      }
    }

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
          const value = getPropertyValue(field.key);

          if (field.type === 'select') {
            return (
              <PropertyField
                key={field.key}
                label={field.label}
                value={value}
                type="select"
                placeholder={field.placeholder}
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
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(newValue) => handlePropertyChange(field.key, newValue)}
              disabled={field.disabled}
            />
          );
        })}
        
        {/* Debug en développement */}
        {process.env.NODE_ENV === 'development' && (
          <details className="properties-debug" style={{ marginTop: '16px', fontSize: '11px' }}>
            <summary>🔍 Debug Selected Element</summary>
            <pre style={{ maxHeight: '200px', overflow: 'auto', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
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