import React from 'react';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Rendu propre type site web fini
 * REÇOIT : project, device, selectedElement, onElementSelect
 * RETOURNE : Preview réaliste avec sélection discrète
 * NOUVEAU : Plus de bruit visuel, rendu final
 */

function CanvasFrame({ 
  project = null, 
  device = DEVICES.DESKTOP, 
  selectedElement = null, 
  onElementSelect = () => {} 
}) {
  const handleElementClick = (element, event) => {
    event.stopPropagation();
    if (onElementSelect) {
      onElementSelect(element);
    }
  };

  const isSelected = (element) => {
    return selectedElement && selectedElement.id === element?.id;
  };

  const renderComponent = (component) => {
    const isComponentSelected = isSelected(component);
    const baseClass = isComponentSelected ? 'selected' : '';
    
    return (
      <div
        key={component.id}
        className={`preview-element ${baseClass}`}
        onClick={(e) => handleElementClick(component, e)}
        style={{ cursor: 'pointer' }}
      >
        {component.type === 'heading' && (
          React.createElement(component.tag || 'h2', {
            className: component.classname || '',
            style: {
              fontSize: component.fontSize || '2rem',
              fontWeight: component.fontWeight || '600',
              color: component.textColor || '#1a1a1a',
              textAlign: component.textAlign || 'left',
              lineHeight: component.lineHeight || '1.2',
              margin: component.margin || '0 0 1rem 0'
            }
          }, component.text || component.content || 'Heading')
        )}
        
        {component.type === 'paragraph' && (
          <p 
            className={component.classname || ''}
            style={{
              fontSize: component.fontSize || '1rem',
              fontWeight: component.fontWeight || '400',
              color: component.textColor || '#333',
              textAlign: component.textAlign || 'left',
              lineHeight: component.lineHeight || '1.6',
              margin: component.margin || '0 0 1rem 0'
            }}
          >
            {component.text || component.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
          </p>
        )}
        
        {component.type === 'button' && (
          <button 
            className={component.classname || ''}
            style={{
              backgroundColor: component.backgroundColor || '#007bff',
              color: component.textColor || 'white',
              fontSize: component.fontSize || '1rem',
              fontWeight: component.fontWeight || '500',
              padding: component.padding || '12px 24px',
              border: component.border || 'none',
              borderRadius: component.borderRadius || '6px',
              cursor: 'pointer',
              margin: component.margin || '0 0 1rem 0'
            }}
          >
            {component.text || component.content || 'Button'}
          </button>
        )}
        
        {component.type === 'image' && (
          <img 
            src={component.src || 'https://via.placeholder.com/300x200?text=Image'}
            alt={component.alt || 'Image'}
            className={component.classname || ''}
            style={{
              width: component.width || 'auto',
              height: component.height || 'auto',
              maxWidth: '100%',
              borderRadius: component.borderRadius || '0',
              margin: component.margin || '0 0 1rem 0',
              objectFit: component.objectFit || 'cover'
            }}
          />
        )}
        
        {component.type === 'link' && (
          <a 
            href={component.href || '#'}
            target={component.target || '_self'}
            className={component.classname || ''}
            style={{
              color: component.textColor || '#007bff',
              fontSize: component.fontSize || '1rem',
              fontWeight: component.fontWeight || '400',
              textDecoration: component.textDecoration || 'underline',
              margin: component.margin || '0 0 1rem 0'
            }}
          >
            {component.text || component.content || 'Link'}
          </a>
        )}

        {component.type === 'input' && (
          <input 
            type={component.inputType || 'text'}
            placeholder={component.placeholder || 'Enter text...'}
            value={component.value || ''}
            className={component.classname || ''}
            style={{
              width: component.width || '100%',
              padding: component.padding || '12px',
              border: component.border || '1px solid #ddd',
              borderRadius: component.borderRadius || '4px',
              fontSize: component.fontSize || '1rem',
              margin: component.margin || '0 0 1rem 0'
            }}
            readOnly
          />
        )}

        {component.type === 'textarea' && (
          <textarea 
            placeholder={component.placeholder || 'Enter text...'}
            value={component.value || ''}
            className={component.classname || ''}
            style={{
              width: component.width || '100%',
              padding: component.padding || '12px',
              border: component.border || '1px solid #ddd',
              borderRadius: component.borderRadius || '4px',
              fontSize: component.fontSize || '1rem',
              margin: component.margin || '0 0 1rem 0',
              minHeight: '100px',
              resize: 'vertical'
            }}
            readOnly
          />
        )}
      </div>
    );
  };

  const renderContainer = (container) => {
    const isContainerSelected = isSelected(container);
    const baseClass = isContainerSelected ? 'selected' : '';
    
    return (
      <div
        key={container.id}
        className={`preview-element ${baseClass}`}
        onClick={(e) => handleElementClick(container, e)}
        style={{
          backgroundColor: container.backgroundColor || 'transparent',
          padding: container.padding || '20px',
          margin: container.margin || '0 0 2rem 0',
          borderRadius: container.borderRadius || '0',
          border: container.border || 'none',
          display: container.display || 'block',
          flexDirection: container.flexDirection || 'column',
          justifyContent: container.justifyContent || 'flex-start',
          alignItems: container.alignItems || 'flex-start',
          gap: container.gap || '1rem',
          cursor: 'pointer'
        }}
      >
        {container.components?.map(renderComponent)}
        {(!container.components || container.components.length === 0) && (
          <div className="empty-placeholder">
            Click to add components
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section) => {
    const isSectionSelected = isSelected(section);
    const baseClass = isSectionSelected ? 'selected' : '';
    
    // Gestion responsive des colonnes
    const getColumns = () => {
      switch(device) {
        case DEVICES.MOBILE:
          return section.mobileColumns || 1;
        case DEVICES.TABLET:
          return section.tabletColumns || 2;
        default:
          return section.desktopColumns || 3;
      }
    };

    const columns = getColumns();
    const containers = [
      ...(section.divs || []).map(div => ({ ...div, type: 'div' })),
      ...(section.lists || []).map(list => ({ ...list, type: 'list' })),
      ...(section.forms || []).map(form => ({ ...form, type: 'form' })),
      ...(section.containers || [])
    ];
    
    return (
      <section
        key={section.id}
        className={`preview-element ${baseClass}`}
        onClick={(e) => handleElementClick(section, e)}
        style={{
          backgroundColor: section.backgroundColor || 'transparent',
          backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : 'none',
          padding: section.padding || '40px 20px',
          margin: section.margin || '0 0 3rem 0',
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: section.gap || '2rem',
          cursor: 'pointer'
        }}
      >
        {containers.map(renderContainer)}
        {containers.length === 0 && (
          <div className="empty-placeholder" style={{ gridColumn: '1 / -1' }}>
            Click to add containers
          </div>
        )}
      </section>
    );
  };

  if (!project) {
    return (
      <div className="preview-content">
        <div className="empty-state">
          <h2>No project loaded</h2>
          <p>Select a project to start designing</p>
        </div>
      </div>
    );
  }

  const currentPage = project.pages?.[0]; // Première page pour l'instant

  // Fonction pour obtenir les sections selon la structure
  const getPageSections = (page) => {
    if (!page) return [];
    return page.layout?.sections || page.sections || [];
  };

  return (
    <div className="preview-content">
      <div className={`preview-viewport device-${device}`}>
        <div 
          className="preview-website"
          style={{
            fontFamily: project.fontFamily || 'system-ui, sans-serif',
            backgroundColor: '#ffffff',
            minHeight: '100vh'
          }}
        >
          {/* Header du site si configuré */}
          {project.header && (
            <header style={{ 
              backgroundColor: project.header.backgroundColor || '#f8f9fa',
              padding: '1rem 2rem',
              borderBottom: '1px solid #e9ecef'
            }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
                {project.name}
              </h1>
            </header>
          )}

          {/* Contenu principal */}
          <main style={{ padding: '2rem' }}>
            {currentPage && getPageSections(currentPage).map(renderSection)}
            {(!currentPage || getPageSections(currentPage).length === 0) && (
              <div className="empty-state">
                <h2>Empty Page</h2>
                <p>Add sections to start building your page</p>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  Current page: {currentPage?.name || 'No page'}
                  <br />
                  Sections found: {currentPage ? getPageSections(currentPage).length : 0}
                </div>
              </div>
            )}
          </main>

          {/* Footer du site si configuré */}
          {project.footer && (
            <footer style={{ 
              backgroundColor: project.footer.backgroundColor || '#f8f9fa',
              padding: '2rem',
              borderTop: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#6c757d' }}>
                © 2024 {project.name}
              </p>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

export default CanvasFrame;