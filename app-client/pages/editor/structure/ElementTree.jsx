import React from 'react';

/*
 * FAIT QUOI : Arbre hiérarchique pour naviguer dans la structure projet
 * REÇOIT : project, selectedElement, onElementSelect, onAddPage, onAddSection, onAddDiv, onAddComponent, onDeleteElement
 * RETOURNE : Structure tree navigable
 * ERREURS : Défensif avec projet vide
 */

function ElementTree({ 
  project = null, 
  selectedElement = null, 
  onElementSelect = () => {},
  onAddPage = () => {},
  onAddSection = () => {},
  onAddDiv = () => {},
  onAddComponent = () => {},
  onDeleteElement = () => {}
}) {
  if (!project) {
    return (
      <div className="tree-content">
        <div className="tree-empty">No project loaded</div>
      </div>
    );
  }

  const handleElementClick = (element) => {
    if (onElementSelect) {
      onElementSelect(element);
    }
  };

  const handleAddClick = (type, parentId = null) => {
    switch (type) {
      case 'page':
        onAddPage();
        break;
      case 'section':
        onAddSection(parentId);
        break;
      case 'div':
        onAddDiv();
        break;
      case 'component':
        onAddComponent();
        break;
      default:
        break;
    }
  };

  const handleDeleteClick = (elementId, event) => {
    event.stopPropagation();
    if (onDeleteElement) {
      onDeleteElement(elementId);
    }
  };

  const isSelected = (element) => {
    return selectedElement && selectedElement.id === element?.id;
  };

  return (
    <div className="tree-content">
      {/* Projet racine */}
      <div className="tree-item">
        <div 
          className={`tree-node ${isSelected({ id: project.id, type: 'project' }) ? 'selected' : ''}`}
          onClick={() => handleElementClick({ id: project.id, type: 'project', name: project.name })}
        >
          <div className="tree-node-content">
            <span className="tree-icon">📁</span>
            <span className="tree-label">{project.name}</span>
            <span className="tree-type">PROJECT</span>
          </div>
          <div className="tree-actions">
            <button 
              className="tree-action-btn add"
              onClick={(e) => {
                e.stopPropagation();
                handleAddClick('page');
              }}
              title="Add page"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Pages */}
      {project.pages?.map(page => (
        <div key={page.id} className="tree-item nested">
          <div 
            className={`tree-node ${isSelected(page) ? 'selected' : ''}`}
            onClick={() => handleElementClick(page)}
          >
            <div className="tree-node-content">
              <span className="tree-icon">📄</span>
              <span className="tree-label">{page.name}</span>
              <span className="tree-type">PAGE</span>
            </div>
            <div className="tree-actions">
              <button 
                className="tree-action-btn add"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddClick('section', page.id);
                }}
                title="Add section"
              >
                +
              </button>
              <button 
                className="tree-action-btn remove"
                onClick={(e) => handleDeleteClick(page.id, e)}
                title="Delete page"
              >
                ×
              </button>
            </div>
          </div>

          {/* Sections de la page */}
          {page.layout?.sections?.map(section => (
            <div key={section.id} className="tree-item nested">
              <div 
                className={`tree-node ${isSelected(section) ? 'selected' : ''}`}
                onClick={() => handleElementClick(section)}
              >
                <div className="tree-node-content">
                  <span className="tree-icon">📦</span>
                  <span className="tree-label">{section.name || section.id}</span>
                  <span className="tree-type">SECTION</span>
                </div>
                <div className="tree-actions">
                  <button 
                    className="tree-action-btn add"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddClick('div');
                    }}
                    title="Add container"
                  >
                    +
                  </button>
                  <button 
                    className="tree-action-btn remove"
                    onClick={(e) => handleDeleteClick(section.id, e)}
                    title="Delete section"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      
      {/* Bouton add component global */}
      {(!project.pages || project.pages.length === 0) && (
        <div className="tree-add-first">
          <button 
            className="tree-action-btn add"
            onClick={() => handleAddClick('component')}
          >
            + Add Component
          </button>
        </div>
      )}
    </div>
  );
}

export default ElementTree;