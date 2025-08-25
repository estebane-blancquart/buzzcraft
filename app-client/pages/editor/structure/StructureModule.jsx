import React, { useState } from 'react';
import ElementTree from './ElementTree.jsx';

/*
 * FAIT QUOI : Container structure avec ElementTree + modals selector intégrés
 * REÇOIT : project, selectedElement, onElementSelect, onAddPage, etc.
 * RETOURNE : Module complet gestion structure
 * ERREURS : Défensif avec handlers optionnels
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
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [showContainerSelector, setShowContainerSelector] = useState(false);

  // Types de composants disponibles
  const componentTypes = [
    { id: 'heading', name: 'Heading', icon: '📝' },
    { id: 'paragraph', name: 'Paragraph', icon: '📄' },
    { id: 'button', name: 'Button', icon: '🔘' },
    { id: 'image', name: 'Image', icon: '🖼️' },
    { id: 'video', name: 'Video', icon: '🎥' },
    { id: 'link', name: 'Link', icon: '🔗' }
  ];

  // Types de containers disponibles
  const containerTypes = [
    { id: 'div', name: 'Div Container', icon: '📦' },
    { id: 'list', name: 'List Container', icon: '📋' },
    { id: 'form', name: 'Form Container', icon: '📝' }
  ];

  // Handlers avec modals intégrés
  const handleAddDiv = () => {
    setShowContainerSelector(true);
    setShowComponentSelector(false);
  };

  const handleAddComponent = () => {
    setShowComponentSelector(true);
    setShowContainerSelector(false);
  };

  const handleComponentSelect = (componentType) => {
    console.log('Component selected:', componentType);
    setShowComponentSelector(false);
    if (onAddComponent) {
      onAddComponent(componentType);
    }
  };

  const handleContainerSelect = (containerType) => {
    console.log('Container selected:', containerType);
    setShowContainerSelector(false);
    if (onAddDiv) {
      onAddDiv(containerType);
    }
  };

  const handleCloseSelectors = () => {
    setShowComponentSelector(false);
    setShowContainerSelector(false);
  };

  return (
    <div className="project-tree">
      <div className="tree-header">
        <h3>Structure</h3>
        <button onClick={onAddPage}>+</button>
      </div>
      
      <ElementTree
        project={project}
        selectedElement={selectedElement}
        onElementSelect={onElementSelect}
        onAddPage={onAddPage}
        onAddSection={onAddSection}
        onAddDiv={handleAddDiv}
        onAddComponent={handleAddComponent}
        onDeleteElement={onDeleteElement}
      />

      {/* Component Selector Modal intégré */}
      {showComponentSelector && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Component</h2>
              <button onClick={handleCloseSelectors} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="selector-grid">
                {componentTypes.map(type => (
                  <button
                    key={type.id}
                    className="selector-item"
                    onClick={() => handleComponentSelect(type.id)}
                  >
                    <span className="selector-icon">{type.icon}</span>
                    <span className="selector-name">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseSelectors}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Container Selector Modal intégré */}
      {showContainerSelector && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Container</h2>
              <button onClick={handleCloseSelectors} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="selector-grid">
                {containerTypes.map(type => (
                  <button
                    key={type.id}
                    className="selector-item"
                    onClick={() => handleContainerSelect(type.id)}
                  >
                    <span className="selector-icon">{type.icon}</span>
                    <span className="selector-name">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseSelectors}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StructureModule;