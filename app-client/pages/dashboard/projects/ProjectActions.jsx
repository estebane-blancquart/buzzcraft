import React from 'react';
import { PROJECT_STATES, PROJECT_ACTIONS } from '@config/constants.js';

/*
 * FAIT QUOI : Actions contextuelles projet (modal confirmation externalisée)
 * REÇOIT : project, onAction, onDeleteRequest, actionLoading
 * RETOURNE : Boutons d'action seulement
 * ERREURS : Défensif selon état projet
 */

function ProjectActions({ 
  project = {}, 
  onAction = () => {}, 
  onDeleteRequest = () => {},
  actionLoading = {} 
}) {
  const isActionLoading = (action) => {
    return actionLoading[`${project.id}-${action}`] || false;
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(project.id, action);
    }
  };

  const handleDeleteClick = () => {
    if (onDeleteRequest) {
      onDeleteRequest(project.id, project.name);
    }
  };

  const renderActionButtons = () => {
    const { state } = project;

    return (
      <div className="project-actions">
        {/* DRAFT: EDIT + BUILD */}
        {state === PROJECT_STATES.DRAFT && (
          <>
            <button 
              onClick={() => handleAction(PROJECT_ACTIONS.EDIT)} 
              disabled={isActionLoading(PROJECT_ACTIONS.EDIT)}
            >
              {isActionLoading(PROJECT_ACTIONS.EDIT) ? '...' : 'EDIT'}
            </button>
            <button 
              onClick={() => handleAction(PROJECT_ACTIONS.BUILD)}
              disabled={isActionLoading(PROJECT_ACTIONS.BUILD)}
            >
              {isActionLoading(PROJECT_ACTIONS.BUILD) ? '...' : 'BUILD'}
            </button>
          </>
        )}
        
        {/* BUILT: REVERT + DEPLOY */}
        {state === PROJECT_STATES.BUILT && (
          <>
            <button 
              onClick={() => handleAction(PROJECT_ACTIONS.REVERT)}
              disabled={isActionLoading(PROJECT_ACTIONS.REVERT)}
            >
              {isActionLoading(PROJECT_ACTIONS.REVERT) ? '...' : 'REVERT'}
            </button>
            <button 
              onClick={() => handleAction(PROJECT_ACTIONS.DEPLOY)}
              disabled={isActionLoading(PROJECT_ACTIONS.DEPLOY)}
            >
              {isActionLoading(PROJECT_ACTIONS.DEPLOY) ? '...' : 'DEPLOY'}
            </button>
          </>
        )}
        
        {/* OFFLINE: START + UPDATE */}
        {state === PROJECT_STATES.OFFLINE && (
          <>
            <button 
              onClick={() => handleAction(PROJECT_ACTIONS.START)}
              disabled={isActionLoading(PROJECT_ACTIONS.START)}
            >
              {isActionLoading(PROJECT_ACTIONS.START) ? '...' : 'START'}
            </button>
            <button 
              onClick={() => handleAction(PROJECT_ACTIONS.UPDATE)}
              disabled={isActionLoading(PROJECT_ACTIONS.UPDATE)}
            >
              {isActionLoading(PROJECT_ACTIONS.UPDATE) ? '...' : 'UPDATE'}
            </button>
          </>
        )}
        
        {/* ONLINE: STOP + UPDATE */}
        {state === PROJECT_STATES.ONLINE && (
          <>
            <button 
              onClick={() => handleAction(PROJECT_ACTIONS.STOP)}
              disabled={isActionLoading(PROJECT_ACTIONS.STOP)}
            >
              {isActionLoading(PROJECT_ACTIONS.STOP) ? '...' : 'STOP'}
            </button>
            <button 
              onClick={() => handleAction(PROJECT_ACTIONS.UPDATE)}
              disabled={isActionLoading(PROJECT_ACTIONS.UPDATE)}
            >
              {isActionLoading(PROJECT_ACTIONS.UPDATE) ? '...' : 'UPDATE'}
            </button>
          </>
        )}
        
        {/* DELETE: toujours disponible */}
        <button 
          className="delete-btn"
          onClick={handleDeleteClick}
          disabled={isActionLoading(PROJECT_ACTIONS.DELETE)}
        >
          {isActionLoading(PROJECT_ACTIONS.DELETE) ? '...' : 'DELETE'}
        </button>
      </div>
    );
  };

  return renderActionButtons();
}

export default ProjectActions;