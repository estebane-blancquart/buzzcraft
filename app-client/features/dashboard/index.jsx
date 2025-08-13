import React, { useMemo } from 'react';
import { useProjectActions } from './hooks/useProjectActions.js';
import ProjectStats from './modules/project-stats/index.jsx';
import ProjectList from './modules/project-list/index.jsx';
import CreateModal from './modules/create-modal/index.jsx';
import ConfirmModal from './modules/confirm-modal/index.jsx';
import Console from './modules/console/index.jsx';

export default function Dashboard() {
  const hookData = useProjectActions();
  const { 
    consoleMessages,
    clearConsole,
    showCreateModal,
    handleCloseModal,
    handleCreateProject,
    filterState,
    showConfirmModal,
    projectToDelete,
    handleCancelDelete,
    handleConfirmDelete
  } = hookData;

  console.log('🖼️ DASHBOARD RENDER - messages:', consoleMessages.length, 'modal:', showCreateModal, 'filter:', filterState);

  const memoizedMessages = useMemo(() => consoleMessages, [consoleMessages.length]);

  return (
    <div className="dashboard">
      <ProjectStats hookData={hookData} />
      <ProjectList hookData={hookData} />
      
      <Console 
        messages={memoizedMessages}
        onClear={clearConsole}
      />
      
      <CreateModal 
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
      />
      
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Supprimer le projet"
        message={`Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        loading={false}
      />
    </div>
  );
}