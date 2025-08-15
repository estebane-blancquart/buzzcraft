import React, { useState } from 'react';
import { useProjectEditor } from '@hooks/useProjectEditor.js';

function Editor() {
  const {
    project,
    selectedElement,
    loading,
    error,
    isDirty,
    saveProject,
    updateProjectName,
    addPage,
    deletePage,
    updatePageName,
    selectElement,
    handleBackToDashboard,
    clearError
  } = useProjectEditor();

  const [editingProjectName, setEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');
  const [editingPageIndex, setEditingPageIndex] = useState(null);
  const [tempPageName, setTempPageName] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);

  if (loading) {
    return (
      <div className="editor">
        <div className="loading">Chargement de l'√©diteur...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor">
        <div className="editor-header">
          <h1>Erreur</h1>
          <button onClick={handleBackToDashboard} className="btn-secondary">
            Retour Dashboard
          </button>
        </div>
        <div className="error-banner">
          <span>‚ö†Ô∏è {error}</span>
          <button onClick={clearError}>√ó</button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="editor">
        <div className="editor-header">
          <h1>Projet introuvable</h1>
          <button onClick={handleBackToDashboard} className="btn-primary">
            Retour Dashboard
          </button>
        </div>
      </div>
    );
  }

  const startEditProjectName = () => {
    setTempProjectName(project.name);
    setEditingProjectName(true);
  };

  const saveProjectName = () => {
    if (tempProjectName.trim()) {
      updateProjectName(tempProjectName.trim());
    }
    setEditingProjectName(false);
  };

  const cancelEditProjectName = () => {
    setEditingProjectName(false);
    setTempProjectName('');
  };

  const startEditPageName = (pageIndex, currentName) => {
    setTempPageName(currentName);
    setEditingPageIndex(pageIndex);
  };

  const savePageName = () => {
    if (tempPageName.trim() && editingPageIndex !== null) {
      updatePageName(editingPageIndex, tempPageName.trim());
    }
    setEditingPageIndex(null);
    setTempPageName('');
  };

  const cancelEditPageName = () => {
    setEditingPageIndex(null);
    setTempPageName('');
  };

  return (
    <div className="editor">
      {/* HEADER */}
      <header className="editor-header">
        <div className="editor-title">
          {editingProjectName ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                value={tempProjectName}
                onChange={(e) => setTempProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveProjectName();
                  if (e.key === 'Escape') cancelEditProjectName();
                }}
                className="inline-edit-input"
                autoFocus
              />
              <button className="tree-action-btn confirm" onClick={saveProjectName}>‚úì</button>
              <button className="tree-action-btn cancel" onClick={cancelEditProjectName}>‚úó</button>
            </div>
          ) : (
            <div>
              <h1 onClick={startEditProjectName} style={{ cursor: 'pointer' }}>
                {project.name}
                <span style={{ fontSize: '0.7em', opacity: 0.5, marginLeft: '0.5rem' }}>‚úèÔ∏è</span>
              </h1>
              <span className="project-id">({project.id})</span>
              {isDirty && <span className="dirty-indicator">‚óè</span>}
            </div>
          )}
        </div>

        <div className="editor-controls">
          <div className="device-selector">
            <button className="device-btn active">
              <span className="device-icon">Ì≤ª</span>
              <span className="device-label">DESKTOP</span>
            </button>
            <button className="device-btn">
              <span className="device-icon">Ì≥±</span>
              <span className="device-label">TABLET</span>
            </button>
            <button className="device-btn">
              <span className="device-icon">Ì≥±</span>
              <span className="device-label">MOBILE</span>
            </button>
          </div>
        </div>

        <div className="editor-actions">
          <button
            onClick={saveProject}
            className={`btn-primary ${!isDirty ? 'disabled' : ''}`}
            disabled={!isDirty}
          >
            SAVE
          </button>
          <button onClick={handleBackToDashboard} className="btn-secondary">
            DASHBOARD
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="editor-workspace">
        {/* TREE */}
        <div className="project-tree">
          <div className="tree-header">
            <h3>Structure</h3>
          </div>
          
          <div className="tree-content">
            {/* ROOT PROJECT */}
            <div 
              className="tree-item"
              onMouseEnter={() => setHoveredItem('project')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div 
                className={`tree-node ${selectedElement?.path === 'project' ? 'selected' : ''}`}
                onClick={() => selectElement(project, 'project')}
              >
                <div className="tree-node-content">
                  <span className="tree-icon">Ì≥¶</span>
                  <span className="tree-label">{project.name}</span>
                  <span className="tree-type">PROJECT</span>
                </div>
                
                {hoveredItem === 'project' && (
                  <div className="tree-actions">
                    <button 
                      className="tree-action-btn add"
                      onClick={(e) => {
                        e.stopPropagation();
                        addPage();
                      }}
                      title="Ajouter une page"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PAGES */}
            {project.pages?.map((page, i) => (
              <div 
                key={i} 
                className="tree-item nested"
                onMouseEnter={() => setHoveredItem(`page-${i}`)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  className={`tree-node ${selectedElement?.path === `page-${i}` ? 'selected' : ''}`}
                  onClick={() => selectElement(page, `page-${i}`)}
                >
                  <div className="tree-node-content">
                    <span className="tree-icon">Ì≥Ñ</span>
                    
                    {editingPageIndex === i ? (
                      <div className="tree-edit-container">
                        <input
                          value={tempPageName}
                          onChange={(e) => setTempPageName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') savePageName();
                            if (e.key === 'Escape') cancelEditPageName();
                          }}
                          className="tree-edit-input"
                          autoFocus
                        />
                        <button className="tree-action-btn confirm" onClick={savePageName}>‚úì</button>
                        <button className="tree-action-btn cancel" onClick={cancelEditPageName}>‚úó</button>
                      </div>
                    ) : (
                      <>
                        <span className="tree-label">{page.name || `Page ${i + 1}`}</span>
                        <span className="tree-type">PAGE</span>
                      </>
                    )}
                  </div>

                  {hoveredItem === `page-${i}` && editingPageIndex !== i && (
                    <div className="tree-actions">
                      <button 
                        className="tree-action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditPageName(i, page.name || `Page ${i + 1}`);
                        }}
                        title="Modifier le nom"
                      >
                        ‚úèÔ∏è
                      </button>
                      <button 
                        className="tree-action-btn remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Supprimer la page "${page.name || `Page ${i + 1}`}" ?`)) {
                            deletePage(i);
                          }
                        }}
                        title="Supprimer la page"
                      >
                        ‚àí
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* BOUTON AJOUTER PAGE si aucune page */}
            {(!project.pages || project.pages.length === 0) && (
              <div className="tree-item">
                <button 
                  className="tree-add-first"
                  onClick={addPage}
                >
                  <span className="tree-icon">Ì≥Ñ</span>
                  <span>Ajouter une page</span>
                  <span className="tree-action-btn add">+</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW - unchanged */}
        <div className="project-preview">
          <div className="preview-header">
            <h3>Preview</h3>
            <span className="device-indicator">DESKTOP</span>
          </div>
          
          <div className="preview-content">
            <div className="preview-viewport device-desktop">
              {selectedElement ? (
                <div className="preview-page">
                  <div style={{ padding: '2rem' }}>
                    <h2>{selectedElement.path === 'project' ? 'Ì≥¶ Projet' : `Ì≥Ñ ${selectedElement.element.name}`}</h2>
                    <div style={{ 
                      background: 'white', 
                      padding: '1rem', 
                      borderRadius: '0.5rem', 
                      border: '1px solid #e5e7eb',
                      color: '#333'
                    }}>
                      {selectedElement.path === 'project' ? (
                        <div>
                          <p><strong>Nom:</strong> {project.name}</p>
                          <p><strong>Template:</strong> {project.template}</p>
                          <p><strong>Pages:</strong> {project.pages?.length || 0}</p>
                          <p><strong>√âtat:</strong> {project.state}</p>
                        </div>
                      ) : (
                        <div>
                          <p><strong>Page:</strong> {selectedElement.element.name}</p>
                          <p><strong>ID:</strong> {selectedElement.element.id}</p>
                          <p><strong>Sections:</strong> {selectedElement.element.layout?.sections?.length || 0}</p>
                          <div style={{ 
                            marginTop: '1rem', 
                            padding: '1rem', 
                            background: '#f9fafb', 
                            borderRadius: '0.25rem', 
                            fontSize: '0.9rem', 
                            color: '#666' 
                          }}>
                            Le contenu de la page sera visible apr√®s compilation (BUILD)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-project">
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    Ì±à S√©lectionnez un √©l√©ment dans la structure
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PROPERTIES - unchanged */}
        <div className="project-properties">
          <div className="properties-header">
            <h3>Propri√©t√©s</h3>
            <span className="element-type">
              {selectedElement?.path === 'project' ? 'PROJECT' : 'PAGE'}
            </span>
          </div>

          <div className="properties-device-indicator">
            <span className="device-label">DESKTOP</span>
          </div>

          <div className="properties-content">
            {selectedElement ? (
              selectedElement.path === 'project' ? (
                <div>
                  <div className="property-field">
                    <label>Nom du projet</label>
                    <div className="property-value">{project.name}</div>
                    <small>Cliquez sur le nom en haut pour modifier</small>
                  </div>
                  
                  <div className="property-field">
                    <label>ID</label>
                    <div className="property-value">{project.id}</div>
                  </div>
                  
                  <div className="property-field">
                    <label>√âtat</label>
                    <div className="property-value">{project.state}</div>
                  </div>
                  
                  <div className="property-field">
                    <label>Template</label>
                    <div className="property-value">{project.template}</div>
                  </div>
                  
                  <div className="property-field">
                    <label>Pages</label>
                    <div className="property-value">{project.pages?.length || 0}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="property-field">
                    <label>Nom de la page</label>
                    <div className="property-value">{selectedElement.element.name}</div>
                    <small>Survolez la page dans la structure pour modifier</small>
                  </div>
                  
                  <div className="property-field">
                    <label>ID</label>
                    <div className="property-value">{selectedElement.element.id}</div>
                  </div>
                  
                  <div className="property-field">
                    <label>Sections</label>
                    <div className="property-value">{selectedElement.element.layout?.sections?.length || 0}</div>
                  </div>
                </div>
              )
            ) : (
              <div className="properties-empty">
                <p>S√©lectionnez un √©l√©ment pour voir ses propri√©t√©s</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
