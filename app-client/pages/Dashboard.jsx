import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/*
 * FAIT QUOI : Dashboard principal - liste des projets avec actions
 * REÇOIT : Rien (page racine)
 * RETOURNE : JSX Dashboard
 * ERREURS : Gestion erreurs API avec feedback utilisateur
 */

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Charger les projets au démarrage
  useEffect(() => {
    loadProjects();
  }, []);

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const setProjectActionLoading = (projectId, isLoading) => {
    setActionLoading(prev => ({
      ...prev,
      [projectId]: isLoading
    }));
  };

  const loadProjects = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3000/projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.error || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      showError(`Erreur de chargement: ${error.message}`);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (projectId, action) => {
    setProjectActionLoading(projectId, true);
    setError(null);
    
    try {
      if (action === 'BUILD') {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/build`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        const result = await response.json();
        
        if (result.success) {
          await loadProjects(); // Recharger la liste
        } else {
          throw new Error(result.error || 'Build failed');
        }
      }
      
      if (action === 'EDIT' || action === 'REVERT') {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/revert`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
          await loadProjects(); // Recharger la liste
        } else {
          throw new Error(result.error || 'Revert failed');
        }
      }
      
      if (action === 'DELETE') {
        const confirmed = window.confirm(
          `Êtes-vous sûr de vouloir supprimer le projet ${projectId} ?\n\nCette action est irréversible.`
        );
        
        if (confirmed) {
          const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (result.success) {
            await loadProjects(); // Recharger la liste
          } else {
            throw new Error(result.error || 'Delete failed');
          }
        }
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      showError(`Erreur ${action}: ${error.message}`);
    } finally {
      setProjectActionLoading(projectId, false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Chargement des projets...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>BuzzCraft Dashboard</h1>
      
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}
      
      <Link to="/create">
        <button className="btn-primary">NEW PROJECT</button>
      </Link>

      <div className="projects">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>Aucun projet trouvé.</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project">
              <div className="project-info">
                <h3>{project.name}</h3>
                <p>
                  {project.id} • 
                  <span className={`status-badge ${project.state.toLowerCase()}`}>
                    {project.state}
                  </span>
                </p>
              </div>
              
              <div className="project-actions">
                {project.state === 'DRAFT' && (
                  <>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleAction(project.id, 'EDIT')}
                      disabled={actionLoading[project.id]}
                    >
                      {actionLoading[project.id] ? 'EDIT...' : 'EDIT'}
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => handleAction(project.id, 'BUILD')}
                      disabled={actionLoading[project.id]}
                    >
                      {actionLoading[project.id] ? 'BUILD...' : 'BUILD'}
                    </button>
                  </>
                )}
                
                {project.state === 'BUILT' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handleAction(project.id, 'EDIT')}
                    disabled={actionLoading[project.id]}
                  >
                    {actionLoading[project.id] ? 'EDIT...' : 'EDIT'}
                  </button>
                )}
                
                <button 
                  className="btn-danger"
                  onClick={() => handleAction(project.id, 'DELETE')}
                  disabled={actionLoading[project.id]}
                >
                  {actionLoading[project.id] ? 'DELETE...' : 'DELETE'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}