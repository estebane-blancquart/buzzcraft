import React from "react";
import { DEVICES } from "@config/constants.js";

/*
 * FAIT QUOI : Rendu visuel complet depuis project.json
 * REÇOIT : project, device, selectedElement, onElementSelect
 * RETOURNE : Preview avec TOUTES les propriétés appliquées
 * NOUVEAU : Support complet des props styling
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

  // Rendu des composants avec TOUTES les propriétés
  const renderComponent = (component) => {
    const isComponentSelected = isSelected(component);
    const baseClass = isComponentSelected ? 'selected' : '';

    return (
      <div
        key={component.id}
        className={`preview-element component ${baseClass}`}
        onClick={(e) => handleElementClick(component, e)}
        style={{ cursor: "pointer" }}
      >
        {component.type === "heading" &&
          React.createElement(
            component.tag || 'h2',
            {
              className: component.classname || "",
              style: {
                fontSize: component.fontSize || "2rem",
                fontWeight: component.fontWeight || "600",
                color: component.textColor || "#1a1a1a",
                textAlign: component.textAlign || "left",
                lineHeight: component.lineHeight || "1.2",
                letterSpacing: component.letterSpacing || "normal",
                backgroundColor: component.backgroundColor || "transparent",
                border: component.border || "none",
                borderRadius: component.borderRadius || "0",
                boxShadow: component.boxShadow || "none",
                margin: component.margin || "0",
                padding: component.padding || "0",
                width: component.width || "auto",
                height: component.height || "auto",
                position: component.position || "static",
                zIndex: component.zIndex || "auto",
                opacity: component.opacity || 1,
              },
            },
            component.content || "New Heading"
          )}

        {component.type === "paragraph" && (
          <p
            className={component.classname || ""}
            style={{
              fontSize: component.fontSize || "1rem",
              fontWeight: component.fontWeight || "400",
              color: component.textColor || "#333",
              textAlign: component.textAlign || "left",
              lineHeight: component.lineHeight || "1.6",
              letterSpacing: component.letterSpacing || "normal",
              backgroundColor: component.backgroundColor || "transparent",
              border: component.border || "none",
              borderRadius: component.borderRadius || "0",
              boxShadow: component.boxShadow || "none",
              margin: component.margin || "0",
              padding: component.padding || "0",
              width: component.width || "auto",
              height: component.height || "auto",
              position: component.position || "static",
              zIndex: component.zIndex || "auto",
              opacity: component.opacity || 1,
            }}
          >
            {component.content || "New paragraph text..."}
          </p>
        )}

        {component.type === "button" && (
          <button
            type={component.buttonType || "button"}
            disabled={component.disabled || false}
            className={component.classname || ""}
            style={{
              backgroundColor: component.backgroundColor || "#007bff",
              color: component.textColor || "white",
              fontSize: component.fontSize || "1rem",
              fontWeight: component.fontWeight || "500",
              textAlign: component.textAlign || "center",
              border: component.border || "none",
              borderRadius: component.borderRadius || "6px",
              boxShadow: component.boxShadow || "none",
              cursor: "pointer",
              margin: component.margin || "0",
              padding: component.padding || "12px 24px",
              width: component.width || "auto",
              height: component.height || "auto",
              position: component.position || "static",
              zIndex: component.zIndex || "auto",
              opacity: component.opacity || 1,
            }}
          >
            {component.icon && component.iconPosition === "left" && (
              <span style={{ marginRight: "8px" }}>{component.icon}</span>
            )}
            {component.content || "Click me"}
            {component.icon && component.iconPosition === "right" && (
              <span style={{ marginLeft: "8px" }}>{component.icon}</span>
            )}
          </button>
        )}

        {component.type === "image" && (
          <img
            src={component.src || "https://picsum.photos/400/300"}
            alt={component.alt || "Image"}
            className={component.classname || ""}
            style={{
              width: component.width || "auto",
              height: component.height || "auto",
              maxWidth: "100%",
              backgroundColor: component.backgroundColor || "transparent",
              border: component.border || "none",
              borderRadius: component.borderRadius || "0",
              boxShadow: component.boxShadow || "none",
              objectFit: component.objectFit || "cover",
              opacity: component.opacity || 1,
              margin: component.margin || "0",
              padding: component.padding || "0",
              position: component.position || "static",
              zIndex: component.zIndex || "auto",
            }}
          />
        )}

        {component.type === "link" && (
          <a
            href={component.href || "#"}
            target={component.target || "_self"}
            className={component.classname || ""}
            style={{
              backgroundColor: component.backgroundColor || "transparent",
              color: component.textColor || "#007bff",
              fontSize: component.fontSize || "1rem",
              fontWeight: component.fontWeight || "400",
              textAlign: component.textAlign || "left",
              textDecoration: component.textDecoration || "underline",
              border: component.border || "none",
              borderRadius: component.borderRadius || "0",
              boxShadow: component.boxShadow || "none",
              margin: component.margin || "0",
              padding: component.padding || "0",
              width: component.width || "auto",
              height: component.height || "auto",
              position: component.position || "static",
              zIndex: component.zIndex || "auto",
              opacity: component.opacity || 1,
            }}
          >
            {component.content || "Link"}
          </a>
        )}

        {component.type === "video" && (
          <video
            src={component.src || ""}
            poster={component.poster || ""}
            controls={component.controls || true}
            autoPlay={component.autoplay || false}
            loop={component.loop || false}
            muted={component.muted || false}
            className={component.classname || ""}
            style={{
              width: component.width || "100%",
              height: component.height || "auto",
              backgroundColor: component.backgroundColor || "transparent",
              border: component.border || "none",
              borderRadius: component.borderRadius || "0",
              boxShadow: component.boxShadow || "none",
              margin: component.margin || "0",
              padding: component.padding || "0",
              position: component.position || "static",
              zIndex: component.zIndex || "auto",
              opacity: component.opacity || 1,
            }}
          />
        )}

        {component.type === "input" && (
          <input
            type={component.inputType || "text"}
            placeholder={component.placeholder || "Enter text..."}
            value={component.value || ""}
            required={component.required || false}
            disabled={component.disabled || false}
            className={component.classname || ""}
            style={{
              width: component.width || "100%",
              backgroundColor: component.backgroundColor || "white",
              color: component.textColor || "#333",
              fontSize: component.fontSize || "1rem",
              padding: component.padding || "12px",
              border: component.border || "1px solid #ddd",
              borderRadius: component.borderRadius || "4px",
              boxShadow: component.boxShadow || "none",
              margin: component.margin || "0",
              position: component.position || "static",
              zIndex: component.zIndex || "auto",
              opacity: component.opacity || 1,
            }}
            readOnly
          />
        )}
      </div>
    );
  };

  // Rendu des containers
  const renderContainer = (container) => {
    const isContainerSelected = isSelected(container);
    const baseClass = isContainerSelected ? 'selected' : '';
    
    // Récupération des composants
    const components = container.components || [];
    
    // Container spécial pour forms
    if (container.type === 'form') {
      return (
        <form
          key={container.id}
          className={`preview-element container form ${baseClass}`}
          action={container.action || "#"}
          method={container.method || "POST"}
          onClick={(e) => handleElementClick(container, e)}
          style={{
            backgroundColor: container.backgroundColor || 'transparent',
            border: container.border || 'none',
            borderRadius: container.borderRadius || '0',
            boxShadow: container.boxShadow || 'none',
            margin: container.margin || '0',
            padding: container.padding || '12px',
            width: container.width || "auto",
            height: container.height || "auto",
            cursor: 'pointer'
          }}
        >
          {components.map(renderComponent)}
          {components.length === 0 && (
            <div className="empty-placeholder">
              Click to add form elements
            </div>
          )}
        </form>
      );
    }
    
    // Container spécial pour lists
    if (container.type === 'list') {
      const ListTag = container.listType === 'ol' ? 'ol' : 'ul';
      return (
        <ListTag
          key={container.id}
          className={`preview-element container list ${baseClass}`}
          onClick={(e) => handleElementClick(container, e)}
          style={{
            backgroundColor: container.backgroundColor || 'transparent',
            border: container.border || 'none',
            borderRadius: container.borderRadius || '0',
            margin: container.margin || '0',
            padding: container.padding || '0 0 0 20px',
            listStyle: container.listType === 'ol' ? 'decimal' : 'disc',
            cursor: 'pointer'
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
        style={{
          backgroundColor: container.backgroundColor || 'transparent',
          border: container.border || 'none',
          borderRadius: container.borderRadius || '0',
          boxShadow: container.boxShadow || 'none',
          margin: container.margin || '0',
          padding: container.padding || '12px',
          width: container.width || "auto",
          height: container.height || "auto",
          display: container.display || 'block',
          flexDirection: container.flexDirection || 'column',
          justifyContent: container.justifyContent || 'flex-start',
          alignItems: container.alignItems || 'flex-start',
          gap: container.gap || '0',
          position: container.position || "static",
          zIndex: container.zIndex || "auto",
          opacity: container.opacity || 1,
          overflow: container.overflow || 'visible',
          cursor: 'pointer'
        }}
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

    return (
      <section
        key={section.id}
        className={`preview-element section ${baseClass}`}
        onClick={(e) => handleElementClick(section, e)}
        style={{
          backgroundColor: section.backgroundColor || 'transparent',
          backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : 'none',
          border: section.border || 'none',
          borderRadius: section.borderRadius || '0',
          boxShadow: section.boxShadow || 'none',
          margin: section.margin || '0',
          padding: section.padding || '20px',
          minHeight: section.minHeight || '100px',
          width: section.width || "100%",
          height: section.height || "auto",
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: section.gap || '16px',
          position: section.position || "static",
          zIndex: section.zIndex || "auto",
          opacity: section.opacity || 1,
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

  // Rendu des pages
  const renderPage = (page) => {
    if (!page) return null;

    const sections = page.layout?.sections || page.sections || [];
    const isPageSelected = isSelected(page);

    return (
      <div
        key={page.id}
        className={`preview-element page ${isPageSelected ? 'selected' : ''}`}
        onClick={(e) => handleElementClick(page, e)}
        style={{
          backgroundColor: page.backgroundColor || 'white',
          minHeight: '100vh',
          width: '100%',
          cursor: 'pointer'
        }}
      >
        {sections.map(renderSection)}
        {sections.length === 0 && (
          <div className="empty-placeholder">
            Click to add sections
          </div>
        )}
      </div>
    );
  };

  // Rendu principal
  if (!project) {
    return (
      <div className="preview-content">
        <div className="preview-viewport device-desktop">
          <div className="empty-placeholder">No project loaded</div>
        </div>
      </div>
    );
  }

  const pages = project.pages || [];
  const currentPage = pages[0]; // Première page par défaut

  return (
    <div className="preview-content">
      <div className={`preview-viewport device-${device}`}>
        {currentPage ? renderPage(currentPage) : (
          <div className="empty-placeholder">No pages found</div>
        )}
      </div>
    </div>
  );
}

export default CanvasFrame;