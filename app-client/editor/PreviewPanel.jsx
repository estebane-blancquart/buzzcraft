import React from 'react';

/*
 * FAIT QUOI : Preview temps réel du projet (panel centre)
 * REÇOIT : project: object, device: string, selectedElement: object, onElementSelect: function
 * RETOURNE : JSX preview responsive sans génération
 */

export default function PreviewPanel({ project, device, selectedElement, onElementSelect }) {
  
  // Mock components pour le preview
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

      case 'button':
        return (
          <button key={path} className={className} onClick={handleClick}>
            {component.content || 'Button'}
          </button>
        );

      case 'image':
        return (
          <img 
            key={path}
            src={component.src || 'https://picsum.photos/400/300'}
            alt={component.alt || 'Image'}
            className={className}
            onClick={handleClick}
          />
        );

      case 'link':
        return (
          <a key={path} href="#" className={className} onClick={handleClick}>
            {component.content || 'Link'}
          </a>
        );

      default:
        return (
          <div key={path} className={className} onClick={handleClick}>
            [{component.type}] {component.content || component.id}
          </div>
        );
    }
  };

  const renderContainer = (container, path) => {
    if (!container) return null;

    const isSelected = selectedElement?.path === path;
    const className = `preview-container ${container.type || 'div'} ${isSelected ? 'selected' : ''}`;

    const handleClick = (e) => {
      e.stopPropagation();
      onElementSelect(container, path);
    };

    switch (container.type) {
      case 'div':
        return (
          <div key={path} className={className} onClick={handleClick}>
            <div className="container-label">{container.name || container.id}</div>
            {container.components?.map((component, index) => 
              renderComponent(component, `${path}.components[${index}]`)
            )}
          </div>
        );

      case 'list':
        const ListTag = container.tag || 'ul';
        return React.createElement(ListTag, {
          key: path,
          className,
          onClick: handleClick
        }, [
          <div key="label" className="container-label">{container.name || container.id}</div>,
          ...(container.items?.map((item, index) => (
            <li key={index}>{item.content || `Item ${index + 1}`}</li>
          )) || [])
        ]);

      case 'form':
        return (
          <form key={path} className={className} onClick={handleClick}>
            <div className="container-label">{container.name || container.id}</div>
            {container.inputs?.map((input, index) => (
              <div key={index} className="form-field">
                <label>{input.label || input.name}</label>
                <input type={input.type || 'text'} placeholder={input.placeholder} />
              </div>
            ))}
            {container.buttons?.map((button, index) => (
              <button key={index} type={button.type || 'button'}>
                {button.content || 'Button'}
              </button>
            ))}
          </form>
        );

      default:
        return (
          <div key={path} className={className} onClick={handleClick}>
            <div className="container-label">[{container.type}] {container.name || container.id}</div>
          </div>
        );
    }
  };

  const renderSection = (section, path) => {
    if (!section) return null;

    const isSelected = selectedElement?.path === path;
    const className = `preview-section ${isSelected ? 'selected' : ''}`;

    return (
      <section 
        key={path} 
        className={className}
        onClick={(e) => { e.stopPropagation(); onElementSelect(section, path); }}
      >
        <div className="section-label">{section.id}</div>
        
        {/* Divs */}
        {section.divs?.map((div, index) => 
          renderContainer(div, `${path}.divs[${index}]`)
        )}
        
        {/* Lists */}
        {section.lists?.map((list, index) => 
          renderContainer(list, `${path}.lists[${index}]`)
        )}
        
        {/* Forms */}
        {section.forms?.map((form, index) => 
          renderContainer(form, `${path}.forms[${index}]`)
        )}
      </section>
    );
  };

  const renderPage = (page, path) => {
    if (!page || !page.layout) return null;

    return (
      <div key={path} className="preview-page">
        <div className="page-label">{page.name}</div>
        {page.layout.sections?.map((section, index) => 
          renderSection(section, `${path}.layout.sections[${index}]`)
        )}
      </div>
    );
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
      <div className="preview-panel">
        <div className="loading">Chargement preview...</div>
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>Preview</h3>
        <span className="device-indicator">{device.toUpperCase()}</span>
      </div>
      
      <div className="preview-content">
        <div className={`preview-viewport ${getDeviceClass()}`}>
          {project.pages?.map((page, index) => 
            renderPage(page, `project.pages[${index}]`)
          )}
          
          {(!project.pages || project.pages.length === 0) && (
            <div className="preview-empty">
              <p>Aucune page à afficher</p>
              <p>Utilisez l'arbre pour ajouter du contenu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}