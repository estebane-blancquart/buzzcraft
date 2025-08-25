import React from 'react';

function ProjectProperties({ 
  selectedElement, 
  device, 
  onElementUpdate 
}) {
  return (
    <div className="project-properties">
      <div className="properties-header">
        <h3>Properties</h3>
        {selectedElement && (
          <span className="element-type">{selectedElement.type}</span>
        )}
      </div>
      
      <div className="properties-device-indicator">
        <span className="device-label">{device}</span>
      </div>
      
      <div className="properties-content">
        {selectedElement ? (
          <div>
            <div className="property-field">
              <label>ID</label>
              <div className="property-value">{selectedElement.id}</div>
            </div>
            
            <div className="property-field">
              <label>Type</label>
              <div className="property-value">{selectedElement.type}</div>
            </div>
            
            {selectedElement.content && (
              <div className="property-field">
                <label>Content</label>
                <div className="property-value">{selectedElement.content}</div>
              </div>
            )}
            
            {selectedElement.classname && (
              <div className="property-field">
                <label>Classes</label>
                <div className="property-value">{selectedElement.classname}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="properties-empty">
            Select an element to edit properties
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectProperties;
