import React from 'react';

/*
 * FAIT QUOI : Card d'un projet avec actions selon état
 * REÇOIT : project: object, onAction: function, isLoading: boolean
 * RETOURNE : JSX card projet avec boutons dynamiques
 */

export default function ProjectCard({ project, onAction, isLoading = false }) {

  // Actions disponibles selon l'état
  const getAvailableActions = (state) => {
    switch (state) {
      case 'DRAFT':
        return [
          { action: 'EDIT', label: 'EDIT', style: 'secondary' },
          { action: 'BUILD', label: 'BUILD', style: 'primary' },
          { action: 'DELETE', label: 'DELETE', style: 'danger' }
        ];
      case 'BUILT':
        return [
          { action: 'EDIT', label: 'EDIT', style: 'secondary' },
          { action: 'DEPLOY', label: 'DEPLOY', style: 'primary' },
          { action: 'DELETE', label: 'DELETE', style: 'danger' }
        ];
      case 'OFFLINE':
        return [
          { action: 'UPDATE', label: 'UPDATE', style: 'secondary' },
          { action: 'START', label: 'START', style: 'primary' },
          { action: 'DELETE', label: 'DELETE', style: 'danger' }
        ];
      case 'ONLINE':
        return [
          { action: 'UPDATE', label: 'UPDATE', style: 'secondary' },
          { action: 'STOP', label: 'STOP', style: 'warning' },
          { action: 'DELETE', label: 'DELETE', style: 'danger' }
        ];
      default:
        return [{ action: 'DELETE', label: 'DELETE', style: 'danger' }];
    }
  };

  const handleActionClick = (action) => {
    if (isLoading) return;
    onAction(project.id, action);
  };

  return (
    <div className="project-card">
      <div className="project-info">
        <div className="project-name">{project.name}</div>
        <div className="project-meta">
          <span className="project-id">{project.id}</span>
          <span className="project-date">
            {new Date(project.created).toLocaleDateString()}
          </span>
        </div>
        <div className={`project-status status-${project.state.toLowerCase()}`}>
          {project.state}
        </div>
      </div>
      
      <div className="project-actions">
        {getAvailableActions(project.state).map(({ action, label, style }) => (
          <button
            key={action}
            className={`btn-${style}`}
            onClick={() => handleActionClick(action)}
            disabled={isLoading}
          >
            {isLoading ? `${label}...` : label}
          </button>
        ))}
      </div>
    </div>
  );
}