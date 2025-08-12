import React from 'react';
import { useProjectActions } from '../../hooks/useProjectActions.js';

export default function ProjectList() {
  const { projects, loading, handleNewProject, handleProjectAction } = useProjectActions();

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="project-list">
      <button className="btn-primary" onClick={handleNewProject}>
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
              <button onClick={() => handleProjectAction(project.id, 'EDIT')}>
                EDIT
              </button>
              <button onClick={() => handleProjectAction(project.id, 'BUILD')}>
                BUILD
              </button>
              <button onClick={() => handleProjectAction(project.id, 'DELETE')}>
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}