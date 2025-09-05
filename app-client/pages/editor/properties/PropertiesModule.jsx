import React, { useState } from 'react';
import PropertyField from './PropertyField.jsx';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Panel propriétés avec 3 onglets + sous-sections pliables
 * REÇOIT : selectedElement, device, onElementUpdate
 * RETOURNE : Interface organisée Content/Style/Layout
 * ERREURS : Défensif avec element null + validation types
 */

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
      [propertyName]: value
    };
    
    // Auto-update timestamp pour PROJECT
    if (selectedElement.type === 'project') {
      updatedElement.updated = new Date().toISOString();
    }
    
    console.log(`🚀 Property changed: ${propertyName} = ${value}`);
    onElementUpdate(selectedElement.id, updatedElement);
  };

  const getPropertyValue = (key) => {
    if (!selectedElement) return '';
    return selectedElement[key] || '';
  };

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

          {(elementType === 'heading' || elementType === 'paragraph' || elementType === 'button' || elementType === 'link') && (
            <PropertyField
              label="Content"
              value={getPropertyValue('content')}
              type={elementType === 'paragraph' ? 'textarea' : 'text'}
              onChange={(value) => handlePropertyChange('content', value)}
            />
          )}

          {elementType === 'heading' && (
            <PropertyField
              label="Tag"
              value={getPropertyValue('tag')}
              type="select"
              onChange={(value) => handlePropertyChange('tag', value)}
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
              <option value="h5">H5</option>
              <option value="h6">H6</option>
            </PropertyField>
          )}

          {elementType === 'image' && (
            <>
              <PropertyField
                label="Source"
                value={getPropertyValue('src')}
                type="url"
                onChange={(value) => handlePropertyChange('src', value)}
              />
              <PropertyField
                label="Alt Text"
                value={getPropertyValue('alt')}
                type="text"
                onChange={(value) => handlePropertyChange('alt', value)}
              />
            </>
          )}

          {elementType === 'video' && (
            <>
              <PropertyField
                label="Source"
                value={getPropertyValue('src')}
                type="url"
                onChange={(value) => handlePropertyChange('src', value)}
              />
              <PropertyField
                label="Poster"
                value={getPropertyValue('poster')}
                type="url"
                onChange={(value) => handlePropertyChange('poster', value)}
              />
              <PropertyField
                label="Controls"
                value={getPropertyValue('controls')}
                type="checkbox"
                onChange={(value) => handlePropertyChange('controls', value)}
              />
            </>
          )}

          {elementType === 'input' && (
            <>
              <PropertyField
                label="Placeholder"
                value={getPropertyValue('placeholder')}
                type="text"
                onChange={(value) => handlePropertyChange('placeholder', value)}
              />
              <PropertyField
                label="Input Type"
                value={getPropertyValue('inputType')}
                type="select"
                onChange={(value) => handlePropertyChange('inputType', value)}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="password">Password</option>
                <option value="number">Number</option>
                <option value="tel">Phone</option>
                <option value="url">URL</option>
              </PropertyField>
              <PropertyField
                label="Required"
                value={getPropertyValue('required')}
                type="checkbox"
                onChange={(value) => handlePropertyChange('required', value)}
              />
            </>
          )}
        </CollapsibleSection>

        {/* SEO section - Pages seulement */}
        {elementType === 'page' && (
          <CollapsibleSection
            title="SEO"
            isOpen={openSections.seo}
            onToggle={() => toggleSection('seo')}
          >
            <PropertyField
              label="Keywords"
              value={getPropertyValue('keywords')}
              type="text"
              onChange={(value) => handlePropertyChange('keywords', value)}
            />
            <PropertyField
              label="OG Image"
              value={getPropertyValue('ogImage')}
              type="url"
              onChange={(value) => handlePropertyChange('ogImage', value)}
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
        {(elementType === 'button' || elementType === 'link' || elementType === 'form') && (
          <CollapsibleSection
            title="Behavior"
            isOpen={openSections.behavior}
            onToggle={() => toggleSection('behavior')}
          >
            {elementType === 'button' && (
              <>
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
                <PropertyField
                  label="Disabled"
                  value={getPropertyValue('disabled')}
                  type="checkbox"
                  onChange={(value) => handlePropertyChange('disabled', value)}
                />
              </>
            )}
            
            {elementType === 'link' && (
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

            {elementType === 'form' && (
              <>
                <PropertyField
                  label="Action"
                  value={getPropertyValue('action')}
                  type="url"
                  onChange={(value) => handlePropertyChange('action', value)}
                />
                <PropertyField
                  label="Method"
                  value={getPropertyValue('method')}
                  type="select"
                  onChange={(value) => handlePropertyChange('method', value)}
                >
                  <option value="get">GET</option>
                  <option value="post">POST</option>
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
          <PropertyField
            label="Background Color"
            value={getPropertyValue('backgroundColor')}
            type="color"
            onChange={(value) => handlePropertyChange('backgroundColor', value)}
          />
          <PropertyField
            label="Text Color"
            value={getPropertyValue('color')}
            type="color"
            onChange={(value) => handlePropertyChange('color', value)}
          />
          <PropertyField
            label="Border Color"
            value={getPropertyValue('borderColor')}
            type="color"
            onChange={(value) => handlePropertyChange('borderColor', value)}
          />
        </CollapsibleSection>

        {/* Typography section */}
        <CollapsibleSection
          title="Typography"
          isOpen={openSections.typography}
          onToggle={() => toggleSection('typography')}
        >
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
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="400">400</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700</option>
            <option value="800">800</option>
            <option value="900">900</option>
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
          <PropertyField
            label="Line Height"
            value={getPropertyValue('lineHeight')}
            type="text"
            onChange={(value) => handlePropertyChange('lineHeight', value)}
          />
        </CollapsibleSection>

        {/* Visual section */}
        <CollapsibleSection
          title="Visual"
          isOpen={openSections.visual}
          onToggle={() => toggleSection('visual')}
        >
          <PropertyField
            label="Border Width"
            value={getPropertyValue('borderWidth')}
            type="text"
            onChange={(value) => handlePropertyChange('borderWidth', value)}
          />
          <PropertyField
            label="Border Style"
            value={getPropertyValue('borderStyle')}
            type="select"
            onChange={(value) => handlePropertyChange('borderStyle', value)}
          >
            <option value="none">None</option>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </PropertyField>
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
              value={getPropertyValue('hoverColor')}
              type="color"
              onChange={(value) => handlePropertyChange('hoverColor', value)}
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
          <PropertyField
            label="Width"
            value={getPropertyValue('width')}
            type="text"
            onChange={(value) => handlePropertyChange('width', value)}
          />
          <PropertyField
            label="Height"
            value={getPropertyValue('height')}
            type="text"
            onChange={(value) => handlePropertyChange('height', value)}
          />
          <PropertyField
            label="Min Width"
            value={getPropertyValue('minWidth')}
            type="text"
            onChange={(value) => handlePropertyChange('minWidth', value)}
          />
          <PropertyField
            label="Max Width"
            value={getPropertyValue('maxWidth')}
            type="text"
            onChange={(value) => handlePropertyChange('maxWidth', value)}
          />
        </CollapsibleSection>

        {/* Spacing section */}
        <CollapsibleSection
          title="Spacing"
          isOpen={openSections.spacing}
          onToggle={() => toggleSection('spacing')}
        >
          <PropertyField
            label="Margin"
            value={getPropertyValue('margin')}
            type="text"
            onChange={(value) => handlePropertyChange('margin', value)}
          />
          <PropertyField
            label="Padding"
            value={getPropertyValue('padding')}
            type="text"
            onChange={(value) => handlePropertyChange('padding', value)}
          />
        </CollapsibleSection>

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
              <option value="inline-flex">Inline Flex</option>
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
              <option value="row-reverse">Row Reverse</option>
              <option value="column-reverse">Column Reverse</option>
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
              <option value="space-around">Space Around</option>
              <option value="space-evenly">Space Evenly</option>
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
              <option value="baseline">Baseline</option>
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
            value={getPropertyValue('className')}
            type="text"
            onChange={(value) => handlePropertyChange('className', value)}
          />
          <PropertyField
            label="Position"
            value={getPropertyValue('position')}
            type="select"
            onChange={(value) => handlePropertyChange('position', value)}
          >
            <option value="static">Static</option>
            <option value="relative">Relative</option>
            <option value="absolute">Absolute</option>
            <option value="fixed">Fixed</option>
            <option value="sticky">Sticky</option>
          </PropertyField>
          <PropertyField
            label="Z-Index"
            value={getPropertyValue('zIndex')}
            type="number"
            onChange={(value) => handlePropertyChange('zIndex', value)}
          />
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

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}

export default PropertiesModule;