import React from "react";
import { PROJECT_STATES, PROJECT_ACTIONS } from "@config/constants.js";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProjectCard({ project, onAction, onDeleteRequest, actionLoading }) {
  // Validation et debug du projet
  console.log('ProjectCard received project:', project);
  
  const handleAction = (action) => {
    console.log('ProjectCard handleAction called:', { 
      action, 
      projectId: project.id, 
      projectName: project.name,
      isValidId: project.id && project.id !== 'undefined'
    });
    
    // Validation de l'ID avant d'envoyer l'action
    if (!project.id || project.id === 'undefined') {
      console.error('ProjectCard: Invalid project ID, cannot perform action', { project, action });
      alert('Erreur: ID de projet invalide. Rechargez la page.');
      return;
    }
    
    if (onAction) {
      onAction(project.id, action);
    }
  };

  const handleDelete = () => {
    console.log('ProjectCard handleDelete called:', { 
      projectId: project.id, 
      projectName: project.name 
    });
    
    // Validation de l'ID avant suppression
    if (!project.id || project.id === 'undefined') {
      console.error('ProjectCard: Invalid project ID, cannot delete', project);
      alert('Erreur: ID de projet invalide. Rechargez la page.');
      return;
    }
    
    if (onDeleteRequest) {
      onDeleteRequest(project.id, project.name);
    }
  };

  // Garde-fou si le projet est invalide
  if (!project || !project.id || project.id === 'undefined') {
    console.warn('ProjectCard: Invalid project, not rendering', project);
    return (
      <div className="project-card invalid-project">
        <div className="project-info">
          <div className="project-header">
            <h3 className="project-name">Projet invalide</h3>
            <p className="project-meta">ID manquant ou corrompu</p>
          </div>
          <span className="project-state error">ERROR</span>
        </div>
        <div className="project-actions">
          <button disabled>Projet corrompu</button>
        </div>
      </div>
    );
  }

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
            <button
              onClick={() => handleAction(PROJECT_ACTIONS.EDIT)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.EDIT}`]}
            >
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.EDIT}`]
                ? "..."
                : "EDIT"}
            </button>
            <button
              onClick={() => handleAction(PROJECT_ACTIONS.BUILD)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.BUILD}`]}
            >
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.BUILD}`]
                ? "..."
                : "BUILD"}
            </button>
          </>
        )}

        {/* BUILT: REVERT + DEPLOY */}
        {project.state === PROJECT_STATES.BUILT && (
          <>
            <button
              onClick={() => handleAction(PROJECT_ACTIONS.REVERT)}
              disabled={
                actionLoading[`${project.id}-${PROJECT_ACTIONS.REVERT}`]
              }
            >
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.REVERT}`]
                ? "..."
                : "REVERT"}
            </button>
            <button
              onClick={() => handleAction(PROJECT_ACTIONS.DEPLOY)}
              disabled={
                actionLoading[`${project.id}-${PROJECT_ACTIONS.DEPLOY}`]
              }
            >
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.DEPLOY}`]
                ? "..."
                : "DEPLOY"}
            </button>
          </>
        )}

        {/* OFFLINE: START + UPDATE */}
        {project.state === PROJECT_STATES.OFFLINE && (
          <>
            <button
              onClick={() => handleAction(PROJECT_ACTIONS.START)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.START}`]}
            >
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.START}`]
                ? "..."
                : "START"}
            </button>
            <button
              onClick={() => handleAction(PROJECT_ACTIONS.UPDATE)}
              disabled={
                actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`]
              }
            >
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`]
                ? "..."
                : "UPDATE"}
            </button>
          </>
        )}

        {/* ONLINE: STOP + UPDATE */}
        {project.state === PROJECT_STATES.ONLINE && (
          <>
            <button
              onClick={() => handleAction(PROJECT_ACTIONS.STOP)}
              disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.STOP}`]}
            >
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.STOP}`]
                ? "..."
                : "STOP"}
            </button>
            <button
              onClick={() => handleAction(PROJECT_ACTIONS.UPDATE)}
              disabled={
                actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`]
              }
            >
              {actionLoading[`${project.id}-${PROJECT_ACTIONS.UPDATE}`]
                ? "..."
                : "UPDATE"}
            </button>
          </>
        )}

        {/* DELETE: toujours disponible */}
        <button
          className="delete-btn"
          onClick={handleDelete}
          disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.DELETE}`]}
        >
          {actionLoading[`${project.id}-${PROJECT_ACTIONS.DELETE}`]
            ? "..."
            : "DELETE"}
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;