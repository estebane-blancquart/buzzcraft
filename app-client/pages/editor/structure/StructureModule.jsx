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
  // CORRECTION : Utiliser les IDs au lieu des noms pour éviter les conflits
  const [expandedItems, setExpandedItems] = React.useState(() => {
    if (!project) return new Set();
    
    const initialExpanded = new Set();
    // Toujours garder le projet ouvert
    initialExpanded.add(project.id);
    
    // Ouvrir toutes les pages par défaut
    project.pages?.forEach(page => {
      initialExpanded.add(page.id);
      // Ouvrir aussi les composants qui ont des enfants
      page.components?.forEach(component => {
        if (component.children && component.children.length > 0) {
          initialExpanded.add(component.id);
        }
      });
    });
    
    return initialExpanded;
  });

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selected = selectedElement;
        if (selected && selected.type !== 'project') {
          onDeleteElement(selected.id);
        }
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, onDeleteElement]);

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

  // CORRECTION : Utiliser l'ID au lieu du nom
  const toggleExpand = (event, itemId) => {
    event.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isSelected = (element) => {
    return selectedElement && selectedElement.id === element?.id;
  };

  const isExpanded = (itemId) => {
    return expandedItems.has(itemId);
  };

  const renderIndents = (level) => {
    const indents = [];
    for (let i = 0; i < level; i++) {
      const isLast = i === level - 1;
      const continues = !isLast;
      indents.push(
        <div 
          key={i} 
          className={`tree-indent ${continues ? 'has-line continues' : 'has-line'}`}
        />
      );
    }
    return indents;
  };

  return (
    <div className="tree-content">
      {/* Projet racine */}
      <div 
        className={`tree-item ${isSelected({ id: project.id, type: 'project' }) ? 'selected' : ''}`}
        onClick={() => handleElementClick({ id: project.id, type: 'project', name: project.name })}
      >
        <div className="tree-item-content">
          <span className="tree-label">{project.name}</span>
        </div>
        <span className="tree-type">project</span>
        <button 
          className="tree-add-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddPage();
          }}
        >
          +
        </button>
      </div>

      {/* Pages */}
      {project.pages?.map(page => (
        <React.Fragment key={page.id}>
          <div 
            className={`tree-item ${isSelected(page) ? 'selected' : ''} ${!isExpanded(project.id) ? 'hidden' : ''}`}
            onClick={() => handleElementClick(page)}
          >
            <div className="tree-item-content">
              {/* CORRECTION : Utiliser page.id au lieu de page.name */}
              <span 
                className={`tree-expand ${isExpanded(page.id) ? 'expanded' : 'collapsed'}`}
                onClick={(e) => toggleExpand(e, page.id)}
              />
              <span className="tree-label">{page.name}</span>
            </div>
            <span className="tree-type">page</span>
            <button 
              className="tree-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddSection(page.id);
              }}
            >
              +
            </button>
          </div>

          {/* Sections dans cette page */}
          {page.sections?.map(section => (
            <div 
              key={section.id}
              className={`tree-item ${isSelected(section) ? 'selected' : ''} ${!isExpanded(page.id) ? 'hidden' : ''}`}
              onClick={() => handleElementClick(section)}
            >
              <div className="tree-item-content">
                {renderIndents(1)}
                <span className="tree-label">{section.name}</span>
              </div>
              <span className="tree-type">section</span>
              <button 
                className="tree-add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddDiv(section.id);
                }}
              >
                +
              </button>
            </div>
          ))}

          {/* Composants dans cette page */}
          {page.components?.map(component => (
            <React.Fragment key={component.id}>
              <div 
                className={`tree-item ${isSelected(component) ? 'selected' : ''} ${!isExpanded(page.id) ? 'hidden' : ''}`}
                onClick={() => handleElementClick(component)}
              >
                <div className="tree-item-content">
                  {renderIndents(1)}
                  {/* CORRECTION : Utiliser component.id et vérifier s'il a des enfants */}
                  {component.children && component.children.length > 0 && (
                    <span 
                      className={`tree-expand ${isExpanded(component.id) ? 'expanded' : 'collapsed'}`}
                      onClick={(e) => toggleExpand(e, component.id)}
                    />
                  )}
                  <span className="tree-label">{component.name}</span>
                </div>
                <span className="tree-type">{component.type}</span>
                <button 
                  className="tree-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddComponent(component.id);
                  }}
                >
                  +
                </button>
              </div>

              {/* Enfants du composant */}
              {component.children?.map(child => (
                <div 
                  key={child.id}
                  className={`tree-item ${isSelected(child) ? 'selected' : ''} ${(!isExpanded(page.id) || !isExpanded(component.id)) ? 'hidden' : ''}`}
                  onClick={() => handleElementClick(child)}
                >
                  <div className="tree-item-content">
                    {renderIndents(2)}
                    <span className="tree-label">{child.name}</span>
                  </div>
                  <span className="tree-type">{child.type}</span>
                  <button 
                    className="tree-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddComponent(child.id);
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      <div className="delete-hint">Suppr pour supprimer</div>
    </div>
  );
}

export default ElementTree;