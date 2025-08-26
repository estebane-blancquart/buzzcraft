import React, { useState, useCallback, useMemo } from 'react';
import ElementTree from './ElementTree.jsx';

/*
 * FAIT QUOI : Container structure avec ElementTree + modals selector intégrés
 * REÇOIT : project, selectedElement, onElementSelect, handlers CRUD
 * RETOURNE : Module complet gestion structure avec UX optimisée
 * ERREURS : Défensif avec handlers optionnels + validation
 */

function StructureModule({ 
  project = null, 
  selectedElement = null, 
  onElementSelect = () => {},
  onAddPage = () => {},
  onAddSection = () => {},
  onAddDiv = () => {},
  onAddComponent = () => {},
  onDeleteElement = () => {}
}) {
  // États locaux pour les modals
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [showContainerSelector, setShowContainerSelector] = useState(false);

  // Configuration des types avec métadonnées
  const componentTypes = useMemo(() => [
    { id: 'heading', name: 'Heading', icon: '📝', description: 'Text heading (H1-H6)' },
    { id: 'paragraph', name: 'Paragraph', icon: '📄', description: 'Regular text content' },
    { id: 'button', name: 'Button', icon: '🔘', description: 'Interactive button' },
    { id: 'image', name: 'Image', icon: '🖼️', description: 'Image with alt text' },
    { id: 'video', name: 'Video', icon: '🎥', description: 'Video player' },
    { id: 'link', name: 'Link', icon: '🔗', description: 'Hyperlink to URL' }
  ], []);

  const containerTypes = useMemo(() => [
    { id: 'div', name: 'Div Container', icon: '📦', description: 'Generic container' },
    { id: 'list', name: 'List Container', icon: '📋', description: 'Ordered/unordered list' },
    { id: 'form', name: 'Form Container', icon: '📝', description: 'Form with inputs' }
  ], []);

  // === HANDLERS OPTIMISÉS ===

  // Ouverture modals avec fermeture de l'autre
  const handleOpenComponentSelector = useCallback(() => {
    console.log('Opening component selector');
    setShowComponentSelector(true);
    setShowContainerSelector(false);
  }, []);

  const handleOpenContainerSelector = useCallback(() => {
    console.log('Opening container selector');
    setShowContainerSelector(true);
    setShowComponentSelector(false);
  }, []);

  // Fermeture des modals
  const handleCloseSelectors = useCallback(() => {
    console.log('Closing all selectors');
    setShowComponentSelector(false);
    setShowContainerSelector(false);
  }, []);

  // Sélection de composant avec validation
  const handleComponentSelect = useCallback((componentType) => {
    console.log('Component selected:', componentType);
    
    if (!componentType) {
      console.warn('Invalid component type selected');
      return;
    }

    if (!selectedElement) {
      console.warn('No container selected for component');
      return;
    }

    setShowComponentSelector(false);
    
    if (onAddComponent) {
      onAddComponent(componentType);
    }
  }, [selectedElement, onAddComponent]);

  // Sélection de container avec validation
  const handleContainerSelect = useCallback((containerType) => {
    console.log('Container selected:', containerType);
    
    if (!containerType) {
      console.warn('Invalid container type selected');
      return;
    }

    if (!selectedElement) {
      console.warn('No section selected for container');
      return;
    }

    setShowContainerSelector(false);
    
    if (onAddDiv) {
      onAddDiv(containerType);
    }
  }, [selectedElement, onAddDiv]);

  // Handlers avec validation pour ElementTree
  const handleAddDivWithValidation = useCallback(() => {
    if (!selectedElement) {
      console.warn('No section selected for adding container');
      return;
    }
    handleOpenContainerSelector();
  }, [selectedElement, handleOpenContainerSelector]);

  const handleAddComponentWithValidation = useCallback(() => {
    if (!selectedElement) {
      console.warn('No container selected for adding component');
      return;
    }
    handleOpenComponentSelector();
  }, [selectedElement, handleOpenComponentSelector]);

  // === RENDERING FUNCTIONS ===

  // Render modal component selector
  const renderComponentSelector = useCallback(() => {
    if (!showComponentSelector) return null;

    return (
      <div className="modal-overlay" onClick={handleCloseSelectors}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Add Component</h2>
            <button onClick={handleCloseSelectors} className="modal-close" aria-label="Close">
              ×
            </button>
          </div>
          
          <div className="modal-body">
            {!selectedElement ? (
              <div className="modal-warning">
                ⚠️ Select a container first to add a component
              </div>
            ) : (
              <>
                <div className="modal-context">
                  Adding to: <strong>{selectedElement.name || selectedElement.id}</strong>
                </div>
                <div className="selector-grid">
                  {componentTypes.map(type => (
                    <button
                      key={type.id}
                      className="selector-item"
                      onClick={() => handleComponentSelect(type.id)}
                      title={type.description}
                    >
                      <span className="selector-icon">{type.icon}</span>
                      <span className="selector-name">{type.name}</span>
                      <span className="selector-desc">{type.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="modal-footer">
            <button onClick={handleCloseSelectors} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }, [showComponentSelector, selectedElement, componentTypes, handleComponentSelect, handleCloseSelectors]);

  // Render modal container selector  
  const renderContainerSelector = useCallback(() => {
    if (!showContainerSelector) return null;

    return (
      <div className="modal-overlay" onClick={handleCloseSelectors}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Add Container</h2>
            <button onClick={handleCloseSelectors} className="modal-close" aria-label="Close">
              ×
            </button>
          </div>
          
          <div className="modal-body">
            {!selectedElement ? (
              <div className="modal-warning">
                ⚠️ Select a section first to add a container
              </div>
            ) : (
              <>
                <div className="modal-context">
                  Adding to: <strong>{selectedElement.name || selectedElement.id}</strong>
                </div>
                <div className="selector-grid">
                  {containerTypes.map(type => (
                    <button
                      key={type.id}
                      className="selector-item"
                      onClick={() => handleContainerSelect(type.id)}
                      title={type.description}
                    >
                      <span className="selector-icon">{type.icon}</span>
                      <span className="selector-name">{type.name}</span>
                      <span className="selector-desc">{type.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="modal-footer">
            <button onClick={handleCloseSelectors} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }, [showContainerSelector, selectedElement, containerTypes, handleContainerSelect, handleCloseSelectors]);

  // === KEYBOARD SHORTCUTS ===

  // Support clavier pour fermer modals
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && (showComponentSelector || showContainerSelector)) {
        handleCloseSelectors();
      }
    };

    if (showComponentSelector || showContainerSelector) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [showComponentSelector, showContainerSelector, handleCloseSelectors]);

  // === VALIDATION PROJECT ===

  if (!project) {
    return (
      <div className="project-tree">
        <div className="tree-header">
          <h3>Structure</h3>
        </div>
        <div className="tree-empty">
          No project loaded
        </div>
      </div>
    );
  }

  // === MAIN RENDER ===

  return (
    <div className="project-tree">
      <div className="tree-header">
        <h3>Structure</h3>
        <div className="tree-actions">
          <button 
            onClick={onAddPage}
            className="btn-primary btn-small"
            title="Add new page to project"
          >
            + Page
          </button>
        </div>
      </div>

      {/* Contexte sélection */}
      {selectedElement && (
        <div className="tree-selection-context">
          Selected: <strong>{selectedElement.name || selectedElement.id}</strong>
          <span className="selection-type">({selectedElement.type || 'element'})</span>
        </div>
      )}
      
      <ElementTree
        project={project}
        selectedElement={selectedElement}
        onElementSelect={onElementSelect}
        onAddPage={onAddPage}
        onAddSection={onAddSection}
        onAddDiv={handleAddDivWithValidation}
        onAddComponent={handleAddComponentWithValidation}
        onDeleteElement={onDeleteElement}
      />

      {/* Modals avec validation intégrée */}
      {renderComponentSelector()}
      {renderContainerSelector()}
    </div>
  );
}

export default StructureModule;