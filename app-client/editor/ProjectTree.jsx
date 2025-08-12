import React, { useState } from 'react';

/*
 * FAIT QUOI : Arbre hiérarchique avec vraies actions CRUD
 * REÇOIT : project: object, selectedElement: object, onElementSelect: function, onProjectUpdate: function
 * RETOURNE : JSX arbre avec actions fonctionnelles
 */

export default function ProjectTree({ project, selectedElement, onElementSelect, onProjectUpdate }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['project', 'layout']));

  const toggleNode = (path) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const isExpanded = (path) => expandedNodes.has(path);
  const isSelected = (path) => selectedElement?.path === path;

  // Helper pour mettre à jour le projet profondément
  const updateProjectAtPath = (pathString, updater) => {
    const newProject = JSON.parse(JSON.stringify(project)); // Deep clone
    
    // Parse le path "project.pages[0].layout.sections[1]"
    const pathParts = pathString.split('.');
    let current = newProject;
    
    for (let i = 1; i < pathParts.length; i++) { // Skip "project"
      const part = pathParts[i];
      
      if (part.includes('[')) {
        // Array access: "pages[0]"
        const [arrayName, indexStr] = part.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        current = current[arrayName][index];
      } else {
        // Object access: "layout"
        current = current[part];
      }
    }
    
    updater(current);
    onProjectUpdate(newProject);
  };

  const handleAddPage = () => {
    console.log('Adding new page...');
    const newPage = {
      id: `page-${Date.now()}`,
      name: 'New Page',
      layout: {
        sections: []
      }
    };
    
    const newProject = { ...project };
    if (!newProject.pages) {
      newProject.pages = [];
    }
    newProject.pages.push(newPage);
    
    onProjectUpdate(newProject);
    
    // Auto-expand la nouvelle page
    setExpandedNodes(prev => new Set([...prev, `project.pages[${newProject.pages.length - 1}]`]));
  };

  const handleAddSection = (layoutPath) => {
    console.log('Adding section to:', layoutPath);
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      divs: [],
      lists: [],
      forms: []
    };
    
    updateProjectAtPath(layoutPath, (layout) => {
      if (!layout.sections) {
        layout.sections = [];
      }
      layout.sections.push(newSection);
    });
  };

  const handleAddContainer = (sectionPath, containerType) => {
    console.log('Adding container:', containerType, 'to:', sectionPath);
    
    const containerData = {
      div: {
        id: `div-${Date.now()}`,
        name: 'New Container',
        type: 'div',
        classname: '',
        components: []
      },
      list: {
        id: `list-${Date.now()}`,
        name: 'New List',
        type: 'list',
        tag: 'ul',
        classname: '',
        items: []
      },
      form: {
        id: `form-${Date.now()}`,
        name: 'New Form',
        type: 'form',
        action: '#',
        method: 'POST',
        classname: '',
        inputs: [],
        buttons: []
      }
    };
    
    const newContainer = containerData[containerType];
    
    updateProjectAtPath(sectionPath, (section) => {
      const arrayName = `${containerType}s`; // div → divs, list → lists, form → forms
      if (!section[arrayName]) {
        section[arrayName] = [];
      }
      section[arrayName].push(newContainer);
    });
  };

  const handleAddComponent = (containerPath) => {
    console.log('Adding component to:', containerPath);
    const newComponent = {
      id: `component-${Date.now()}`,
      type: 'paragraph',
      content: 'New paragraph text',
      classname: ''
    };
    
    updateProjectAtPath(containerPath, (container) => {
      if (!container.components) {
        container.components = [];
      }
      container.components.push(newComponent);
    });
  };

  const handleDelete = (pathString, node) => {
    const confirmed = window.confirm(`Supprimer "${node.name || node.id}" ?`);
    if (!confirmed) return;
    
    console.log('Deleting:', pathString, node.name || node.id);
    
    // Parse le path pour trouver le parent et l'index
    const pathParts = pathString.split('.');
    const lastPart = pathParts[pathParts.length - 1];
    
    if (lastPart.includes('[')) {
      // C'est un élément d'array
      const parentPath = pathParts.slice(0, -1).join('.');
      const [arrayName, indexStr] = lastPart.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      
      updateProjectAtPath(parentPath, (parent) => {
        if (parent[arrayName] && parent[arrayName][index]) {
          parent[arrayName].splice(index, 1);
        }
      });
    }
  };

  const renderTreeNode = (node, path, level = 0) => {
    if (!node) return null;

    const hasChildren = (
      (node.pages && node.pages.length > 0) ||
      (node.layout && node.layout.sections) ||
      (node.sections && node.sections.length > 0) ||
      (node.divs && node.divs.length > 0) ||
      (node.lists && node.lists.length > 0) ||
      (node.forms && node.forms.length > 0) ||
      (node.components && node.components.length > 0)
    );

    const nodeClass = `tree-node level-${level} ${isSelected(path) ? 'selected' : ''} ${hasChildren ? 'has-children' : ''}`;
    const canDelete = path !== 'project' && !path.includes('layout'); // Pas supprimer project/layout

    return (
      <div key={path} className={nodeClass}>
        <div 
          className="tree-node-content"
          onClick={() => onElementSelect(node, path)}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren && (
            <button 
              className={`tree-toggle ${isExpanded(path) ? 'expanded' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleNode(path); }}
            >
              ▶
            </button>
          )}
          
          <span className="tree-node-label">
            {node.name || node.id || 'Unnamed'}
          </span>
          
          {node.type && (
            <span className="tree-node-type">{node.type}</span>
          )}

          {/* Bouton delete seulement (sur hover) */}
          {canDelete && (
            <button 
              className="tree-delete-btn"
              onClick={(e) => { e.stopPropagation(); handleDelete(path, node); }}
              title="Supprimer"
            >
              ×
            </button>
          )}
        </div>

        {hasChildren && isExpanded(path) && (
          <div className="tree-children">
            {/* Pages */}
            {node.pages?.map((page, index) => 
              renderTreeNode(page, `${path}.pages[${index}]`, level + 1)
            )}
            
            {/* Zone Add Page */}
            {node.pages !== undefined && isExpanded(path) && (
              <div 
                className="tree-action-zone" 
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              >
                <button className="add-zone-btn" onClick={handleAddPage}>
                  + Add Page
                </button>
              </div>
            )}
            
            {/* Layout sections */}
            {node.layout?.sections?.map((section, index) => 
              renderTreeNode(section, `${path}.layout.sections[${index}]`, level + 1)
            )}
            
            {/* Zone Add Section */}
            {node.layout?.sections !== undefined && isExpanded(path) && (
              <div 
                className="tree-action-zone" 
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              >
                <button 
                  className="add-zone-btn" 
                  onClick={() => handleAddSection(`${path}.layout`)}
                >
                  + Add Section
                </button>
              </div>
            )}
            
            {/* Sections */}
            {node.sections?.map((section, index) => 
              renderTreeNode(section, `${path}.sections[${index}]`, level + 1)
            )}
            
            {/* Containers */}
            {node.divs?.map((div, index) => 
              renderTreeNode(div, `${path}.divs[${index}]`, level + 1)
            )}
            {node.lists?.map((list, index) => 
              renderTreeNode(list, `${path}.lists[${index}]`, level + 1)
            )}
            {node.forms?.map((form, index) => 
              renderTreeNode(form, `${path}.forms[${index}]`, level + 1)
            )}

            {/* Zone Add Container (pour sections) */}
            {(node.divs !== undefined || node.lists !== undefined || node.forms !== undefined) && isExpanded(path) && (
              <div 
                className="tree-action-zone container-actions" 
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              >
                <button 
                  className="add-zone-btn small" 
                  onClick={() => handleAddContainer(path, 'div')}
                >
                  + Div
                </button>
                <button 
                  className="add-zone-btn small" 
                  onClick={() => handleAddContainer(path, 'list')}
                >
                  + List
                </button>
                <button 
                  className="add-zone-btn small" 
                  onClick={() => handleAddContainer(path, 'form')}
                >
                  + Form
                </button>
              </div>
            )}
            
            {/* Components */}
            {node.components?.map((component, index) => 
              renderTreeNode(component, `${path}.components[${index}]`, level + 1)
            )}

            {/* Zone Add Component (pour containers) */}
            {node.components !== undefined && isExpanded(path) && (
              <div 
                className="tree-action-zone" 
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              >
                <button 
                  className="add-zone-btn" 
                  onClick={() => handleAddComponent(path)}
                >
                  + Add Component
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!project) {
    return (
      <div className="project-tree">
        <div className="loading">Chargement projet...</div>
      </div>
    );
  }

  return (
    <div className="project-tree">
      <div className="tree-header">
        <h3>Structure</h3>
      </div>
      
      <div className="tree-content">
        {renderTreeNode(project, 'project')}
      </div>
    </div>
  );
}