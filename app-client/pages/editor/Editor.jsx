import React from 'react';
import { useProjectEditor } from '@hooks/useProjectEditor.js';
import EditorHeader from '@pages/editor/toolbar/EditorHeader.jsx';
import ProjectTree from '@pages/editor/structure/ProjectTree.jsx';
import ProjectPreview from '@pages/editor/preview/ProjectPreview.jsx';
import ProjectProperties from '@pages/editor/properties/ProjectProperties.jsx';
import ComponentSelectorModal from '@pages/editor/structure/ComponentSelectorModal.jsx';
import ContainerSelectorModal from '@pages/editor/structure/ContainerSelectorModal.jsx';

function Editor() {
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
    clearError,
    // CRUD Operations
    handleAddPage,
    handleAddSection,
    handleAddDiv,
    handleAddComponent,
    handleDeleteElement,
    // Component Selector
    showComponentSelector,
    handleComponentSelect,
    handleCloseComponentSelector,
    // Container Selector
    showContainerSelector,
    handleContainerSelect,
    handleCloseContainerSelector
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
          onAddPage={handleAddPage}
          onAddSection={handleAddSection}
          onAddDiv={handleAddDiv}
          onAddComponent={handleAddComponent}
          onDeleteElement={handleDeleteElement}
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

      <ComponentSelectorModal
        isOpen={showComponentSelector}
        onClose={handleCloseComponentSelector}
        onSelectComponent={handleComponentSelect}
      />

      <ContainerSelectorModal
        isOpen={showContainerSelector}
        onClose={handleCloseContainerSelector}
        onSelectContainer={handleContainerSelect}
      />
    </div>
  );
}

export default Editor;
