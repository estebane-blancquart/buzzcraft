import React from "react";
import { DEVICES } from "@config/constants.js";

/*
 * FAIT QUOI : Rendu visuel depuis project.json structure réelle
 * REÇOIT : project, device, selectedElement, onElementSelect
 * RETOURNE : Preview basée sur project.pages[].sections[].containers[].components[]
 * ERREURS : Défensif avec project null + rendu placeholder vides
 */

function CanvasFrame({
  project = null,
  device = DEVICES.DESKTOP,
  selectedElement = null,
  onElementSelect = () => {},
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

  // Rendu des composants selon leur type
  const renderComponent = (component) => {
    const isComponentSelected = isSelected(component);
    const baseClass = isComponentSelected ? 'selected' : '';

    // Styles communs à tous les composants
    const commonStyles = {
      backgroundColor: component.backgroundColor || 'transparent',
      color: component.color || 'inherit',
      fontSize: component.fontSize || 'inherit',
      fontWeight: component.fontWeight || 'normal',
      textAlign: component.textAlign || 'left',
      lineHeight: component.lineHeight || 'normal',
      border: component.borderWidth ? 
        `${component.borderWidth} ${component.borderStyle || 'solid'} ${component.borderColor || '#000'}` : 
        'none',
      borderRadius: component.borderRadius || '0',
      boxShadow: component.boxShadow || 'none',
      opacity: component.opacity || 1,
      margin: component.margin || '0',
      padding: component.padding || '0',
      width: component.width || 'auto',
      height: component.height || 'auto',
      position: component.position || 'static',
      zIndex: component.zIndex || 'auto',
      cursor: 'pointer'
    };

    return (
      <div
        key={component.id}
        className={`preview-element component ${baseClass}`}
        onClick={(e) => handleElementClick(component, e)}
        style={{ ...commonStyles }}
      >
        {component.type === "heading" && (
          React.createElement(
            component.tag || 'h2',
            {
              style: { margin: 0, padding: 0 }
            },
            component.content || 'New Heading'
          )
        )}

        {component.type === "paragraph" && (
          <p style={{ margin: 0, padding: 0 }}>
            {component.content || 'New paragraph text...'}
          </p>
        )}

        {component.type === "button" && (
          <button
            type={component.buttonType || "button"}
            disabled={component.disabled || false}
            style={{
              backgroundColor: component.hoverBackgroundColor && isComponentSelected ? 
                component.hoverBackgroundColor : 
                (component.backgroundColor || '#007bff'),
              color: component.hoverColor && isComponentSelected ? 
                component.hoverColor : 
                (component.color || 'white'),
              border: component.borderWidth ? 
                `${component.borderWidth} ${component.borderStyle || 'solid'} ${component.borderColor || '#007bff'}` : 
                '1px solid #007bff',
              borderRadius: component.borderRadius || '4px',
              padding: component.padding || '8px 16px',
              cursor: component.disabled ? 'not-allowed' : 'pointer',
              opacity: component.disabled ? 0.6 : (component.opacity || 1),
              boxShadow: component.focusBoxShadow && isComponentSelected ? 
                component.focusBoxShadow : 
                (component.boxShadow || 'none')
            }}
          >
            {component.content || 'Click me'}
          </button>
        )}

        {component.type === "image" && (
          <img
            src={component.src || 'https://via.placeholder.com/300x200?text=Image'}
            alt={component.alt || 'Image'}
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              objectFit: component.objectFit || 'cover'
            }}
          />
        )}

        {component.type === "video" && (
          <video
            src={component.src}
            poster={component.poster}
            controls={component.controls || false}
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto'
            }}
          >
            {!component.src && 'Video source not specified'}
          </video>
        )}

        {component.type === "link" && (
          <a
            href={component.href || "#"}
            target={component.target || "_self"}
            style={{
              color: component.hoverColor && isComponentSelected ? 
                component.hoverColor : 
                (component.color || '#007bff'),
              textDecoration: 'underline'
            }}
            onClick={(e) => e.preventDefault()} // Empêcher navigation en preview
          >
            {component.content || 'Link text'}
          </a>
        )}

        {component.type === "input" && (
          <input
            type={component.inputType || "text"}
            placeholder={component.placeholder || "Enter text..."}
            required={component.required || false}
            readOnly
            style={{
              width: '100%',
              padding: component.padding || '8px 12px',
              border: component.borderWidth ? 
                `${component.borderWidth} ${component.borderStyle || 'solid'} ${component.borderColor || '#ddd'}` : 
                '1px solid #ddd',
              borderRadius: component.borderRadius || '4px',
              backgroundColor: component.backgroundColor || 'white',
              color: component.color || '#333'
            }}
          />
        )}
      </div>
    );
  };

  // Rendu des containers selon leur type
  const renderContainer = (container) => {
    const isContainerSelected = isSelected(container);
    const baseClass = isContainerSelected ? 'selected' : '';
    
    const containerStyles = {
      backgroundColor: container.backgroundColor || 'transparent',
      backgroundImage: container.backgroundImage ? `url(${container.backgroundImage})` : 'none',
      color: container.color || 'inherit',
      border: container.borderWidth ? 
        `${container.borderWidth} ${container.borderStyle || 'solid'} ${container.borderColor || '#000'}` : 
        'none',
      borderRadius: container.borderRadius || '0',
      boxShadow: container.boxShadow || 'none',
      opacity: container.opacity || 1,
      overflow: container.overflow || 'visible',
      
      // Layout Flexbox
      display: container.display || 'block',
      flexDirection: container.flexDirection || 'column',
      justifyContent: container.justifyContent || 'flex-start',
      alignItems: container.alignItems || 'flex-start',
      flexWrap: container.flexWrap || 'nowrap',
      gap: container.gap || '0',
      
      // Spacing
      margin: container.margin || '0',
      padding: container.padding || '16px',
      
      // Dimensions
      width: container.width || 'auto',
      height: container.height || 'auto',
      minWidth: container.minWidth || 'auto',
      maxWidth: container.maxWidth || 'none',
      
      // Position
      position: container.position || 'static',
      zIndex: container.zIndex || 'auto',
      
      cursor: 'pointer'
    };

    const components = container.components || [];

    // Rendu spécial pour les différents types de containers
    if (container.type === 'form') {
      return (
        <div
          key={container.id}
          className={`preview-element container form ${baseClass}`}
          onClick={(e) => handleElementClick(container, e)}
          style={containerStyles}
        >
          {components.map(renderComponent)}
          {components.length === 0 && (
            <div className="empty-placeholder">
              Click to add form fields
            </div>
          )}
        </div>
      );
    }

    if (container.type === 'list') {
      const ListTag = container.listType === 'ol' ? 'ol' : 'ul';
      return (
        <ListTag
          key={container.id}
          className={`preview-element container list ${baseClass}`}
          onClick={(e) => handleElementClick(container, e)}
          style={{
            ...containerStyles,
            listStyle: container.listType === 'ol' ? 'decimal' : 'disc',
            paddingLeft: '20px'
          }}
        >
          {components.map((component, index) => (
            <li key={component.id || index} style={{ marginBottom: '8px' }}>
              {renderComponent(component)}
            </li>
          ))}
          {components.length === 0 && (
            <li className="empty-placeholder">
              Click to add list items
            </li>
          )}
        </ListTag>
      );
    }

    // Container div par défaut
    return (
      <div
        key={container.id}
        className={`preview-element container div ${baseClass}`}
        onClick={(e) => handleElementClick(container, e)}
        style={containerStyles}
      >
        {components.map(renderComponent)}
        {components.length === 0 && (
          <div className="empty-placeholder">
            Click to add components
          </div>
        )}
      </div>
    );
  };

  // Rendu des sections
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
          return section.desktopColumns || 1;
      }
    };

    const columns = getColumns();
    
    // Récupération de tous les containers
    const containers = [
      ...(section.divs || []).map(div => ({ ...div, type: 'div' })),
      ...(section.lists || []).map(list => ({ ...list, type: 'list' })),
      ...(section.forms || []).map(form => ({ ...form, type: 'form' })),
      ...(section.containers || [])
    ];

    const sectionStyles = {
      backgroundColor: section.backgroundColor || 'transparent',
      backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : 'none',
      color: section.color || 'inherit',
      border: section.borderWidth ? 
        `${section.borderWidth} ${section.borderStyle || 'solid'} ${section.borderColor || '#000'}` : 
        'none',
      borderRadius: section.borderRadius || '0',
      boxShadow: section.boxShadow || 'none',
      opacity: section.opacity || 1,
      
      // Layout Grid pour responsive
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: section.gap || '16px',
      
      // Spacing
      margin: section.margin || '0',
      padding: section.padding || '24px',
      
      // Dimensions
      width: section.width || '100%',
      minHeight: section.minHeight || 'auto',
      
      cursor: 'pointer'
    };
    
    return (
      <section
        key={section.id}
        className={`preview-element section ${baseClass}`}
        onClick={(e) => handleElementClick(section, e)}
        style={sectionStyles}
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

  // Rendu des pages
  const renderPage = (page) => {
    if (!page) return null;

    const sections = page.layout?.sections || page.sections || [];
    const isPageSelected = isSelected(page);

    const pageStyles = {
      minHeight: '100vh',
      backgroundColor: page.backgroundColor || 'white',
      color: page.color || 'inherit',
      fontFamily: page.fontFamily || 'inherit',
      cursor: 'pointer'
    };

    return (
      <div
        key={page.id}
        className={`preview-element page ${isPageSelected ? 'selected' : ''}`}
        onClick={(e) => handleElementClick(page, e)}
        style={pageStyles}
      >
        {sections.map(renderSection)}
        {sections.length === 0 && (
          <div className="empty-placeholder" style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#666'
          }}>
            <h3>Empty Page</h3>
            <p>Click to add sections</p>
          </div>
        )}
      </div>
    );
  };

  // États vides
  if (!project) {
    return (
      <div className="preview-content">
        <div className={`preview-viewport device-${device}`}>
          <div className="empty-state">
            <h2>No Project</h2>
            <p>Select a project to see the preview</p>
          </div>
        </div>
      </div>
    );
  }

  const pages = project.pages || [];
  if (pages.length === 0) {
    return (
      <div className="preview-content">
        <div className={`preview-viewport device-${device}`}>
          <div className="empty-state">
            <h2>Empty Project</h2>
            <p>Add pages to see content</p>
          </div>
        </div>
      </div>
    );
  }

  // Rendre la première page (ou celle sélectionnée)
  const currentPage = pages[0]; // TODO: Gérer la sélection de page

  return (
    <div className="preview-content">
      <div className={`preview-viewport device-${device}`}>
        <div className="preview-website">
          {renderPage(currentPage)}
        </div>
      </div>
    </div>
  );
}

export default CanvasFrame;