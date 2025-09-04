import React from 'react';
import { DEVICES } from '@config/constants.js';

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
    if (!component || !component.type) return null;

    const isComponentSelected = isSelected(component);
    const baseClass = `preview-element ${isComponentSelected ? 'selected' : ''}`;
    
    const clickHandler = (e) => handleElementClick(component, e);

    switch (component.type) {
      case 'heading':
        const HeadingTag = component.tag || 'h2';
        return (
          <HeadingTag
            key={component.id}
            className={baseClass}
            onClick={clickHandler}
            style={{
              fontSize: component.fontSize || component.properties?.fontSize || '2rem',
              fontWeight: component.fontWeight || component.properties?.fontWeight || '600',
              color: component.textColor || component.properties?.textColor || '#1a1a1a',
              textAlign: component.textAlign || component.properties?.textAlign || 'left',
              lineHeight: component.lineHeight || component.properties?.lineHeight || '1.2',
              margin: component.margin || component.properties?.margin || '0 0 1rem 0',
              cursor: 'pointer'
            }}
          >
            {component.content || component.text || 'Titre'}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p 
            key={component.id}
            className={baseClass}
            onClick={clickHandler}
            style={{
              fontSize: component.fontSize || component.properties?.fontSize || '1rem',
              fontWeight: component.fontWeight || component.properties?.fontWeight || '400',
              color: component.textColor || component.properties?.textColor || '#333',
              textAlign: component.textAlign || component.properties?.textAlign || 'left',
              lineHeight: component.lineHeight || component.properties?.lineHeight || '1.6',
              margin: component.margin || component.properties?.margin || '0 0 1rem 0',
              cursor: 'pointer'
            }}
          >
            {component.content || component.text || 'Paragraphe'}
          </p>
        );

      case 'button':
        return (
          <button
            key={component.id}
            className={baseClass}
            onClick={clickHandler}
            style={{
              padding: component.padding || component.properties?.padding || '12px 24px',
              fontSize: component.fontSize || component.properties?.fontSize || '1rem',
              fontWeight: component.fontWeight || component.properties?.fontWeight || '500',
              color: component.textColor || component.properties?.textColor || '#fff',
              backgroundColor: component.backgroundColor || component.properties?.backgroundColor || '#007bff',
              border: component.border || component.properties?.border || 'none',
              borderRadius: component.borderRadius || component.properties?.borderRadius || '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {component.content || component.text || 'Bouton'}
          </button>
        );

      case 'image':
        return (
          <img
            key={component.id}
            className={baseClass}
            onClick={clickHandler}
            src={component.src || component.properties?.src || '/placeholder.jpg'}
            alt={component.alt || component.properties?.alt || 'Image'}
            style={{
              width: component.width || component.properties?.width || 'auto',
              height: component.height || component.properties?.height || 'auto',
              maxWidth: '100%',
              borderRadius: component.borderRadius || component.properties?.borderRadius || '0',
              cursor: 'pointer'
            }}
          />
        );

      case 'link':
        return (
          <a
            key={component.id}
            className={baseClass}
            onClick={clickHandler}
            href={component.href || component.properties?.href || '#'}
            style={{
              color: component.textColor || component.properties?.textColor || '#007bff',
              textDecoration: component.textDecoration || component.properties?.textDecoration || 'underline',
              cursor: 'pointer'
            }}
          >
            {component.content || component.text || 'Lien'}
          </a>
        );

      case 'input':
        return (
          <input
            key={component.id}
            className={baseClass}
            onClick={clickHandler}
            type={component.inputType || component.properties?.inputType || 'text'}
            placeholder={component.placeholder || component.properties?.placeholder || ''}
            style={{
              padding: component.padding || component.properties?.padding || '12px',
              fontSize: component.fontSize || component.properties?.fontSize || '1rem',
              border: component.border || component.properties?.border || '1px solid #ddd',
              borderRadius: component.borderRadius || component.properties?.borderRadius || '4px',
              width: component.width || component.properties?.width || '100%',
              cursor: 'pointer'
            }}
          />
        );

      default:
        return (
          <div
            key={component.id}
            className={baseClass}
            onClick={clickHandler}
            style={{ cursor: 'pointer', padding: '8px', border: '1px dashed #ccc' }}
          >
            {component.type} ({component.id})
          </div>
        );
    }
  };

  const renderContainer = (container) => {
    if (!container) return null;

    const components = container.components || [];
    const isContainerSelected = isSelected(container);
    
    return (
      <div
        key={container.id}
        className={`preview-element container ${isContainerSelected ? 'selected' : ''}`}
        onClick={(e) => handleElementClick(container, e)}
        style={{
          padding: container.padding || container.properties?.padding || '16px',
          margin: container.margin || container.properties?.margin || '0',
          backgroundColor: container.backgroundColor || container.properties?.backgroundColor || 'transparent',
          borderRadius: container.borderRadius || container.properties?.borderRadius || '0',
          cursor: 'pointer'
        }}
      >
        {components.map(renderComponent)}
      </div>
    );
  };

  const renderSection = (section) => {
    if (!section) return null;

    // Collecter tous les containers de la section
    const containers = [];
    
    if (section.divs) containers.push(...section.divs.map(div => ({ ...div, type: 'div' })));
    if (section.lists) containers.push(...section.lists.map(list => ({ ...list, type: 'list' })));
    if (section.forms) containers.push(...section.forms.map(form => ({ ...form, type: 'form' })));
    if (section.containers) containers.push(...section.containers);

    const isSectionSelected = isSelected(section);

    return (
      <section
        key={section.id}
        className={`preview-element section ${isSectionSelected ? 'selected' : ''}`}
        onClick={(e) => handleElementClick(section, e)}
        style={{
          padding: section.padding || section.properties?.padding || '24px',
          margin: section.margin || section.properties?.margin || '0',
          backgroundColor: section.backgroundColor || section.properties?.backgroundColor || 'transparent',
          cursor: 'pointer'
        }}
      >
        {containers.map(renderContainer)}
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
        className={`preview-element page ${isPageSelected ? 'selected' : ''}`}
        onClick={(e) => handleElementClick(page, e)}
        style={{ cursor: 'pointer' }}
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
        <div className="preview-website">
          {renderPage(currentPage)}
        </div>
      </div>
    </div>
  );
}

export default CanvasFrame;