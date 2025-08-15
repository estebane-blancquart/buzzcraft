import React from 'react';
import styles from './ProjectCard.module.scss';
import { PROJECT_STATES, PROJECT_ACTIONS } from '@config/constants.js';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function ProjectCard({ project, onAction, onDeleteRequest, actionLoading }) {
  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <div className={styles.header}>
          <h3 className={styles.name}>{project.name}</h3>
          <p className={styles.meta}>Créé le {formatDate(project.created)}</p>
        </div>
        <span className={`${styles.state} ${styles[project.state.toLowerCase()]}`}>
          {project.state}
        </span>
      </div>
      <div className={styles.actions}>
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
        <button onClick={() => onDeleteRequest(project.id, project.name)}
          disabled={actionLoading[`${project.id}-${PROJECT_ACTIONS.DELETE}`]} className={styles.deleteBtn}>
          {actionLoading[`${project.id}-${PROJECT_ACTIONS.DELETE}`] ? '...' : 'DELETE'}
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;
