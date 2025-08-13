import React from 'react';

export default function ProjectTree({ 
  project, 
  selectedElement, 
  onElementSelect, 
  onAddPage,
  onAddSection,
  onAddDiv,
  onAddComponent,
  onDeleteElement
}) {
  if (!project) {
    return (
      <div className="project-tree">
        <div className="tree-header">
          <h3>Structure</h3>
        </div>
        <div className="tree-content">
          <div className="loading">Chargement projet...</div>
        </div>
      </div>
    );
  }

  const renderElement = (element, path, level = 0) => {
    const isSelected = selectedElement?.path === path;
    const paddingLeft = level * 16 + 8;

    return (
      <div key={path} className="tree-item">
        <button 
          className={`tree-delete-absolute ${level > 0 && isSelected ? 'visible' : 'hidden'}`}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteElement(path);
          }}
        >
          ×
        </button>
        <div 
          className={`tree-node ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft }}
          onClick={() => onElementSelect(element, path)}
        >
          <div className="tree-node-left">
            <span className="tree-label">
              {element.name || element.id || 'Unnamed'}
            </span>
          </div>
          <div className="tree-node-right">
            <span className="tree-type">
              {element.type || ''}
            </span>
            <button 
              className={`tree-add ${
                isSelected && (element.type === 'page' || element.type === 'section' || element.type === 'div') 
                  ? 'visible' : 'hidden'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (element.type === 'page') onAddSection(path);
                if (element.type === 'section') onAddDiv(path);
                if (element.type === 'div') onAddComponent(path);
              }}
            >
              +
            </button>
          </div>
        </div>
        
        {/* Actions supprimées - maintenant intégrées dans tree-node */}
      </div>
    );
  };

  return (
    <div className="project-tree">
      <div className="tree-header">
        <h3>Structure</h3>
        <button onClick={() => onAddPage()}>+ PAGE</button>
      </div>
      
      <div className="tree-content">
        {project.pages?.map((page, pageIndex) => (
          <div key={pageIndex}>
            {renderElement({ ...page, type: 'page' }, `project.pages[${pageIndex}]`, 1)}
            
            {page.layout?.sections?.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {renderElement({ ...section, type: 'section' }, `project.pages[${pageIndex}].layout.sections[${sectionIndex}]`, 2)}
                
                {section.divs?.map((div, divIndex) => (
                  <div key={divIndex}>
                    {renderElement({ ...div, type: 'div' }, `project.pages[${pageIndex}].layout.sections[${sectionIndex}].divs[${divIndex}]`, 3)}
                    
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