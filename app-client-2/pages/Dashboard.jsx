import React from 'react';
import { useProjects } from '@hooks/useProjects.js';
import ProjectCard from '@modules/ProjectCard.jsx';
import Button from '@components/Button.jsx';

function Dashboard() {
  const { 
    projects, 
    loading, 
    handleNewProject, 
    handleProjectAction,
    handleDeleteRequest,
    actionLoading
  } = useProjects();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>BuzzCraft Dashboard v2</h1>
      
      <Button 
        variant="primary" 
        size="lg" 
        onClick={handleNewProject}
        style={{ width: '100%', marginBottom: '2rem' }}
      >
        NEW PROJECT
      </Button>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onAction={handleProjectAction}
            onDeleteRequest={handleDeleteRequest}
            actionLoading={actionLoading}
          />
        ))}
      </div>
      
      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Aucun projet. Créez-en un !
        </div>
      )}
    </div>
  );
}

export default Dashboard;
