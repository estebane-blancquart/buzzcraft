import React from 'react';

/*
 * FAIT QUOI : Module structure avec arbre hiérarchique + sélecteurs modaux
 * REÇOIT : project, selectedElement, handlers CRUD + modal states
 * RETOURNE : Navigation DOM complète + ComponentSelector + ContainerSelector
 * ERREURS : Défensif avec project null + states vides
 */

// Types disponibles pour les sélecteurs
const componentTypes = [
  { type: 'heading', label: 'Heading' },
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'button', label: 'Button' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'link', label: 'Link' },
  { type: 'input', label: 'Input' }
];

const containerTypes = [
  { type: 'div', label: 'Div' },
  { type: 'form', label: 'Form' },
  { type: 'list', label: 'List' }
];

// Modal sélecteur de containers
function ContainerSelector({ isOpen, onSelect, onClose }) {
  if (!isOpen) return null;

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

// Modal sélecteur de composants
function ComponentSelector({ isOpen, onSelect, onClose }) {
  if (!isOpen) return null;

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

// Arbre des éléments principal
function ElementTree({ 
  project = null, 
  selectedElement = null, 
  onElementSelect = () => {},
  onAddPage = () => {},
  onAddSection = () => {},
  onAddDiv = () => {},
  onDeleteElement = () => {},
  showComponentSelector = false,
  showContainerSelector = false,
  onComponentSelect = () => {},
  onContainerSelect = () => {},
  onCloseComponentSelector = () => {},
  onCloseContainerSelector = () => {}
}) {
  // Référence pour le focus clavier
  const treeRef = React.useRef(null);

  // État des éléments étendus
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

  // Navigation clavier
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selected = selectedElement;
        if (selected && selected.id !== project?.id) {
          const confirmed = window.confirm('Supprimer cet élément ?');
          if (confirmed) {
            onDeleteElement(selected.id);
          }
        }
        event.preventDefault();
      }
    };

    const treeElement = treeRef.current;
    if (treeElement) {
      treeElement.addEventListener('keydown', handleKeyDown);
      return () => treeElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedElement, project, onDeleteElement]);

  // Protection défensive
  if (!project) {
    return <div className="tree-content">Aucun projet chargé</div>;
  }

  // Handlers internes
  const handleElementClick = (element) => {
    console.log('🎯 Tree element clicked:', element);
    onElementSelect(element);
  };

  const isExpanded = (elementId) => {
    return expandedItems.has(elementId);
  };

  const toggleExpand = (event, elementId) => {
    event.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      return newSet;
    });
  };

  const autoExpand = (elementId) => {
    setExpandedItems(prev => new Set([...prev, elementId]));
  };

  const isSelected = (element) => {
    return selectedElement && selectedElement.id === element?.id;
  };

  // Rendu des indentations avec lignes de connexion
  const renderIndents = (level, hasMoreSiblings = false, isLast = false) => {
    const indents = [];
    for (let i = 0; i < level; i++) {
      indents.push(
        <div
          key={i}
          className={`tree-indent ${i === level - 1 ? 
            (isLast ? 'has-line-last' : 'has-line') : 'has-line continues'}`}
        />
      );
    }
    return indents;
  };

  // Fonctions d'extraction de données selon structure réelle
  const getPageSections = (page) => {
    return page.layout?.sections || page.sections || [];
  };

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

  const getContainerComponents = (container) => {
    return container.components || [];
  };

  // Nom d'affichage adaptatif pour les composants
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
      {/* Arbre principal avec focus clavier */}
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
        {project.pages?.map((page, pageIndex) => {
          const sections = getPageSections(page);
          const hasChildren = sections.length > 0;
          const isLastPage = pageIndex === project.pages.length - 1;
          
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
              {sections.map((section, sectionIndex) => {
                const containers = getSectionContainers(section);
                const hasSectionChildren = containers.length > 0;
                const isLastSection = sectionIndex === sections.length - 1;
                
                return (
                  <React.Fragment key={section.id}>
                    <div 
                      className={`tree-item ${isSelected(section) ? 'selected' : ''} ${!isExpanded(page.id) ? 'hidden' : ''}`}
                      onClick={() => handleElementClick(section)}
                    >
                      <div className="tree-item-content">
                        {renderIndents(1, !isLastSection, isLastSection)}
                        {hasSectionChildren && (
                          <span 
                            className={`tree-expand ${isExpanded(section.id) ? 'expanded' : 'collapsed'}`}
                            onClick={(e) => toggleExpand(e, section.id)}
                          />
                        )}
                        {!hasSectionChildren && <div style={{width: '16px'}} />}
                        <span className="tree-label">{section.name}</span>
                      </div>
                      <span className="tree-type">section</span>
                      <button 
                        className="tree-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Adding container to section:', section.id);
                          // Auto-expand la section quand on ajoute un container
                          autoExpand(section.id);
                          onContainerSelect(null, section.id);
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Containers de cette section */}
                    {containers.map((container, containerIndex) => {
                      const components = getContainerComponents(container);
                      const hasContainerChildren = components.length > 0;
                      const isLastContainer = containerIndex === containers.length - 1;
                      
                      return (
                        <React.Fragment key={container.id}>
                          <div 
                            className={`tree-item ${isSelected(container) ? 'selected' : ''} ${(!isExpanded(page.id) || !isExpanded(section.id)) ? 'hidden' : ''}`}
                            onClick={() => handleElementClick(container)}
                          >
                            <div className="tree-item-content">
                              {renderIndents(2, !isLastContainer, isLastContainer)}
                              {hasContainerChildren && (
                                <span 
                                  className={`tree-expand ${isExpanded(container.id) ? 'expanded' : 'collapsed'}`}
                                  onClick={(e) => toggleExpand(e, container.id)}
                                />
                              )}
                              {!hasContainerChildren && <div style={{width: '16px'}} />}
                              <span className="tree-label">{container.name}</span>
                            </div>
                            <span className="tree-type">{container.type}</span>
                            <button 
                              className="tree-add-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🔧 Adding component to container:', container.id);
                                // Auto-expand le container quand on ajoute un composant
                                autoExpand(container.id);
                                // ✅ CORRECTION: Appeler onComponentSelect au lieu de onAddComponent
                                onComponentSelect(null, container.id);
                              }}
                            >
                              +
                            </button>
                          </div>

                          {/* Composants de ce container */}
                          {components.map((component, componentIndex) => {
                            const isLastComponent = componentIndex === components.length - 1;
                            
                            return (
                              <div 
                                key={component.id}
                                className={`tree-item ${isSelected(component) ? 'selected' : ''} ${(!isExpanded(page.id) || !isExpanded(section.id) || !isExpanded(container.id)) ? 'hidden' : ''}`}
                                onClick={() => handleElementClick(component)}
                              >
                                <div className="tree-item-content">
                                  {renderIndents(3, !isLastComponent, isLastComponent)}
                                  <div style={{width: '16px'}} />
                                  <span className="tree-label">{getComponentDisplayName(component)}</span>
                                </div>
                                <span className="tree-type">{component.type}</span>
                                <div style={{width: '16px', height: '16px'}} />
                              </div>
                            );
                          })}
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

// Module principal
function StructureModule({
  project,
  selectedElement,
  onElementSelect,
  onAddPage,
  onAddSection,
  onAddDiv,
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