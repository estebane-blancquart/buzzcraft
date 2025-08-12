import React, { useMemo } from 'react';
import { useProjectActions } from './hooks/useProjectActions.js';
import ProjectStats from './modules/project-stats/index.jsx';
import ProjectList from './modules/project-list/index.jsx';
import CreateModal from './modules/create-modal/index.jsx';
import Console from './modules/console/index.jsx';

export default function Dashboard() {
  const hookData = useProjectActions(); // Hook unique
  const { 
    consoleMessages,
    clearConsole,
    showCreateModal,
    handleCloseModal,
    handleCreateProject,
    filterState
  } = hookData;

  // DEBUG: Log chaque render du Dashboard
  console.log('🖼️ DASHBOARD RENDER - messages:', consoleMessages.length, 'modal:', showCreateModal, 'filter:', filterState);

  // Memoize console messages pour éviter re-renders inutiles
  const memoizedMessages = useMemo(() => consoleMessages, [consoleMessages.length]);

  return (
    <div className="dashboard">
      <ProjectStats hookData={hookData} />
      <ProjectList hookData={hookData} />
      
      {/* Console avec messages memoized */}
      <Console 
        messages={memoizedMessages}
        onClear={clearConsole}
      />
      
      <CreateModal 
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}