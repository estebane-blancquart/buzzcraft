import React from 'react';
import { useEditor } from '@hooks/useEditor.js';
import { useWorkflows } from '@hooks/useWorkflows.js';
import ToolbarModule from '@pages/editor/toolbar/ToolbarModule.jsx';
import StructureModule from '@pages/editor/structure/StructureModule.jsx';
import PreviewModule from '@pages/editor/preview/PreviewModule.jsx';
import PropertiesModule from '@pages/editor/properties/PropertiesModule.jsx';

function Editor() {
  // Hooks métier
  const editor = useEditor();
  const workflows = useWorkflows();

  // Handler sauvegarde intégré
  const handleSave = async () => {
    try {
      await editor.saveProject();
      workflows.addConsoleMessage('success', 'Project saved successfully');
    } catch (error) {
      workflows.addConsoleMessage('error', `Save failed: ${error.message}`);
    }
  };

  // Handler mise à jour élément intégré
  const handleElementUpdate = (elementId, updates) => {
    editor.handleElementUpdate(elementId, updates);
    workflows.addConsoleMessage('info', `Element ${elementId} updated`);
  };

  if (editor.loading) {
    return (
      <div className="editor">
        <div className="loading">Chargement de l'éditeur...</div>
      </div>
    );
  }

  if (editor.error) {
    return (
      <div className="editor">
        <ToolbarModule
          project={null}
          onBackToDashboard={editor.handleBackToDashboard}
        />
        <div className="error-banner">
          <span>⚠️ {editor.error}</span>
          <button onClick={editor.clearError}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor">
      <ToolbarModule
        project={editor.project}
        selectedDevice={editor.selectedDevice}
        isDirty={editor.isDirty}
        onDeviceChange={editor.handleDeviceChange}
        onSave={handleSave}
        onBackToDashboard={editor.handleBackToDashboard}
      />

      <div className="editor-workspace">
        <StructureModule
          project={editor.project}
          selectedElement={editor.selectedElement}
          onElementSelect={editor.handleElementSelect}
          onAddPage={editor.handleAddPage}
          onAddSection={editor.handleAddSection}
          onAddDiv={editor.handleAddDiv}
          onDeleteElement={editor.handleDeleteElement}
          showComponentSelector={editor.showComponentSelector}
          showContainerSelector={editor.showContainerSelector}
          onComponentSelect={editor.handleComponentSelect}
          onContainerSelect={editor.handleContainerSelect}
          onCloseComponentSelector={editor.handleCloseComponentSelector}
          onCloseContainerSelector={editor.handleCloseContainerSelector}
        />

        <PreviewModule
          project={editor.project}
          selectedElement={editor.selectedElement}
          selectedDevice={editor.selectedDevice}
          onElementSelect={editor.handleElementSelect}
        />

        <PropertiesModule
          project={editor.project}
          selectedElement={editor.selectedElement}
          onElementUpdate={handleElementUpdate}
          templatesCache={editor.templatesCache}
        />
      </div>

      {/* Modals intégrés dans Editor */}
      {editor.showComponentSelector && (
        <div className="modal-overlay" onClick={editor.handleCloseComponentSelector}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Component Type</h3>
              <button onClick={editor.handleCloseComponentSelector} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="component-types">
                <button onClick={() => editor.onModalComponentSelect('heading')}>Heading</button>
                <button onClick={() => editor.onModalComponentSelect('paragraph')}>Paragraph</button>
                <button onClick={() => editor.onModalComponentSelect('button')}>Button</button>
                <button onClick={() => editor.onModalComponentSelect('image')}>Image</button>
                <button onClick={() => editor.onModalComponentSelect('link')}>Link</button>
                <button onClick={() => editor.onModalComponentSelect('input')}>Input</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editor.showContainerSelector && (
        <div className="modal-overlay" onClick={editor.handleCloseContainerSelector}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Container Type</h3>
              <button onClick={editor.handleCloseContainerSelector} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="container-types">
                <button onClick={() => editor.onModalContainerSelect('div')}>Div Container</button>
                <button onClick={() => editor.onModalContainerSelect('list')}>List Container</button>
                <button onClick={() => editor.onModalContainerSelect('form')}>Form Container</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Editor;