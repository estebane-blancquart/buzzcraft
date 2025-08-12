import React from 'react';
import { useProjectEditor } from './hooks/useProjectEditor.js';
import EditorHeader from './modules/editor-header/index.jsx';
import ProjectTree from './modules/project-tree/index.jsx';
import ProjectPreview from './modules/project-preview/index.jsx';
import ProjectProperties from './modules/project-properties/index.jsx';

export default function Editor() {
  const {
    project,
    selectedElement,
    selectedDevice,
    loading,
    error,
    isDirty,
    saveProject,
    updateProject,
    handleElementSelect,
    handleElementUpdate,
    handleDeviceChange,
    handleBackToDashboard,
    clearError
  } = useProjectEditor();

  if (loading) {
    return (
      <div className="editor">
        <div className="loading">Chargement de l'éditeur...</div>
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
          <span>⚠️ {error}</span>
          <button onClick={clearError}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor">
      <EditorHeader
        project={project}
        selectedDevice={selectedDevice}
        isDirty={isDirty}
        onDeviceChange={handleDeviceChange}
        onSave={saveProject}
        onBackToDashboard={handleBackToDashboard}
      />

      <div className="editor-workspace">
        <ProjectTree
          project={project}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
          onProjectUpdate={updateProject}
        />

        <ProjectPreview
          project={project}
          device={selectedDevice}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
        />

        <ProjectProperties
          selectedElement={selectedElement}
          device={selectedDevice}
          onElementUpdate={handleElementUpdate}
        />
      </div>
    </div>
  );
}