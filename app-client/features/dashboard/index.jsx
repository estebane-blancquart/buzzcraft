import React from 'react';
import { useProjectActions } from './hooks/useProjectActions.js';
import ProjectStats from './modules/project-stats/index.jsx';
import ProjectList from './modules/project-list/index.jsx';

export default function Dashboard() {
  const { error, clearError } = useProjectActions();

  return (
    <div className="dashboard">
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      <ProjectStats />
      <ProjectList />
    </div>
  );
}