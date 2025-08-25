import React from 'react';

function ProjectPreview({ 
  project, 
  device, 
  selectedElement, 
  onElementSelect 
}) {
  if (!project) {
    return (
      <div className="project-preview">
        <div className="preview-header">
          <h3>Preview</h3>
          <span className="device-indicator">{device}</span>
        </div>
        <div className="preview-content">
          <div className="empty-project">
            No project loaded
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-preview">
      <div className="preview-header">
        <h3>Preview</h3>
        <span className="device-indicator">{device}</span>
      </div>
      
      <div className="preview-content">
        <div className={`preview-viewport device-${device}`}>
          <div className="preview-page">
            <h1>{project.name}</h1>
            <p>Preview for {device} device</p>
            
            {project.pages?.map(page => (
              <div key={page.id} className="preview-section">
                <h2>{page.name}</h2>
                {page.layout?.sections?.map(section => (
                  <div key={section.id} className="preview-div">
                    <h3>{section.name || section.id}</h3>
                  </div>
                ))}
              </div>
            ))}
            
            {!project.pages?.length && (
              <div className="empty-page">
                No pages defined
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectPreview;
