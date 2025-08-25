import React from 'react';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Zone de rendu responsive du projet selon device
 * REÇOIT : project, device, selectedElement, onElementSelect
 * RETOURNE : Viewport responsive avec rendu projet
 * ERREURS : Défensif avec projet vide
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
    
    return (
      <div
        key={component.id}
        className={`preview-component ${isComponentSelected ? 'selected' : ''}`}
        onClick={(e) => handleElementClick(component, e)}
      >
        {/* Rendu basique selon le type */}
        {component.type === 'heading' && (
          React.createElement(component.tag || 'h2', {
            className: component.classname
          }, component.content)
        )}
        
        {component.type === 'paragraph' && (
          <p className={component.classname}>{component.content}</p>
        )}
        
        {component.type === 'button' && (
          <button className={component.classname}>
            {component.content}
          </button>
        )}
        
        {component.type === 'image' && (
          <img 
            src={component.src} 
            alt={component.alt}
            className={component.classname}
          />
        )}
        
        {component.type === 'video' && (
          <video 
            src={component.src}
            controls={component.controls}
            className={component.classname}
          />
        )}
        
        {component.type === 'link' && (
          <a 
            href={component.href}
            target={component.target}
            className={component.classname}
          >
            {component.content}
          </a>
        )}
        
        {/* Type inconnu */}
        {!['heading', 'paragraph', 'button', 'image', 'video', 'link'].includes(component.type) && (
          <div className="unknown-component">
            {component.type}: {component.content || component.id}
          </div>
        )}
      </div>
    );
  };

  const renderDiv = (div) => {
    const isDivSelected = isSelected(div);
    
    return (
      <div
        key={div.id}
        className={`preview-div ${isDivSelected ? 'selected' : ''} ${div.classname || ''}`}
        onClick={(e) => handleElementClick(div, e)}
      >
        <h4>{div.name || div.id}</h4>
        {div.components?.map(renderComponent)}
        {(!div.components || div.components.length === 0) && (
          <div className="empty-div">Empty container</div>
        )}
      </div>
    );
  };

  const renderSection = (section) => {
    const isSectionSelected = isSelected(section);
    
    return (
      <div
        key={section.id}
        className={`preview-section ${isSectionSelected ? 'selected' : ''}`}
        onClick={(e) => handleElementClick(section, e)}
      >
        <h3>{section.name || section.id}</h3>
        {section.divs?.map(renderDiv)}
        {(!section.divs || section.divs.length === 0) && (
          <div className="empty-section">Empty section</div>
        )}
      </div>
    );
  };

  if (!project) {
    return (
      <div className="preview-content">
        <div className="empty-project">
          No project loaded
        </div>
      </div>
    );
  }

  return (
    <div className="preview-content">
      <div className={`preview-viewport device-${device}`}>
        <div className="preview-page">
          <h1>{project.name}</h1>
          
          {project.pages?.map(page => (
            <div key={page.id} className="preview-page-content">
              <h2>{page.name}</h2>
              {page.layout?.sections?.map(renderSection)}
            </div>
          ))}
          
          {(!project.pages || project.pages.length === 0) && (
            <div className="empty-page">
              No pages defined
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CanvasFrame;