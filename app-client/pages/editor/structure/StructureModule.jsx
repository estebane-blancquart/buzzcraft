import React from 'react';
import './StructureModule.scss';

/*
 * FAIT QUOI : Module structure avec arbre hiérarchique navigable
 * REÇOIT : project, selectedElement, onElementSelect, onAddPage, onAddSection, onAddDiv, onAddComponent, onDeleteElement
 * RETOURNE : Interface complète gestion structure
 * ERREURS : Défensif avec projet vide
 */

// Composant sélecteur de container
function ContainerSelector({ isOpen, onSelect, onClose }) {
  if (!isOpen) return null;

  const containerTypes = [
    { type: 'div', label: 'Division' },
    { type: 'list', label: 'Liste' },
    { type: 'form', label: 'Formulaire' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Choisir un type de container</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <div className="modal-body">
          <div className="selector-grid">
            {containerTypes.map(container => (
              <button
                key={container.type}
                className="selector-item"
                onClick={() => onSelect(container.type)}
              >
                <div className="selector-label">{container.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant sélecteur de composant
function ComponentSelector({ isOpen, onSelect, onClose }) {
  if (!isOpen) return null;

  const componentTypes = [
    { type: 'heading', label: 'Titre' },
    { type: 'paragraph', label: 'Paragraphe' },
    { type: 'button', label: 'Bouton' },
    { type: 'image', label: 'Image' },
    { type: 'video', label: 'Vidéo' },
    { type: 'link', label: 'Lien' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Choisir un type de composant</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <div className="modal-body">
          <div className="selector-grid">
            {componentTypes.map(component => (
              <button
                key={component.type}
                className="selector-item"
                onClick={() => onSelect(component.type)}
              >
                <div className="selector-label">{component.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ElementTree({ 
  project = null, 
  selectedElement = null, 
  onElementSelect = () => {},
  onAddPage = () => {},
  onAddSection = () => {},
  onAddDiv = () => {},
  onAddComponent = () => {},
  onDeleteElement = () => {},
  showComponentSelector = false,
  showContainerSelector = false,
  onComponentSelect = () => {},
  onContainerSelect = () => {},
  onCloseComponentSelector = () => {},
  onCloseContainerSelector = () => {}
}) {
  // FIX: Référence pour le focus
  const treeRef = React.useRef(null);

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

  // FIX: Event listener localisé au conteneur au lieu de document
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

    const treeElement = treeRef.current;
    if (treeElement) {
      treeElement.addEventListener('keydown', handleKeyDown);
      return () => treeElement.removeEventListener('keydown', handleKeyDown);
    }
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
      // Tous les niveaux d'indentation ont une ligne continue sauf le dernier
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

  // Fonction pour obtenir un nom d'affichage propre pour les composants
  const getComponentDisplayName = (component) => {
    if (component.name) return component.name;
    
    switch (component.type) {
      case 'heading':
        return component.content ? component.content.substring(0, 20) + (component.content.length > 20 ? '...' : '') : 'Titre';
      case 'paragraph':
        return component.content ? component.content.substring(0, 30) + (component.content.length > 30 ? '...' : '') : 'Paragraphe';
      case 'button':
        return component.content || 'Bouton';
      case 'image':
        return component.alt || `Image ${component.id.split('-').pop()}`;
      case 'video':
        return `Vidéo ${component.id.split('-').pop()}`;
      case 'link':
        return component.content || `Lien ${component.id.split('-').pop()}`;
      default:
        return `${component.type} ${component.id.split('-').pop()}`;
    }
  };

  return (
    <>
      {/* FIX: Ref + tabIndex pour permettre le focus */}
      <div className="tree-content" ref={treeRef} tabIndex={0}>
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
                          // Passer l'ID de la section à onAddDiv
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
                                <div style={{width: '12px'}} />
                                <span className="tree-label">{getComponentDisplayName(component)}</span>
                              </div>
                              <span className="tree-type">{component.type}</span>
                              <div style={{width: '16px', height: '16px'}} />
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

      {/* Sélecteurs modaux */}
      <ContainerSelector 
        isOpen={showContainerSelector}
        onSelect={onContainerSelect}
        onClose={onCloseContainerSelector}
      />
      
      <ComponentSelector 
        isOpen={showComponentSelector}
        onSelect={onComponentSelect}
        onClose={onCloseComponentSelector}
      />
    </>
  );
}

function StructureModule({
  project,
  selectedElement,
  onElementSelect,
  onAddPage,
  onAddSection,
  onAddDiv,
  onAddComponent,
  onDeleteElement,
  showComponentSelector,
  showContainerSelector,
  onComponentSelect,
  onContainerSelect,
  onCloseComponentSelector,
  onCloseContainerSelector
}) {
  return (
    <div className="project-tree">
      <ElementTree 
        project={project}
        selectedElement={selectedElement}
        onElementSelect={onElementSelect}
        onAddPage={onAddPage}
        onAddSection={onAddSection}
        onAddDiv={onAddDiv}
        onAddComponent={onAddComponent}
        onDeleteElement={onDeleteElement}
        showComponentSelector={showComponentSelector}
        showContainerSelector={showContainerSelector}
        onComponentSelect={onComponentSelect}
        onContainerSelect={onContainerSelect}
        onCloseComponentSelector={onCloseComponentSelector}
        onCloseContainerSelector={onCloseContainerSelector}
      />
    </div>
  );
}

export default StructureModule;