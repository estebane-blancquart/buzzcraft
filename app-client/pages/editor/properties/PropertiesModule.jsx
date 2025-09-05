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

function PropertiesModule({ 
  selectedElement = null, 
  device = DEVICES.DESKTOP, 
  onElementUpdate = () => {} 
}) {
  const [activeTab, setActiveTab] = useState('content');
  const [openSections, setOpenSections] = useState({
    // Data sections (ouvertes par défaut)
    data: true,
    metadata: false,
    // Style sections
    colors: false,
    typography: false,
    visual: false,
    states: false,
    // Layout sections
    dimensions: false,
    spacing: false,
    flexbox: false,
    responsive: false,
    advanced: false
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const getPropertyValue = (key) => {
    if (!selectedElement) return '';
    return selectedElement[key] || '';
  };

  const handlePropertyChange = (propertyName, value) => {
    if (!selectedElement || !onElementUpdate) return;
    
    const updatedElement = {
      ...selectedElement,
      [propertyName]: value
    };
    
    if (selectedElement.type === 'project') {
      updatedElement.updated = new Date().toISOString();
    }
    
    console.log(`��� Property changed: ${propertyName} = ${value}`);
    onElementUpdate(selectedElement.id, updatedElement);
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
        {/* DATA SECTION - TOUJOURS VISIBLE ET OUVERTE */}
        <CollapsibleSection
          title="Data"
          isOpen={openSections.data}
          onToggle={() => toggleSection('data')}
        >
          {/* NAME - POUR TOUS LES ÉLÉMENTS */}
          <PropertyField
            label="Name"
            value={getPropertyValue('name')}
            type="text"
            onChange={(value) => handlePropertyChange('name', value)}
          />

          {/* PROJECT - Métadonnées globales */}
          {elementType === 'project' && (
            <>
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

          {/* PAGE - SEO + routing */}
          {elementType === 'page' && (
            <>
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

          {/* COMPONENTS - Contenu utilisateur */}
          {(elementType === 'heading' || elementType === 'paragraph' || elementType === 'button' || elementType === 'link') && (
            <PropertyField
              label="Content"
              value={getPropertyValue('content')}
              type={elementType === 'paragraph' ? 'textarea' : 'text'}
              onChange={(value) => handlePropertyChange('content', value)}
            />
          )}

          {/* HEADING - Tag spécifique */}
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

          {/* IMAGE - Source et alt */}
          {elementType === 'image' && (
            <>
              <PropertyField
                label="Source URL"
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

          {/* BUTTON/LINK - URLs */}
          {(elementType === 'button' || elementType === 'link') && (
            <>
              <PropertyField
                label="Link URL"
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

          {/* INPUT - Propriétés spécifiques */}
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
                type="select"
                onChange={(value) => handlePropertyChange('required', value)}
              >
                <option value="false">Optional</option>
                <option value="true">Required</option>
              </PropertyField>
            </>
          )}
        </CollapsibleSection>

        {/* METADATA SECTION - FERMÉE PAR DÉFAUT */}
        <CollapsibleSection
          title="Metadata"
          isOpen={openSections.metadata}
          onToggle={() => toggleSection('metadata')}
        >
          <PropertyField
            label="ID"
            value={getPropertyValue('id')}
            type="text"
            onChange={() => {}} // Read-only
            disabled={true}
          />
          <PropertyField
            label="Type"
            value={getPropertyValue('type')}
            type="text"
            onChange={() => {}} // Read-only
            disabled={true}
          />
          {elementType === 'project' && (
            <>
              <PropertyField
                label="Created"
                value={getPropertyValue('created')}
                type="text"
                onChange={() => {}} // Read-only
                disabled={true}
              />
              <PropertyField
                label="Updated"
                value={getPropertyValue('updated')}
                type="text"
                onChange={() => {}} // Read-only
                disabled={true}
              />
            </>
          )}
        </CollapsibleSection>
      </div>
    );
  };

  const renderStyleTab = () => {
    const elementType = selectedElement.type;

    return (
      <div className="tab-content">
        {/* COLORS - Selon le type d'élément */}
        <CollapsibleSection
          title="Colors"
          isOpen={openSections.colors}
          onToggle={() => toggleSection('colors')}
        >
          {/* PROJECT - Thème global */}
          {elementType === 'project' && (
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
          
          {/* SECTION/CONTAINER/COMPONENT - Couleurs locales */}
          {(elementType === 'section' || elementType === 'div' || elementType === 'list' || elementType === 'form' || 
            elementType === 'heading' || elementType === 'paragraph' || elementType === 'button' || elementType === 'link' || elementType === 'image') && (
            <>
              <PropertyField
                label="Background Color"
                value={getPropertyValue('backgroundColor')}
                type="color"
                onChange={(value) => handlePropertyChange('backgroundColor', value)}
              />
              {/* Text Color seulement pour les éléments textuels */}
              {(elementType === 'heading' || elementType === 'paragraph' || elementType === 'button' || elementType === 'link') && (
                <PropertyField
                  label="Text Color"
                  value={getPropertyValue('textColor')}
                  type="color"
                  onChange={(value) => handlePropertyChange('textColor', value)}
                />
              )}
            </>
          )}
        </CollapsibleSection>

        {/* TYPOGRAPHY - COMPONENTS SEULEMENT */}
        {(elementType === 'heading' || elementType === 'paragraph' || elementType === 'button' || elementType === 'link') && (
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
              <option value="300">Light (300)</option>
              <option value="400">Normal (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semi Bold (600)</option>
              <option value="700">Bold (700)</option>
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
        )}

        {/* VISUAL - TOUS SAUF PAGE */}
        {elementType !== 'page' && (
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
        )}

        {/* STATES - COMPONENTS INTERACTIFS SEULEMENT */}
        {(elementType === 'button' || elementType === 'link') && (
          <CollapsibleSection
            title="Interactive States"
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
    const elementType = selectedElement.type;

    return (
      <div className="tab-content">
        {/* DIMENSIONS - TOUS SAUF PROJECT/PAGE */}
        {(elementType !== 'project' && elementType !== 'page') && (
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
          </CollapsibleSection>
        )}

        {/* SPACING - COMPONENTS ET CONTAINERS */}
        {(elementType === 'section' || elementType === 'div' || elementType === 'list' || elementType === 'form' || 
          elementType === 'heading' || elementType === 'paragraph' || elementType === 'button' || elementType === 'link' || elementType === 'image') && (
          <CollapsibleSection
            title="Spacing"
            isOpen={openSections.spacing}
            onToggle={() => toggleSection('spacing')}
          >
            <PropertyField
              label="Padding"
              value={getPropertyValue('padding')}
              type="text"
              onChange={(value) => handlePropertyChange('padding', value)}
            />
            <PropertyField
              label="Margin"
              value={getPropertyValue('margin')}
              type="text"
              onChange={(value) => handlePropertyChange('margin', value)}
            />
          </CollapsibleSection>
        )}

        {/* FLEXBOX - CONTAINERS SEULEMENT */}
        {(elementType === 'div' || elementType === 'list' || elementType === 'form') && (
          <CollapsibleSection
            title="Flexbox Layout"
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

        {/* RESPONSIVE - SECTION ET PROJECT */}
        {(elementType === 'section' || elementType === 'project') && (
          <CollapsibleSection
            title="Responsive"
            isOpen={openSections.responsive}
            onToggle={() => toggleSection('responsive')}
          >
            {elementType === 'project' && (
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
            {elementType === 'section' && (
              <>
                <PropertyField
                  label="Desktop Columns"
                  value={getPropertyValue('desktopColumns')}
                  type="number"
                  onChange={(value) => handlePropertyChange('desktopColumns', value)}
                />
                <PropertyField
                  label="Tablet Columns"
                  value={getPropertyValue('tabletColumns')}
                  type="number"
                  onChange={(value) => handlePropertyChange('tabletColumns', value)}
                />
                <PropertyField
                  label="Mobile Columns"
                  value={getPropertyValue('mobileColumns')}
                  type="number"
                  onChange={(value) => handlePropertyChange('mobileColumns', value)}
                />
              </>
            )}
          </CollapsibleSection>
        )}

        {/* ADVANCED - TOUS */}
        <CollapsibleSection
          title="Advanced"
          isOpen={openSections.advanced}
          onToggle={() => toggleSection('advanced')}
        >
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

  if (!selectedElement) {
    return (
      <div className="project-properties">
        <div className="properties-content">
          <div className="properties-empty">
            <div className="empty-icon">���</div>
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
      </div>
    </div>
  );
}

export default PropertiesModule;
