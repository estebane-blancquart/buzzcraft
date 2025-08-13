import React from 'react';
import { PROJECT_STATES, PROJECT_ACTIONS } from '@config/constants.js';

// Fonction pour formatter les dates en français
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

export default function ProjectList({ hookData }) {
  const { 
    projects, 
    loading, 
    actionLoading, 
    handleNewProject, 
    handleProjectAction,
    handleDeleteRequest
  } = hookData;

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="project-list">
      <button 
        className="btn-primary" 
        onClick={() => {
          console.log('Bouton NEW PROJECT cliqué !');
          handleNewProject();
        }}
      >
        NEW PROJECT
      </button>

      <div className="projects-grid">
        {projects.map(project => (
          <div key={project.id} className="project-card">
            <div className="project-info">
              <div className="project-header">
                <h3>{project.name}</h3>
                <div className="project-meta">
                  <p>Créé le {formatDate(project.created)}</p>
                </div>
              </div>
              <span className="project-state" data-state={project.state}>
                {project.state}
              </span>
            </div>
            <div className="project-actions">
              {/* EDIT : seulement si DRAFT */}
              {project.state === PROJECT_STATES.DRAFT && (
                <button 
                  onClick={() => handleProjectAction(project.id, PROJECT_ACTIONS.EDIT)}
                  disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.EDIT}`]}
                >
                  {actionLoading[`${project.id}-${PROJECT_ACTIONS.EDIT}`] ? '...' : 'EDIT'}
                </button>
              )}

              {/* REVERT : seulement si BUILT */}
              {project.state === PROJECT_STATES.BUILT && (
                <button 
                  onClick={() => handleProjectAction(project.id, PROJECT_ACTIONS.REVERT)}
                  disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.REVERT}`]}
                >
                  {actionLoading[`${project.id}-${PROJECT_ACTIONS.REVERT}`] ? '...' : 'REVERT'}
                </button>
              )}

              {/* UPDATE : seulement si OFFLINE/ONLINE */}
              {[PROJECT_STATES.OFFLINE, PROJECT_STATES.ONLINE].includes(project.state) && (
                <button 
                  onClick={() => handleProjectAction(project.id, PROJECT_ACTIONS.UPDATE)}
                  disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`]}
                >
                  {actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`] ? '...' : 'UPDATE'}
                </button>
              )}

              {/* BUILD : seulement si DRAFT */}
              {project.state === PROJECT_STATES.DRAFT && (
                <button 
                  onClick={() => handleProjectAction(project.id, PROJECT_ACTIONS.BUILD)}
                  disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.BUILD}`]}
                >
                  {actionLoading[`${project.id}-${PROJECT_ACTIONS.BUILD}`] ? '...' : 'BUILD'}
                </button>
              )}

              {/* DEPLOY : seulement si BUILT */}
              {project.state === PROJECT_STATES.BUILT && (
                <button 
                  onClick={() => handleProjectAction(project.id, PROJECT_ACTIONS.DEPLOY)}
                  disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.DEPLOY}`]}
                >
                  {actionLoading[`${project.id}-${PROJECT_ACTIONS.DEPLOY}`] ? '...' : 'DEPLOY'}
                </button>
              )}

              {/* START : seulement si OFFLINE */}
              {project.state === PROJECT_STATES.OFFLINE && (
                <button 
                  onClick={() => handleProjectAction(project.id, PROJECT_ACTIONS.START)}
                  disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.START}`]}
                >
                  {actionLoading[`${project.id}-${PROJECT_ACTIONS.START}`] ? '...' : 'START'}
                </button>
              )}

              {/* STOP : seulement si ONLINE */}
              {project.state === PROJECT_STATES.ONLINE && (
                <button 
                  onClick={() => handleProjectAction(project.id, PROJECT_ACTIONS.STOP)}
                  disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.STOP}`]}
                >
                  {actionLoading[`${project.id}-${PROJECT_ACTIONS.STOP}`] ? '...' : 'STOP'}
                </button>
              )}

              {/* DELETE : toujours disponible - AVEC CONFIRMATION */}
              <button 
                onClick={() => handleDeleteRequest(project.id, project.name)}
                disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.DELETE}`]}
              >
                {actionLoading[`${project.id}-${PROJECT_ACTIONS.DELETE}`] ? '...' : 'DELETE'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}