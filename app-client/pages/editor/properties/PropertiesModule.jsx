import React, { useState } from 'react';
import PropertyField from './PropertyField.jsx';
import { DEVICES } from '@config/constants.js';

// Composant section pliable
function CollapsibleSection({ title, isOpen, onToggle, children }) {
  return (
    <div className="collapsible-section">
      <button 
        className={`section-header ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        type="button"
      >
        <span className="section-title">{title}</span>
        <span className="section-arrow">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
}

/*
 * FAIT QUOI : Panel propriétés avec 3 onglets + sous-sections pliables
 * REÇOIT : selectedElement, device, onElementUpdate
 * RETOURNE : Interface organisée Content/Style/Layout
 * NOUVEAU : Sections pliables + progression par niveau DOM
 */

function PropertiesModule({ 
  selectedElement = null, 
  device = DEVICES.DESKTOP, 
  onElementUpdate = () => {} 
}) {
  const [activeTab, setActiveTab] = useState('content');
  const [openSections, setOpenSections] = useState({
    // Content sections
    metadata: true,
    seo: false,
    behavior: false,
    // Style sections  
    colors: false,
    typography: false,
    visual: false,
    states: false,
    // Layout sections
    dimensions: false,
    spacing: false,
    flexbox: false,
    advanced: false
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handlePropertyChange = (propertyName, value) => {
    if (!selectedElement || !onElementUpdate) return;
    
    const updatedElement = {
      ...selectedElement,
      [propertyName]: value,
      properties: {
        ...selectedElement.properties,
        [propertyName]: value
      }
    };
    
    // Auto-update timestamp pour PROJECT
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
    return selectedElement[key] || 
           selectedElement.properties?.[key] || 
           '';
  };

  // Rendu du contenu selon le type d'élément et l'onglet actif
  const renderTabContent = () => {
    if (!selectedElement) return null;

    switch (activeTab) {
      case 'content':
        return renderContentTab();
      case 'style':
        return renderStyleTab();
      case 'layout':
        return renderLayoutTab();
      default:
        return null;
    }
  };

  const renderContentTab = () => {
    const elementType = selectedElement.type;

    return (
      <div className="tab-content">
        {/* Metadata section - Pour tous les éléments */}
        <CollapsibleSection
          title="Metadata"
          isOpen={openSections.metadata}
          onToggle={() => toggleSection('metadata')}
        >
          {elementType === 'project' && (
            <>
              <PropertyField
                label="Name"
                value={getPropertyValue('name')}
                type="text"
                onChange={(value) => handlePropertyChange('name', value)}
              />
              <PropertyField
                label="Description"
                value={getPropertyValue('description')}
                type="textarea"
                onChange={(value) => handlePropertyChange('description', value)}
              />
              <PropertyField
                label="Author"
                value={getPropertyValue('author')}
                type="text"
                onChange={(value) => handlePropertyChange('author', value)}
              />
              <PropertyField
                label="Version"
                value={getPropertyValue('version')}
                type="text"
                onChange={(value) => handlePropertyChange('version', value)}
              />
              <PropertyField
                label="Domain"
                value={getPropertyValue('domain')}
                type="text"
                onChange={(value) => handlePropertyChange('domain', value)}
              />
              <PropertyField
                label="Protocol"
                value={getPropertyValue('protocol')}
                type="select"
                onChange={(value) => handlePropertyChange('protocol', value)}
              >
                <option value="https">HTTPS</option>
                <option value="http">HTTP</option>
              </PropertyField>
            </>
          )}
          
          {elementType === 'page' && (
            <>
              <PropertyField
                label="Name"
                value={getPropertyValue('name')}
                type="text"
                onChange={(value) => handlePropertyChange('name', value)}
              />
              <PropertyField
                label="Slug"
                value={getPropertyValue('slug')}
                type="text"
                onChange={(value) => handlePropertyChange('slug', value)}
              />
            </>
          )}

          {(elementType === 'section' || elementType === 'div' || elementType === 'list' || elementType === 'form') && (
            <PropertyField
              label="Name"
              value={getPropertyValue('name')}
              type="text"
              onChange={(value) => handlePropertyChange('name', value)}
            />
          )}

          {(elementType === 'title' || elementType === 'paragraph' || elementType === 'button' || elementType === 'link') && (
            <PropertyField
              label="Text"
              value={getPropertyValue('text')}
              type={elementType === 'paragraph' ? 'textarea' : 'text'}
              onChange={(value) => handlePropertyChange('text', value)}
            />
          )}
        </CollapsibleSection>

        {/* SEO section - Pages seulement */}
        {selectedElement.type === 'page' && (
          <CollapsibleSection
            title="SEO"
            isOpen={openSections.seo}
            onToggle={() => toggleSection('seo')}
          >
            <PropertyField
              label="Title"
              value={getPropertyValue('title')}
              type="text"
              onChange={(value) => handlePropertyChange('title', value)}
            />
            <PropertyField
              label="Meta Description"
              value={getPropertyValue('metaDescription')}
              type="textarea"
              onChange={(value) => handlePropertyChange('metaDescription', value)}
            />
            <PropertyField
              label="Index Page"
              value={getPropertyValue('index')}
              type="checkbox"
              onChange={(value) => handlePropertyChange('index', value)}
            />
          </CollapsibleSection>
        )}

        {/* Behavior section - Composants interactifs */}
        {(selectedElement.type === 'button' || selectedElement.type === 'link' || selectedElement.type === 'form') && (
          <CollapsibleSection
            title="Behavior"
            isOpen={openSections.behavior}
            onToggle={() => toggleSection('behavior')}
          >
            {selectedElement.type === 'button' && (
              <>
                <PropertyField
                  label="Action"
                  value={getPropertyValue('action')}
                  type="text"
                  onChange={(value) => handlePropertyChange('action', value)}
                />
                <PropertyField
                  label="Button Type"
                  value={getPropertyValue('buttonType')}
                  type="select"
                  onChange={(value) => handlePropertyChange('buttonType', value)}
                >
                  <option value="button">Button</option>
                  <option value="submit">Submit</option>
                  <option value="reset">Reset</option>
                </PropertyField>
              </>
            )}
            
            {selectedElement.type === 'link' && (
              <>
                <PropertyField
                  label="URL"
                  value={getPropertyValue('href')}
                  type="url"
                  onChange={(value) => handlePropertyChange('href', value)}
                />
                <PropertyField
                  label="Target"
                  value={getPropertyValue('target')}
                  type="select"
                  onChange={(value) => handlePropertyChange('target', value)}
                >
                  <option value="_self">Same Window</option>
                  <option value="_blank">New Window</option>
                </PropertyField>
              </>
            )}
          </CollapsibleSection>
        )}
      </div>
    );
  };

  const renderStyleTab = () => {
    return (
      <div className="tab-content">
        {/* Colors section */}
        <CollapsibleSection
          title="Colors"
          isOpen={openSections.colors}
          onToggle={() => toggleSection('colors')}
        >
          {selectedElement.type === 'project' && (
            <>
              <PropertyField
                label="Light Primary Color"
                value={getPropertyValue('lightPrimaryColor')}
                type="color"
                onChange={(value) => handlePropertyChange('lightPrimaryColor', value)}
              />
              <PropertyField
                label="Light Secondary Color"
                value={getPropertyValue('lightSecondaryColor')}
                type="color"
                onChange={(value) => handlePropertyChange('lightSecondaryColor', value)}
              />
              <PropertyField
                label="Dark Primary Color"
                value={getPropertyValue('darkPrimaryColor')}
                type="color"
                onChange={(value) => handlePropertyChange('darkPrimaryColor', value)}
              />
              <PropertyField
                label="Dark Secondary Color"
                value={getPropertyValue('darkSecondaryColor')}
                type="color"
                onChange={(value) => handlePropertyChange('darkSecondaryColor', value)}
              />
            </>
          )}
          
          {selectedElement.type !== 'project' && (
            <>
              <PropertyField
                label="Background Color"
                value={getPropertyValue('backgroundColor')}
                type="color"
                onChange={(value) => handlePropertyChange('backgroundColor', value)}
              />
              <PropertyField
                label="Text Color"
                value={getPropertyValue('textColor')}
                type="color"
                onChange={(value) => handlePropertyChange('textColor', value)}
              />
              <PropertyField
                label="Border Color"
                value={getPropertyValue('borderColor')}
                type="color"
                onChange={(value) => handlePropertyChange('borderColor', value)}
              />
            </>
          )}
        </CollapsibleSection>

        {/* Typography section */}
        <CollapsibleSection
          title="Typography"
          isOpen={openSections.typography}
          onToggle={() => toggleSection('typography')}
        >
          {selectedElement.type === 'project' && (
            <PropertyField
              label="Font Family"
              value={getPropertyValue('fontFamily')}
              type="text"
              onChange={(value) => handlePropertyChange('fontFamily', value)}
            />
          )}
          
          {selectedElement.type !== 'project' && (
            <>
              <PropertyField
                label="Font Size"
                value={getPropertyValue('fontSize')}
                type="text"
                onChange={(value) => handlePropertyChange('fontSize', value)}
              />
              <PropertyField
                label="Font Weight"
                value={getPropertyValue('fontWeight')}
                type="select"
                onChange={(value) => handlePropertyChange('fontWeight', value)}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Lighter</option>
              </PropertyField>
              <PropertyField
                label="Text Align"
                value={getPropertyValue('textAlign')}
                type="select"
                onChange={(value) => handlePropertyChange('textAlign', value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </PropertyField>
            </>
          )}
        </CollapsibleSection>

        {/* Visual section */}
        <CollapsibleSection
          title="Visual"
          isOpen={openSections.visual}
          onToggle={() => toggleSection('visual')}
        >
          <PropertyField
            label="Border Radius"
            value={getPropertyValue('borderRadius')}
            type="text"
            onChange={(value) => handlePropertyChange('borderRadius', value)}
          />
          <PropertyField
            label="Box Shadow"
            value={getPropertyValue('boxShadow')}
            type="text"
            onChange={(value) => handlePropertyChange('boxShadow', value)}
          />
          <PropertyField
            label="Opacity"
            value={getPropertyValue('opacity')}
            type="number"
            onChange={(value) => handlePropertyChange('opacity', value)}
          />
        </CollapsibleSection>

        {/* States section - Composants interactifs seulement */}
        {(selectedElement.type === 'button' || selectedElement.type === 'link') && (
          <CollapsibleSection
            title="States"
            isOpen={openSections.states}
            onToggle={() => toggleSection('states')}
          >
            <PropertyField
              label="Hover Background"
              value={getPropertyValue('hoverBackgroundColor')}
              type="color"
              onChange={(value) => handlePropertyChange('hoverBackgroundColor', value)}
            />
            <PropertyField
              label="Hover Text Color"
              value={getPropertyValue('hoverTextColor')}
              type="color"
              onChange={(value) => handlePropertyChange('hoverTextColor', value)}
            />
            <PropertyField
              label="Focus Box Shadow"
              value={getPropertyValue('focusBoxShadow')}
              type="text"
              onChange={(value) => handlePropertyChange('focusBoxShadow', value)}
            />
          </CollapsibleSection>
        )}
      </div>
    );
  };

  const renderLayoutTab = () => {
    return (
      <div className="tab-content">
        {/* Dimensions section */}
        <CollapsibleSection
          title="Dimensions"
          isOpen={openSections.dimensions}
          onToggle={() => toggleSection('dimensions')}
        >
          {selectedElement.type === 'project' && (
            <>
              <PropertyField
                label="Desktop Breakpoint"
                value={getPropertyValue('breakpointDesktop')}
                type="text"
                onChange={(value) => handlePropertyChange('breakpointDesktop', value)}
              />
              <PropertyField
                label="Tablet Breakpoint"
                value={getPropertyValue('breakpointTablet')}
                type="text"
                onChange={(value) => handlePropertyChange('breakpointTablet', value)}
              />
              <PropertyField
                label="Mobile Breakpoint"
                value={getPropertyValue('breakpointMobile')}
                type="text"
                onChange={(value) => handlePropertyChange('breakpointMobile', value)}
              />
            </>
          )}
          
          {selectedElement.type !== 'project' && (
            <>
              <PropertyField
                label={`Width (${device})`}
                value={getPropertyValue(`width${device.charAt(0).toUpperCase() + device.slice(1)}`)}
                type="text"
                onChange={(value) => handlePropertyChange(`width${device.charAt(0).toUpperCase() + device.slice(1)}`, value)}
              />
              <PropertyField
                label={`Height (${device})`}
                value={getPropertyValue(`height${device.charAt(0).toUpperCase() + device.slice(1)}`)}
                type="text"
                onChange={(value) => handlePropertyChange(`height${device.charAt(0).toUpperCase() + device.slice(1)}`, value)}
              />
            </>
          )}
        </CollapsibleSection>

        {/* Spacing section */}
        {selectedElement.type !== 'project' && (
          <CollapsibleSection
            title="Spacing"
            isOpen={openSections.spacing}
            onToggle={() => toggleSection('spacing')}
          >
            <PropertyField
              label="Padding Top"
              value={getPropertyValue('paddingTop')}
              type="text"
              onChange={(value) => handlePropertyChange('paddingTop', value)}
            />
            <PropertyField
              label="Padding Right"
              value={getPropertyValue('paddingRight')}
              type="text"
              onChange={(value) => handlePropertyChange('paddingRight', value)}
            />
            <PropertyField
              label="Padding Bottom"
              value={getPropertyValue('paddingBottom')}
              type="text"
              onChange={(value) => handlePropertyChange('paddingBottom', value)}
            />
            <PropertyField
              label="Padding Left"
              value={getPropertyValue('paddingLeft')}
              type="text"
              onChange={(value) => handlePropertyChange('paddingLeft', value)}
            />
            <PropertyField
              label="Margin Top"
              value={getPropertyValue('marginTop')}
              type="text"
              onChange={(value) => handlePropertyChange('marginTop', value)}
            />
            <PropertyField
              label="Margin Right"
              value={getPropertyValue('marginRight')}
              type="text"
              onChange={(value) => handlePropertyChange('marginRight', value)}
            />
            <PropertyField
              label="Margin Bottom"
              value={getPropertyValue('marginBottom')}
              type="text"
              onChange={(value) => handlePropertyChange('marginBottom', value)}
            />
            <PropertyField
              label="Margin Left"
              value={getPropertyValue('marginLeft')}
              type="text"
              onChange={(value) => handlePropertyChange('marginLeft', value)}
            />
          </CollapsibleSection>
        )}

        {/* Flexbox section - Containers seulement */}
        {(selectedElement.type === 'div' || selectedElement.type === 'section' || selectedElement.type === 'form') && (
          <CollapsibleSection
            title="Flexbox"
            isOpen={openSections.flexbox}
            onToggle={() => toggleSection('flexbox')}
          >
            <PropertyField
              label="Display"
              value={getPropertyValue('display')}
              type="select"
              onChange={(value) => handlePropertyChange('display', value)}
            >
              <option value="block">Block</option>
              <option value="flex">Flex</option>
              <option value="grid">Grid</option>
            </PropertyField>
            <PropertyField
              label="Flex Direction"
              value={getPropertyValue('flexDirection')}
              type="select"
              onChange={(value) => handlePropertyChange('flexDirection', value)}
            >
              <option value="row">Row</option>
              <option value="column">Column</option>
            </PropertyField>
            <PropertyField
              label="Justify Content"
              value={getPropertyValue('justifyContent')}
              type="select"
              onChange={(value) => handlePropertyChange('justifyContent', value)}
            >
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
              <option value="space-between">Space Between</option>
            </PropertyField>
            <PropertyField
              label="Align Items"
              value={getPropertyValue('alignItems')}
              type="select"
              onChange={(value) => handlePropertyChange('alignItems', value)}
            >
              <option value="stretch">Stretch</option>
              <option value="center">Center</option>
              <option value="flex-start">Start</option>
              <option value="flex-end">End</option>
            </PropertyField>
            <PropertyField
              label="Gap"
              value={getPropertyValue('gap')}
              type="text"
              onChange={(value) => handlePropertyChange('gap', value)}
            />
          </CollapsibleSection>
        )}

        {/* Advanced section */}
        <CollapsibleSection
          title="Advanced"
          isOpen={openSections.advanced}
          onToggle={() => toggleSection('advanced')}
        >
          <PropertyField
            label="CSS Classes"
            value={getPropertyValue('cssClasses')}
            type="text"
            onChange={(value) => handlePropertyChange('cssClasses', value)}
          />
          {selectedElement.type !== 'project' && (
            <PropertyField
              label="Overflow"
              value={getPropertyValue('overflow')}
              type="select"
              onChange={(value) => handlePropertyChange('overflow', value)}
            >
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="scroll">Scroll</option>
              <option value="auto">Auto</option>
            </PropertyField>
          )}
        </CollapsibleSection>
      </div>
    );
  };

  if (!selectedElement) {
    return (
      <div className="project-properties">
        <div className="properties-content">
          <div className="properties-empty">
            <div className="empty-icon">🎯</div>
            <div className="empty-text">
              <h4>No Element Selected</h4>
              <p>Select an element from the structure or preview to edit its properties</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-properties">
      <div className="properties-content">
        {/* Tabs Navigation */}
        <div className="properties-tabs">
          <button
            className={`properties-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            CONTENT
          </button>
          <button
            className={`properties-tab ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            STYLE
          </button>
          <button
            className={`properties-tab ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            LAYOUT
          </button>
        </div>

        {/* Active Tab Content */}
        {renderTabContent()}

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
    </div>
  );
}

export default PropertiesModule;