import React from 'react';
import { ELEMENT_TYPES, UI_MESSAGES } from '@config/constants.js';
import Button from '@components/Button.jsx';

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
  if (!project) {
    return (
      <div className="project-tree">
        <div className="tree-header">
          <h3>Structure</h3>
        </div>
        <div className="tree-content">
          <div className="loading">{UI_MESSAGES.LOADING}</div>
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
                isSelected && (element.type === ELEMENT_TYPES.PAGE || element.type === ELEMENT_TYPES.SECTION || element.type === ELEMENT_TYPES.DIV) 
                  ? 'visible' : 'hidden'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (element.type === ELEMENT_TYPES.PAGE) onAddSection(path);
                if (element.type === ELEMENT_TYPES.SECTION) onAddDiv(path);
                if (element.type === ELEMENT_TYPES.DIV) onAddComponent(path);
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="project-tree">
      <div className="tree-header">
        <h3>Structure</h3>
        <Button size="sm" onClick={() => onAddPage()}>+ PAGE</Button>
      </div>
      
      <div className="tree-content">
        {project.pages?.map((page, pageIndex) => (
          <div key={pageIndex}>
            {renderElement({ ...page, type: ELEMENT_TYPES.PAGE }, `project.pages[${pageIndex}]`, 1)}
            
            {page.layout?.sections?.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {renderElement({ ...section, type: ELEMENT_TYPES.SECTION }, `project.pages[${pageIndex}].layout.sections[${sectionIndex}]`, 2)}
                
                {section.divs?.map((div, divIndex) => (
                  <div key={divIndex}>
                    {renderElement({ ...div, type: ELEMENT_TYPES.DIV }, `project.pages[${pageIndex}].layout.sections[${sectionIndex}].divs[${divIndex}]`, 3)}
                    
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

export default ProjectTree;
