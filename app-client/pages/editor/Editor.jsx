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
          onAddComponent={editor.handleAddComponent}
          onDeleteElement={editor.handleDeleteElement}
        />

        <PreviewModule
          project={editor.project}
          device={editor.selectedDevice}
          selectedElement={editor.selectedElement}
          onElementSelect={editor.handleElementSelect}
        />

        <PropertiesModule
          selectedElement={editor.selectedElement}
          device={editor.selectedDevice}
          onElementUpdate={handleElementUpdate}
        />
      </div>
    </div>
  );
}

export default Editor;