import React, { useState } from 'react';
import PropertyField from './PropertyField.jsx';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Panel propriétés COMPLET avec toutes les props des templates
 * REÇOIT : selectedElement, device, onElementUpdate
 * RETOURNE : Interface organisée Content/Style/Layout avec TOUTES les propriétés
 * NOUVEAU : Support de 100% des propriétés définies dans les templates JSON
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
    // Style sections - OUVERTS par défaut
    colors: true,
    typography: true,
    visual: true,
    states: false,
    // Layout sections - OUVERTS par défaut
    dimensions: true,
    spacing: true,
    flexbox: true,
    advanced: true
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
          title="Content Properties"
          isOpen={openSections.metadata}
          onToggle={() => toggleSection('metadata')}
        >
          {/* PROJECT PROPERTIES */}
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
            </>
          )}
          
          {/* PAGE PROPERTIES */}
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

          {/* CONTAINER PROPERTIES */}
          {(elementType === 'section' || elementType === 'div' || elementType === 'list' || elementType === 'form') && (
            <PropertyField
              label="Name"
              value={getPropertyValue('name')}
              type="text"
              onChange={(value) => handlePropertyChange('name', value)}
            />
          )}

          {/* TEXT COMPONENTS - Content + spécifiques */}
          {(elementType === 'heading' || elementType === 'paragraph' || elementType === 'button' || elementType === 'link') && (
            <PropertyField
              label="Content"
              value={getPropertyValue('content')}
              type={elementType === 'paragraph' ? 'textarea' : 'text'}
              onChange={(value) => handlePropertyChange('content', value)}
            />
          )}

          {/* HEADING SPECIFIC */}
          {elementType === 'heading' && (
            <>
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
              <PropertyField
                label="Level"
                value={getPropertyValue('level')}
                type="select"
                onChange={(value) => handlePropertyChange('level', value)}
              >
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="h4">H4</option>
                <option value="h5">H5</option>
                <option value="h6">H6</option>
              </PropertyField>
            </>
          )}

          {/* BUTTON SPECIFIC */}
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
                label="Icon"
                value={getPropertyValue('icon')}
                type="text"
                onChange={(value) => handlePropertyChange('icon', value)}
              />
              <PropertyField
                label="Icon Position"
                value={getPropertyValue('iconPosition')}
                type="select"
                onChange={(value) => handlePropertyChange('iconPosition', value)}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </PropertyField>
              <PropertyField
                label="Action"
                value={getPropertyValue('action')}
                type="text"
                onChange={(value) => handlePropertyChange('action', value)}
              />
              <PropertyField
                label="Href"
                value={getPropertyValue('href')}
                type="url"
                onChange={(value) => handlePropertyChange('href', value)}
              />
              <PropertyField
                label="Disabled"
                value={getPropertyValue('disabled')}
                type="checkbox"
                onChange={(value) => handlePropertyChange('disabled', value)}
              />
            </>
          )}

          {/* LINK SPECIFIC */}
          {elementType === 'link' && (
            <>
              <PropertyField
                label="Href"
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
                <option value="_parent">Parent</option>
                <option value="_top">Top</option>
              </PropertyField>
              <PropertyField
                label="Text Decoration"
                value={getPropertyValue('textDecoration')}
                type="select"
                onChange={(value) => handlePropertyChange('textDecoration', value)}
              >
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="overline">Overline</option>
                <option value="line-through">Line Through</option>
              </PropertyField>
            </>
          )}

          {/* IMAGE SPECIFIC */}
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
              <PropertyField
                label="Lazy Loading"
                value={getPropertyValue('lazy')}
                type="checkbox"
                onChange={(value) => handlePropertyChange('lazy', value)}
              />
              <PropertyField
                label="Object Fit"
                value={getPropertyValue('objectFit')}
                type="select"
                onChange={(value) => handlePropertyChange('objectFit', value)}
              >
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </PropertyField>
            </>
          )}

          {/* VIDEO SPECIFIC */}
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
              <PropertyField
                label="Autoplay"
                value={getPropertyValue('autoplay')}
                type="checkbox"
                onChange={(value) => handlePropertyChange('autoplay', value)}
              />
              <PropertyField
                label="Loop"
                value={getPropertyValue('loop')}
                type="checkbox"
                onChange={(value) => handlePropertyChange('loop', value)}
              />
              <PropertyField
                label="Muted"
                value={getPropertyValue('muted')}
                type="checkbox"
                onChange={(value) => handlePropertyChange('muted', value)}
              />
            </>
          )}

          {/* INPUT SPECIFIC */}
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
              <PropertyField
                label="Disabled"
                value={getPropertyValue('disabled')}
                type="checkbox"
                onChange={(value) => handlePropertyChange('disabled', value)}
              />
              <PropertyField
                label="Value"
                value={getPropertyValue('value')}
                type="text"
                onChange={(value) => handlePropertyChange('value', value)}
              />
            </>
          )}

          {/* FORM SPECIFIC */}
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
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </PropertyField>
            </>
          )}

          {/* LIST SPECIFIC */}
          {elementType === 'list' && (
            <PropertyField
              label="List Type"
              value={getPropertyValue('listType')}
              type="select"
              onChange={(value) => handlePropertyChange('listType', value)}
            >
              <option value="ul">Unordered List (ul)</option>
              <option value="ol">Ordered List (ol)</option>
            </PropertyField>
          )}

          {/* CLASSNAME pour tous */}
          <PropertyField
            label="CSS Classes"
            value={getPropertyValue('classname')}
            type="text"
            onChange={(value) => handlePropertyChange('classname', value)}
          />
        </CollapsibleSection>
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
            value={getPropertyValue('textColor')}
            type="color"
            onChange={(value) => handlePropertyChange('textColor', value)}
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
            <option value="300">Light</option>
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semi Bold</option>
            <option value="700">Bold</option>
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
          <PropertyField
            label="Letter Spacing"
            value={getPropertyValue('letterSpacing')}
            type="text"
            onChange={(value) => handlePropertyChange('letterSpacing', value)}
          />
        </CollapsibleSection>

        {/* Visual section */}
        <CollapsibleSection
          title="Visual"
          isOpen={openSections.visual}
          onToggle={() => toggleSection('visual')}
        >
          <PropertyField
            label="Border"
            value={getPropertyValue('border')}
            type="text"
            onChange={(value) => handlePropertyChange('border', value)}
          />
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

        {/* Advanced section */}
        <CollapsibleSection
          title="Advanced"
          isOpen={openSections.advanced}
          onToggle={() => toggleSection('advanced')}
        >
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