import React from 'react';

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
                  <p>{project.created}</p>
                </div>
              </div>
              <span className="project-state" data-state={project.state}>
                {project.state}
              </span>
            </div>
            <div className="project-actions">
              <button 
                onClick={() => handleProjectAction(project.id, 'EDIT')}
                disabled={actionLoading[`${project.id}-EDIT`]}
              >
                {actionLoading[`${project.id}-EDIT`] ? '...' : 'EDIT'}
              </button>
              <button 
                onClick={() => handleProjectAction(project.id, 'BUILD')}
                disabled={actionLoading[`${project.id}-BUILD`]}
              >
                {actionLoading[`${project.id}-BUILD`] ? '...' : 'BUILD'}
              </button>
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