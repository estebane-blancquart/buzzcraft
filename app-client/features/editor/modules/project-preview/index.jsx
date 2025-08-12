import React from 'react';

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
      case 'heading':
        const Tag = component.tag || 'h2';
        return React.createElement(Tag, {
          key: path,
          className,
          onClick: handleClick
        }, component.content || 'Heading');

      case 'paragraph':
        return (
          <p key={path} className={className} onClick={handleClick}>
            {component.content || 'Paragraph text'}
          </p>
        );

      default:
        return (
          <div key={path} className={className} onClick={handleClick}>
            [{component.type}] {component.content || component.id}
          </div>
        );
    }
  };

  const getDeviceClass = () => {
    switch (device) {
      case 'mobile': return 'device-mobile';
      case 'tablet': return 'device-tablet'; 
      case 'desktop': return 'device-desktop';
      default: return 'device-desktop';
    }
  };

  if (!project) {
    return (
      <div className="project-preview">
        <div className="loading">Chargement preview...</div>
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
              <div className="page-label">{page.name}</div>
              
              {page.layout?.sections?.map((section, sectionIndex) => (
                <section key={sectionIndex} className="preview-section">
                  <div className="section-label">{section.id}</div>
                  
                  {section.divs?.map((div, divIndex) => (
                    <div key={divIndex} className="preview-container">
                      <div className="container-label">{div.name || div.id}</div>
                      {div.components?.map((component, compIndex) => 
                        renderComponent(component, `project.pages[${pageIndex}].layout.sections[${sectionIndex}].divs[${divIndex}].components[${compIndex}]`)
                      )}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          ))}
          
          {(!project.pages || project.pages.length === 0) && (
            <div className="preview-empty">
              <p>Aucune page à afficher</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}