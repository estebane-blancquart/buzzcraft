import React from "react";
import { DEVICES } from "@config/constants.js";

/*
 * FAIT QUOI : Rendu depuis project.json structure réelle
 * REÇOIT : project, device, selectedElement, onElementSelect
 * RETOURNE : Preview basée sur project.pages[].sections[].containers[].components[]
 * NOUVEAU : Plus de hardcodé - lecture vraie config
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

  const renderComponent = (component) => {
    const isComponentSelected = isSelected(component);
    const baseClass = isComponentSelected ? "selected" : "";

    return (
      <div
        key={component.id}
        className={`preview-element ${baseClass}`}
        onClick={(e) => handleElementClick(component, e)}
        style={{ cursor: "pointer" }}
      >
        {component.type === "heading" &&
          React.createElement(
            component.tag || component.level || "h2",
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
                // ✅ PLUS DE MARGIN PAR DÉFAUT
                margin: component.margin || "0",
                padding: component.padding || "0",
              },
            },
            component.text || "Heading"
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
              // ✅ PLUS DE MARGIN PAR DÉFAUT
              margin: component.margin || "0",
              padding: component.padding || "0",
            }}
          >
            {component.text ||
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
          </p>
        )}

        {component.type === "button" && (
          <button
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
              // ✅ PLUS DE MARGIN PAR DÉFAUT
              margin: component.margin || "0",
              padding: component.padding || "12px 24px",
            }}
          >
            {component.icon && component.iconPosition === "left" && (
              <span style={{ marginRight: "8px" }}>{component.icon}</span>
            )}
            {component.text || "Button"}
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
              // ✅ PLUS DE MARGIN PAR DÉFAUT
              margin: component.margin || "0",
              padding: component.padding || "0",
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
              // ✅ PLUS DE MARGIN PAR DÉFAUT
              margin: component.margin || "0",
              padding: component.padding || "0",
            }}
          >
            {component.text || "Link"}
          </a>
        )}

        {component.type === "input" && (
          <input
            type={component.inputType || "text"}
            placeholder={component.placeholder || "Enter text..."}
            value={component.value || ""}
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
              // ✅ PLUS DE MARGIN PAR DÉFAUT
              margin: component.margin || "0",
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
        backgroundImage: container.backgroundImage ? `url(${container.backgroundImage})` : 'none',
        textColor: container.textColor || 'inherit',
        border: container.border || 'none',
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
        
        // ✅ PLUS DE MARGES/PADDING PAR DÉFAUT
        margin: container.margin || '0',
        padding: container.padding || '0',
        
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
        
        // Grid Layout pour responsive
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: section.gap || '0',
        
        // ✅ PLUS DE MARGES/PADDING PAR DÉFAUT
        margin: section.margin || '0',
        padding: section.padding || '0',
        
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
  const renderPage = (page) => {
    if (!page) return null;

    const sections = page.layout?.sections || page.sections || [];
    const isPageSelected = isSelected(page);

    return (
      <div
        key={page.id}
        className={`preview-element page ${isPageSelected ? "selected" : ""}`}
        onClick={(e) => handleElementClick(page, e)}
        style={{ cursor: "pointer" }}
      >
        {sections.map(renderSection)}
      </div>
    );
  };

  // Si pas de projet, afficher état vide
  if (!project) {
    return (
      <div className="preview-content">
        <div className={`preview-viewport device-${device}`}>
          <div className="empty-state">
            <h2>Aucun projet</h2>
            <p>Sélectionnez un projet pour voir la prévisualisation</p>
          </div>
        </div>
      </div>
    );
  }

  // Si pas de pages, afficher placeholder
  const pages = project.pages || [];
  if (pages.length === 0) {
    return (
      <div className="preview-content">
        <div className={`preview-viewport device-${device}`}>
          <div className="empty-state">
            <h2>Projet vide</h2>
            <p>Ajoutez des pages pour voir le contenu</p>
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
        <div className="preview-website">{renderPage(currentPage)}</div>
      </div>
    </div>
  );
}

export default CanvasFrame;
