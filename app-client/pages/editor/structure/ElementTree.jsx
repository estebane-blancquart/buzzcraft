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
  // DEBUG: Affichage de la structure du projet
  React.useEffect(() => {
    console.log('=== DEBUG ELEMENTTREE ===');
    console.log('Project:', project);
    if (project?.pages) {
      console.log('Pages count:', project.pages.length);
      project.pages.forEach((page, i) => {
        console.log(`Page ${i}:`, page);
        console.log(`Page ${i} layout:`, page.layout);
        if (page.layout?.sections) {
          console.log(`Page ${i} sections:`, page.layout.sections);
        }
      });
    }
    console.log('=========================');
  }, [project]);

  const [expandedItems, setExpandedItems] = React.useState(() => {
    if (!project) return new Set();
    const initialExpanded = new Set();
    initialExpanded.add(project.id);
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
    console.log('Element clicked:', element);
    if (onElementSelect) {
      onElementSelect(element);
    }
  };

  const toggleExpand = (event, itemId) => {
    event.stopPropagation();
    console.log('Toggle expand:', itemId);
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      console.log('New expanded items:', Array.from(newSet));
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

  return (
    <div className="tree-content">
      {/* DEBUG INFO */}
      <div style={{fontSize: '10px', color: '#666', padding: '4px', borderBottom: '1px solid #333'}}>
        DEBUG: Pages: {project.pages?.length || 0} | Selected: {selectedElement?.id || 'none'}
      </div>

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
            console.log('Add page clicked');
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
                console.log('Add section clicked for page:', page.id);
                onAddSection(page.id);
              }}
            >
              +
            </button>
          </div>

          {/* DEBUG: Sections */}
          <div className={`tree-item ${!isExpanded(page.id) ? 'hidden' : ''}`} style={{fontSize: '10px', color: '#666', padding: '2px 8px'}}>
            DEBUG Sections: {page.layout?.sections?.length || 0} | Path: page.layout.sections
            {page.layout?.sections?.map(section => (
              <div key={section.id}>- {section.name} ({section.id})</div>
            ))}
          </div>

          {/* Sections - Essayer différents chemins */}
          {page.layout?.sections?.map(section => (
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

          {/* Alternative: sections directement dans page */}
          {page.sections?.map(section => (
            <div 
              key={section.id}
              className={`tree-item ${isSelected(section) ? 'selected' : ''} ${!isExpanded(page.id) ? 'hidden' : ''}`}
              onClick={() => handleElementClick(section)}
            >
              <div className="tree-item-content">
                {renderIndents(1)}
                <span className="tree-label">{section.name} (alt path)</span>
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
        </React.Fragment>
      ))}

      <div className="delete-hint">Suppr pour supprimer | DEBUG MODE</div>
    </div>
  );
}

export default ElementTree;