import React from 'react';

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
    return dateString; // Fallback si parsing échoue
  }
}

export default function ProjectList({ hookData }) {
  const { projects, loading, actionLoading, handleNewProject, handleProjectAction } = hookData;

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
              {project.state === 'DRAFT' && (
                <button 
                  onClick={() => handleProjectAction(project.id, 'EDIT')}
                  disabled={actionLoading[`${project.id}-EDIT`]}
                >
                  {actionLoading[`${project.id}-EDIT`] ? '...' : 'EDIT'}
                </button>
              )}

              {/* REVERT : seulement si BUILT */}
              {project.state === 'BUILT' && (
                <button 
                  onClick={() => handleProjectAction(project.id, 'REVERT')}
                  disabled={actionLoading[`${project.id}-REVERT`]}
                >
                  {actionLoading[`${project.id}-REVERT`] ? '...' : 'REVERT'}
                </button>
              )}

              {/* UPDATE : seulement si OFFLINE/ONLINE */}
              {['OFFLINE', 'ONLINE'].includes(project.state) && (
                <button 
                  onClick={() => handleProjectAction(project.id, 'UPDATE')}
                  disabled={actionLoading[`${project.id}-UPDATE`]}
                >
                  {actionLoading[`${project.id}-UPDATE`] ? '...' : 'UPDATE'}
                </button>
              )}

              {/* BUILD : seulement si DRAFT */}
              {project.state === 'DRAFT' && (
                <button 
                  onClick={() => handleProjectAction(project.id, 'BUILD')}
                  disabled={actionLoading[`${project.id}-BUILD`]}
                >
                  {actionLoading[`${project.id}-BUILD`] ? '...' : 'BUILD'}
                </button>
              )}

              {/* DEPLOY : seulement si BUILT */}
              {project.state === 'BUILT' && (
                <button 
                  onClick={() => handleProjectAction(project.id, 'DEPLOY')}
                  disabled={actionLoading[`${project.id}-DEPLOY`]}
                >
                  {actionLoading[`${project.id}-DEPLOY`] ? '...' : 'DEPLOY'}
                </button>
              )}

              {/* START : seulement si OFFLINE */}
              {project.state === 'OFFLINE' && (
                <button 
                  onClick={() => handleProjectAction(project.id, 'START')}
                  disabled={actionLoading[`${project.id}-START`]}
                >
                  {actionLoading[`${project.id}-START`] ? '...' : 'START'}
                </button>
              )}

              {/* STOP : seulement si ONLINE */}
              {project.state === 'ONLINE' && (
                <button 
                  onClick={() => handleProjectAction(project.id, 'STOP')}
                  disabled={actionLoading[`${project.id}-STOP`]}
                >
                  {actionLoading[`${project.id}-STOP`] ? '...' : 'STOP'}
                </button>
              )}

              {/* DELETE : toujours disponible */}
              <button 
                onClick={() => handleProjectAction(project.id, 'DELETE')}
                disabled={actionLoading[`${project.id}-DELETE`]}
              >
                {actionLoading[`${project.id}-DELETE`] ? '...' : 'DELETE'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}