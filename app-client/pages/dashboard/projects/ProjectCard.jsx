import React from 'react';
import { PROJECT_STATES, PROJECT_ACTIONS } from '@config/constants.js';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function ProjectCard({ project, onAction, onDeleteRequest, actionLoading }) {
  return (
    <div className="project-card">
      <div className="project-info">
        <div className="project-header">
          <h3 className="project-name">{project.name}</h3>
          <p className="project-meta">Créé le {formatDate(project.created)}</p>
        </div>
        <span className={`project-state ${project.state.toLowerCase()}`}>
          {project.state}
        </span>
      </div>
      <div className="project-actions">
        {/* DRAFT: EDIT + BUILD */}
        {project.state === PROJECT_STATES.DRAFT && (
          <>
            <button onClick={() => onAction(project.id, PROJECT_ACTIONS.EDIT)} 
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.EDIT}`]}>
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.EDIT}`] ? '...' : 'EDIT'}
            </button>
            <button onClick={() => onAction(project.id, PROJECT_ACTIONS.BUILD)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.BUILD}`]}>
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.BUILD}`] ? '...' : 'BUILD'}
            </button>
          </>
        )}
        
        {/* BUILT: REVERT + DEPLOY */}
        {project.state === PROJECT_STATES.BUILT && (
          <>
            <button onClick={() => onAction(project.id, PROJECT_ACTIONS.REVERT)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.REVERT}`]}>
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.REVERT}`] ? '...' : 'REVERT'}
            </button>
            <button onClick={() => onAction(project.id, PROJECT_ACTIONS.DEPLOY)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.DEPLOY}`]}>
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.DEPLOY}`] ? '...' : 'DEPLOY'}
            </button>
          </>
        )}
        
        {/* OFFLINE: START + UPDATE */}
        {project.state === PROJECT_STATES.OFFLINE && (
          <>
            <button onClick={() => onAction(project.id, PROJECT_ACTIONS.START)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.START}`]}>
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.START}`] ? '...' : 'START'}
            </button>
            <button onClick={() => onAction(project.id, PROJECT_ACTIONS.UPDATE)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`]}>
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`] ? '...' : 'UPDATE'}
            </button>
          </>
        )}
        
        {/* ONLINE: STOP + UPDATE */}
        {project.state === PROJECT_STATES.ONLINE && (
          <>
            <button onClick={() => onAction(project.id, PROJECT_ACTIONS.STOP)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.STOP}`]}>
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.STOP}`] ? '...' : 'STOP'}
            </button>
            <button onClick={() => onAction(project.id, PROJECT_ACTIONS.UPDATE)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`]}>
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`] ? '...' : 'UPDATE'}
            </button>
          </>
        )}
        
        {/* DELETE: toujours disponible */}
        <button className="delete-btn" onClick={() => onDeleteRequest(project.id, project.name)}
          disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.DELETE}`]}>
          {actionLoading[`${project.id}-${PROJECT_ACTIONS.DELETE}`] ? '...' : 'DELETE'}
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;