import React from 'react';

function ProjectTree({ 
  project, 
  selectedElement, 
  onElementSelect,
  onAddPage,
  onAddSection, 
  onAddDiv,
  onAddComponent,
  onDeleteElement 
}) {
  if (!project) return <div>No project loaded</div>;

  return (
    <div className="project-tree">
      <div className="tree-header">
        <h3>Structure</h3>
        <button onClick={onAddPage}>+</button>
      </div>
      
      <div className="tree-content">
        <div className="tree-item">
          <div className="tree-node">
            <span className="tree-label">{project.name}</span>
            <span className="tree-type">PROJECT</span>
          </div>
        </div>
        
        {project.pages?.map(page => (
          <div key={page.id} className="tree-item nested">
            <div className="tree-node">
              <span className="tree-label">{page.name}</span>
              <span className="tree-type">PAGE</span>
              <button onClick={() => onAddSection(page.id)}>+</button>
            </div>
          </div>
        ))}
        
        <div className="tree-add-first" onClick={onAddComponent}>
          <span>+ Add Component</span>
        </div>
      </div>
    </div>
  );
}

export default ProjectTree;
