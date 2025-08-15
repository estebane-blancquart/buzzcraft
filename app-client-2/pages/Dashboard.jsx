import React, { useMemo } from 'react';
import { useProjects } from '@hooks/useProjects.js';
import ProjectStats from '@modules/ProjectStats.jsx';
import ProjectCard from '@modules/ProjectCard.jsx';
import Console from '@modules/Console.jsx';
import CreateModal from '@modules/CreateModal.jsx';
import ConfirmModal from '@modules/ConfirmModal.jsx';
import Button from '@components/Button.jsx';

function Dashboard() {
  const { 
    projects,
    allProjects,
    loading,
    consoleMessages,
    filterState,
    handleNewProject, 
    handleProjectAction,
    handleDeleteRequest,
    handleCloseModal,
    handleCreateProject,
    handleCancelDelete,
    handleConfirmDelete,
    handleStateFilter,
    clearConsole,
    actionLoading,
    showCreateModal,
    showConfirmModal,
    projectToDelete
  } = useProjects();

  const memoizedMessages = useMemo(() => consoleMessages, [consoleMessages.length]);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard">
      <ProjectStats 
        projects={allProjects}
        filterState={filterState}
        onStateFilter={handleStateFilter}
      />
      
      <div className="project-list">
        <button 
          className="btn-primary"
          onClick={handleNewProject}
        >
          NEW PROJECT
        </button>

        <div className="projects-grid">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onAction={handleProjectAction}
              onDeleteRequest={handleDeleteRequest}
              actionLoading={actionLoading}
            />
          ))}
          
          {projects.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic'
            }}>
              {filterState ? `Aucun projet ${filterState}` : 'Aucun projet. Créez-en un !'}
            </div>
          )}
        </div>
      </div>

      <Console 
        messages={memoizedMessages}
        onClear={clearConsole}
      />

      <CreateModal 
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
      />
      
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Supprimer le projet"
        message={`Êtes-vous sûr de vouloir supprimer "${projectToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        loading={actionLoading[`${projectToDelete?.id}-DELETE`]}
      />
    </div>
  );
}

export default Dashboard;
