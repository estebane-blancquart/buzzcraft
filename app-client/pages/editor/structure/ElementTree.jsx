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
  const [expandedItems, setExpandedItems] = React.useState(() => {
    if (!project) return new Set();
    
    const initialExpanded = new Set();
    // Le projet n'est PAS pliable - toujours ouvert
    initialExpanded.add(project.id);
    
    // Ouvrir toutes les pages par défaut
    project.pages?.forEach(page => {
      initialExpanded.add(page.id);
    });
    
    return initialExpanded;
  });

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedElement && selectedElement.type !== 'project') {
          onDeleteElement(selectedElement.id);
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

  const toggleExpand = (event, itemId) => {
    event.stopPropagation();
    // Ne pas permettre de fermer le projet
    if (itemId === project.id) return;
    
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

  // Fonction pour auto-expand un élément parent
  const autoExpand = (parentId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(parentId);
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
      indents.push(
        <div 
          key={i} 
          className={`tree-indent ${isLast ? 'has-line' : 'has-line continues'}`}
        />
      );
    }
    return indents;
  };

  // Fonction pour obtenir les sections d'une page selon la structure réelle
  const getPageSections = (page) => {
    return page.layout?.sections || page.sections || [];
  };

  // Fonction pour obtenir les containers d'une section
  const getSectionContainers = (section) => {
    const containers = [];
    
    // Ajouter tous les types de containers avec leur type
    if (section.divs) {
      containers.push(...section.divs.map(div => ({ ...div, type: 'div' })));
    }
    if (section.lists) {
      containers.push(...section.lists.map(list => ({ ...list, type: 'list' })));
    }
    if (section.forms) {
      containers.push(...section.forms.map(form => ({ ...form, type: 'form' })));
    }
    if (section.containers) {
      containers.push(...section.containers);
    }
    
    return containers;
  };

  // Fonction pour obtenir les composants d'un container
  const getContainerComponents = (container) => {
    return container.components || [];
  };

  return (
    <div className="tree-content">
      {/* Projet racine - PAS de ligne de connexion, PAS pliable */}
      <div 
        className={`tree-item ${isSelected({ id: project.id, type: 'project' }) ? 'selected' : ''}`}
        onClick={() => handleElementClick({ id: project.id, type: 'project', name: project.name })}
      >
        <div className="tree-item-content">
          {/* Pas d'icône expand pour le projet */}
          <span className="tree-label">{project.name}</span>
        </div>
        <span className="tree-type">project</span>
        <button 
          className="tree-add-btn"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Adding page to project:', project.id);
            onAddPage();
          }}
        >
          +
        </button>
      </div>

      {/* Pages - PAS d'indentation car directement sous projet */}
      {project.pages?.map(page => {
        const sections = getPageSections(page);
        const hasChildren = sections.length > 0;
        
        return (
          <React.Fragment key={page.id}>
            <div 
              className={`tree-item ${isSelected(page) ? 'selected' : ''}`}
              onClick={() => handleElementClick(page)}
            >
              <div className="tree-item-content">
                {/* PAS de renderIndents(1) pour enlever la ligne */}
                {hasChildren && (
                  <span 
                    className={`tree-expand ${isExpanded(page.id) ? 'expanded' : 'collapsed'}`}
                    onClick={(e) => toggleExpand(e, page.id)}
                  />
                )}
                {!hasChildren && <div style={{width: '16px'}} />}
                <span className="tree-label">{page.name}</span>
              </div>
              <span className="tree-type">page</span>
              <button 
                className="tree-add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Adding section to page:', page.id);
                  // Auto-expand la page quand on ajoute une section
                  autoExpand(page.id);
                  onAddSection(page.id);
                }}
              >
                +
              </button>
            </div>

            {/* Sections de cette page */}
            {sections.map(section => {
              const containers = getSectionContainers(section);
              const hasChildren = containers.length > 0;
              
              return (
                <React.Fragment key={section.id}>
                  <div 
                    className={`tree-item ${isSelected(section) ? 'selected' : ''} ${!isExpanded(page.id) ? 'hidden' : ''}`}
                    onClick={() => handleElementClick(section)}
                  >
                    <div className="tree-item-content">
                      {renderIndents(1)}
                      {hasChildren && (
                        <span 
                          className={`tree-expand ${isExpanded(section.id) ? 'expanded' : 'collapsed'}`}
                          onClick={(e) => toggleExpand(e, section.id)}
                        />
                      )}
                      {!hasChildren && <div style={{width: '16px'}} />}
                      <span className="tree-label">{section.name || `Section ${section.id}`}</span>
                    </div>
                    <span className="tree-type">section</span>
                    <button 
                      className="tree-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Adding container to section:', section.id);
                        // Sélectionner la section ET auto-expand
                        handleElementClick(section);
                        autoExpand(section.id);
                        // Utiliser une version modifiée qui prend sectionId
                        onAddDiv(section.id);
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Containers de cette section */}
                  {containers.map(container => {
                    const components = getContainerComponents(container);
                    const hasChildren = components.length > 0;
                    const containerType = container.type || 'div';
                    
                    return (
                      <React.Fragment key={container.id}>
                        <div 
                          className={`tree-item ${isSelected(container) ? 'selected' : ''} ${(!isExpanded(page.id) || !isExpanded(section.id)) ? 'hidden' : ''}`}
                          onClick={() => handleElementClick(container)}
                        >
                          <div className="tree-item-content">
                            {renderIndents(2)}
                            {hasChildren && (
                              <span 
                                className={`tree-expand ${isExpanded(container.id) ? 'expanded' : 'collapsed'}`}
                                onClick={(e) => toggleExpand(e, container.id)}
                              />
                            )}
                            {!hasChildren && <div style={{width: '16px'}} />}
                            <span className="tree-label">{container.name || `${containerType} ${container.id}`}</span>
                          </div>
                          <span className="tree-type">{containerType}</span>
                          <button 
                            className="tree-add-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Adding component to container:', container.id);
                              // Sélectionner le container ET auto-expand
                              handleElementClick(container);
                              autoExpand(container.id);
                              onAddComponent(container.id);
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Composants de ce container */}
                        {components.map(component => (
                          <div 
                            key={component.id}
                            className={`tree-item ${isSelected(component) ? 'selected' : ''} ${(!isExpanded(page.id) || !isExpanded(section.id) || !isExpanded(container.id)) ? 'hidden' : ''}`}
                            onClick={() => handleElementClick(component)}
                          >
                            <div className="tree-item-content">
                              {renderIndents(3)}
                              <span className="tree-label">{component.name || component.content || `${component.type} ${component.id}`}</span>
                            </div>
                            <span className="tree-type">{component.type}</span>
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}

    </div>
  );
}

export default ElementTree;