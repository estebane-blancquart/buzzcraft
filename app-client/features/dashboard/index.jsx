import React from 'react';
import { useProjectActions } from './hooks/useProjectActions.js';
import ProjectStats from './modules/project-stats/index.jsx';
import ProjectList from './modules/project-list/index.jsx';
import CreateModal from './modules/create-modal/index.jsx';

export default function Dashboard() {
  const hookData = useProjectActions(); // Hook unique
  const { 
    error, 
    clearError,
    showCreateModal,
    handleCloseModal,
    handleCreateProject
  } = hookData;

  return (
    <div className="dashboard">
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      <ProjectStats hookData={hookData} />
      <ProjectList hookData={hookData} />
      
      <CreateModal 
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}