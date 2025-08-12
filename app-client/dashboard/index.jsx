import React from 'react';
import { useProjectActions } from './hooks/useProjectActions';
import StatsBar from './components/StatsBar';
import ProjectCard from './components/ProjectCard';

/*
 * FAIT QUOI : Page dashboard - rendu uniquement
 * REÇOIT : Rien (page racine)
 * RETOURNE : JSX dashboard propre
 */

export default function Dashboard() {
  const {
    projects,
    loading,
    error,
    actionLoading,
    handleNewProject,
    handleProjectAction,
    clearError
  } = useProjectActions();

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      {/* Stats des projets */}
      <StatsBar projects={projects} />

      {/* Bouton création */}
      <button className="new-project-button" onClick={handleNewProject}>
        NEW PROJECT
      </button>

      {/* Liste des projets */}
      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>Aucun projet trouvé.</p>
          </div>
        ) : (
          projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onAction={handleProjectAction}
              isLoading={actionLoading[project.id]}
            />
          ))
        )}
      </div>
    </div>
  );
}