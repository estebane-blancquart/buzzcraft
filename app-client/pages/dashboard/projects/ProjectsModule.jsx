import React from 'react';
import NewProjectButton from './NewProjectButton.jsx';
import ProjectCard from './ProjectCard.jsx';

/*
 * FAIT QUOI : Container qui orchestre NewProjectButton + liste ProjectCard
 * REÇOIT : projects, onNewProject, onAction, onDeleteRequest, actionLoading, filterState
 * RETOURNE : Module complet gestion projets
 * ERREURS : Défensif avec projets vides
 */

function ProjectsModule({ 
  projects = [], 
  onNewProject = () => {}, 
  onAction = () => {},
  onDeleteRequest = () => {},
  actionLoading = {},
  filterState = null
}) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="project-list">
      <NewProjectButton onClick={onNewProject} />

      <div className="projects-grid">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onAction={onAction}
            onDeleteRequest={onDeleteRequest}
            actionLoading={actionLoading}
            formatDate={formatDate}
          />
        ))}
        
        {projects.length === 0 && (
          <div className="empty-projects">
            {filterState 
              ? `Aucun projet ${filterState}` 
              : 'Aucun projet. Créez-en un !'
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsModule;