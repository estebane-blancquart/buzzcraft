import React, { useState } from 'react';

/*
 * FAIT QUOI : Arbre hiérarchique du projet avec boutons +/-
 * REÇOIT : project: object, selectedElement: object, onElementSelect: function
 * RETOURNE : JSX arbre navigable avec actions
 */

export default function ProjectTree({ project, selectedElement, onElementSelect }) {
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

    const handleAdd = (e) => {
      e.stopPropagation();
      console.log('Add child to:', path, node);
      // TODO: Ouvrir menu pour choisir quoi ajouter
    };

    const handleDelete = (e) => {
      e.stopPropagation();
      console.log('Delete:', path, node);
      // TODO: Confirmer et supprimer
    };

    const canAddChildren = node.type !== 'heading' && node.type !== 'paragraph' && node.type !== 'button' && node.type !== 'image' && node.type !== 'link';
    const canDelete = path !== 'project'; // Pas supprimer le projet racine

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

          {/* Boutons actions */}
          <div className="tree-node-actions">
            {canAddChildren && (
              <button 
                className="tree-action-btn add-btn"
                onClick={handleAdd}
                title="Ajouter un élément"
              >
                +
              </button>
            )}
            {canDelete && (
              <button 
                className="tree-action-btn delete-btn"
                onClick={handleDelete}
                title="Supprimer cet élément"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded(path) && (
          <div className="tree-children">
            {/* Pages */}
            {node.pages?.map((page, index) => 
              renderTreeNode(page, `${path}.pages[${index}]`, level + 1)
            )}
            
            {/* Layout sections */}
            {node.layout?.sections?.map((section, index) => 
              renderTreeNode(section, `${path}.layout.sections[${index}]`, level + 1)
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
            
            {/* Components */}
            {node.components?.map((component, index) => 
              renderTreeNode(component, `${path}.components[${index}]`, level + 1)
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