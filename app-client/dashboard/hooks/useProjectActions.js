import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/*
 * FAIT QUOI : Hook pour toute la logique Dashboard
 * REÇOIT : Rien
 * RETOURNE : { projects, loading, error, actions }
 */

export function useProjectActions() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadProjects();
  }, []);

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
      setError(`Erreur de chargement: ${error.message}`);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    navigate('/create');
  };

  const setProjectActionLoading = (projectId, isLoading) => {
    setActionLoading(prev => ({
      ...prev,
      [projectId]: isLoading
    }));
  };

  const handleProjectAction = async (projectId, action) => {
    setProjectActionLoading(projectId, true);
    setError(null);
    
    try {
      let response;
      
      switch (action) {
        case 'EDIT':
          // Si projet BUILT, le remettre en DRAFT d'abord
          const project = projects.find(p => p.id === projectId);
          if (project && project.state === 'BUILT') {
            response = await fetch(`http://localhost:3000/projects/${projectId}/revert`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            if (!result.success) {
              throw new Error(result.error || 'Revert failed');
            }
            
            // Recharger les données pour voir le changement d'état
            await loadProjects();
          }
          
          // Puis naviguer vers l'éditeur
          navigate(`/editor/${projectId}`);
          return;
          
        case 'BUILD':
          response = await fetch(`http://localhost:3000/projects/${projectId}/build`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          break;
          
        case 'DELETE':
          const confirmed = window.confirm(`Supprimer ${projectId} ?`);
          if (!confirmed) return;
          
          response = await fetch(`http://localhost:3000/projects/${projectId}`, {
            method: 'DELETE'
          });
          break;
          
        default:
          console.log(`${action} not implemented yet`);
          return;
      }
      
      if (response) {
        const result = await response.json();
        
        if (result.success) {
          await loadProjects();
        } else {
          throw new Error(result.error || `${action} failed`);
        }
      }
      
    } catch (error) {
      console.error(`${action} error:`, error);
      setError(`Erreur ${action}: ${error.message}`);
    } finally {
      setProjectActionLoading(projectId, false);
    }
  };

  const clearError = () => setError(null);

  return {
    // State
    projects,
    loading,
    error,
    actionLoading,
    
    // Actions
    handleNewProject,
    handleProjectAction,
    clearError
  };
}