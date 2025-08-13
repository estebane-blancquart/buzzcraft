import React from 'react';
import { DEVICES, ELEMENT_TYPES, UI_MESSAGES } from '@config/constants.js';

export default function ProjectPreview({ project, device, selectedElement, onElementSelect }) {
  
  const renderComponent = (component, path) => {
    if (!component || !component.type) return null;

    const isSelected = selectedElement?.path === path;
    const className = `preview-component ${component.type} ${isSelected ? 'selected' : ''}`;

    const handleClick = (e) => {
      e.stopPropagation();
      onElementSelect(component, path);
    };

    switch (component.type) {
      case ELEMENT_TYPES.HEADING:
        const Tag = component.tag || 'h2';
        return React.createElement(Tag, {
          key: path,
          className: `${className} ${component.classname || ''}`,
          onClick: handleClick
        }, component.content || 'Heading');

      case ELEMENT_TYPES.PARAGRAPH:
        return (
          <p 
            key={path} 
            className={`${className} ${component.classname || ''}`} 
            onClick={handleClick}
          >
            {component.content || 'Paragraph text'}
          </p>
        );

      case ELEMENT_TYPES.BUTTON:
        return (
          <button 
            key={path} 
            className={`${className} ${component.classname || ''}`} 
            onClick={handleClick}
          >
            {component.content || 'Button'}
          </button>
        );

      case ELEMENT_TYPES.IMAGE:
        return (
          <img 
            key={path} 
            src={component.src || 'https://picsum.photos/400/300'} 
            alt={component.alt || 'Image'} 
            className={`${className} ${component.classname || ''}`} 
            onClick={handleClick}
          />
        );

      default:
        return (
          <div key={path} className={className} onClick={handleClick}>
            [{component.type}] {component.content || component.id}
          </div>
        );
    }
  };

  const renderDiv = (div, path) => {
    const isSelected = selectedElement?.path === path;
    const className = `preview-div ${isSelected ? 'selected' : ''}`;

    const handleClick = (e) => {
      e.stopPropagation();
      onElementSelect({ ...div, type: ELEMENT_TYPES.DIV }, path);
    };

    return (
      <div 
        key={path} 
        className={`${className} ${div.classname || ''}`} 
        onClick={handleClick}
      >
        {div.components?.map((component, compIndex) => 
          renderComponent(component, `${path}.components[${compIndex}]`)
        )}
        {(!div.components || div.components.length === 0) && (
          <div className="empty-div">Cliquez pour ajouter un component</div>
        )}
      </div>
    );
  };

  const renderSection = (section, path, pageIndex, sectionIndex) => {
    const isSelected = selectedElement?.path === path;
    const className = `preview-section ${isSelected ? 'selected' : ''}`;

    const handleClick = (e) => {
      e.stopPropagation();
      onElementSelect({ ...section, type: ELEMENT_TYPES.SECTION }, path);
    };

    // Colonnes selon device
    const getColumns = () => {
      switch (device) {
        case DEVICES.DESKTOP: return section.desktop || 3;
        case DEVICES.TABLET: return section.tablet || 2;
        case DEVICES.MOBILE: return section.mobile || 1;
        default: return 3;
      }
    };

    const columns = getColumns();
    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '16px'
    };

    return (
      <section 
        key={path} 
        className={className} 
        onClick={handleClick}
        style={gridStyle}
      >
        {section.divs?.map((div, divIndex) => 
          renderDiv(div, `${path}.divs[${divIndex}]`)
        )}
        {(!section.divs || section.divs.length === 0) && (
          <div className="empty-section">Cliquez pour ajouter un div</div>
        )}
      </section>
    );
  };

  const getDeviceClass = () => {
    switch (device) {
      case DEVICES.MOBILE: return 'device-mobile';
      case DEVICES.TABLET: return 'device-tablet'; 
      case DEVICES.DESKTOP: return 'device-desktop';
      default: return 'device-desktop';
    }
  };

  if (!project) {
    return (
      <div className="project-preview">
        <div className="preview-header">
          <h3>Preview</h3>
        </div>
        <div className="preview-content">
          <div className="loading">{UI_MESSAGES.LOADING}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-preview">
      <div className="preview-header">
        <h3>Preview</h3>
        <span className="device-indicator">{device.toUpperCase()}</span>
      </div>
      
      <div className="preview-content">
        <div className={`preview-viewport ${getDeviceClass()}`}>
          {project.pages?.map((page, pageIndex) => (
            <div key={pageIndex} className="preview-page">
              {page.layout?.sections?.map((section, sectionIndex) => 
                renderSection(section, `project.pages[${pageIndex}].layout.sections[${sectionIndex}]`, pageIndex, sectionIndex)
              )}
              
              {(!page.layout?.sections || page.layout.sections.length === 0) && (
                <div className="empty-page">Ajoutez une section</div>
              )}
            </div>
          ))}
          
          {(!project.pages || project.pages.length === 0) && (
            <div className="empty-project">Ajoutez une page</div>
          )}
        </div>
      </div>
    </div>
  );
}