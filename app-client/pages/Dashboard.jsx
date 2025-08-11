import React, { useState, useEffect } from 'react';

/*
 * FAIT QUOI : Dashboard principal - liste des projets avec actions
 * REÇOIT : Rien (page racine)
 * RETOURNE : JSX Dashboard
 * ERREURS : Gestion erreurs API
 */

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les projets au démarrage
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('http://localhost:3000/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]); // Fallback si API indispo
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (projectId, action) => {
    console.log(`Action ${action} on project ${projectId}`);
    
    if (action === 'BUILD') {
      try {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/build`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Build success:', result);
          loadProjects(); // Recharger la liste
        } else {
          console.error('Build failed:', response.status);
        }
      } catch (error) {
        console.error('Build error:', error);
      }
    }
    
    if (action === 'EDIT' || action === 'REVERT') {
      try {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/revert`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Revert success:', result);
          loadProjects(); // Recharger la liste
        } else {
          console.error('Revert failed:', response.status);
        }
      } catch (error) {
        console.error('Revert error:', error);
      }
    }
    
    if (action === 'DELETE') {
      const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le projet ${projectId} ? Cette action est irréversible.`);
      
      if (confirmed) {
        try {
          const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Delete success:', result);
            loadProjects(); // Recharger la liste
          } else {
            console.error('Delete failed:', response.status);
          }
        } catch (error) {
          console.error('Delete error:', error);
        }
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>BuzzCraft Dashboard</h1>
      
      <button onClick={() => console.log('New project')}>
        NEW PROJECT
      </button>

      <div className="projects">
        {projects.map(project => (
          <div key={project.id} className="project">
            <div className="project-info">
              <h3>{project.name}</h3>
              <p>{project.id} • {project.state}</p>
            </div>
            
            <div className="project-actions">
              {project.state === 'DRAFT' && (
                <>
                  <button onClick={() => handleAction(project.id, 'EDIT')}>
                    EDIT
                  </button>
                  <button onClick={() => handleAction(project.id, 'BUILD')}>
                    BUILD
                  </button>
                </>
              )}
              
              {project.state === 'BUILT' && (
                <button onClick={() => handleAction(project.id, 'EDIT')}>
                  EDIT
                </button>
              )}
              
              <button onClick={() => handleAction(project.id, 'DELETE')}>
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}