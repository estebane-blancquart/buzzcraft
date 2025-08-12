import React from 'react';

export default function ProjectTree({ 
  project, 
  selectedElement, 
  onElementSelect, 
  onProjectUpdate 
}) {
  if (!project) {
    return (
      <div className="project-tree">
        <div className="loading">Chargement projet...</div>
      </div>
    );
  }

  const renderElement = (element, path, level = 0) => {
    const isSelected = selectedElement?.path === path;
    const paddingLeft = level * 16 + 8;

    return (
      <div 
        key={path}
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft }}
        onClick={() => onElementSelect(element, path)}
      >
        <span className="tree-label">
          {element.name || element.id || 'Unnamed'}
        </span>
        {element.type && (
          <span className="tree-type">{element.type}</span>
        )}
      </div>
    );
  };

  return (
    <div className="project-tree">
      <div className="tree-header">
        <h3>Structure</h3>
      </div>
      
      <div className="tree-content">
        {renderElement(project, 'project', 0)}
        
        {project.pages?.map((page, pageIndex) => (
          <div key={pageIndex}>
            {renderElement(page, `project.pages[${pageIndex}]`, 1)}
            
            {page.layout?.sections?.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {renderElement(section, `project.pages[${pageIndex}].layout.sections[${sectionIndex}]`, 2)}
                
                {section.divs?.map((div, divIndex) => (
                  <div key={divIndex}>
                    {renderElement(div, `project.pages[${pageIndex}].layout.sections[${sectionIndex}].divs[${divIndex}]`, 3)}
                    
                    {div.components?.map((component, compIndex) => 
                      renderElement(component, `project.pages[${pageIndex}].layout.sections[${sectionIndex}].divs[${divIndex}].components[${compIndex}]`, 4)
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}