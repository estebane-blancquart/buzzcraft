import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useProjectActions() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Charger les projets au montage
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Chargement des projets...');
      const response = await fetch('http://localhost:3000/projects');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
        console.log(`${data.projects.length} projets chargés`);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur loadProjects:', error);
      setError(`Impossible de charger les projets: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    console.log('Ouverture modal création');
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    console.log('Fermeture modal');
    setShowCreateModal(false);
  };

  const handleCreateProject = async (formData) => {
    console.log('Création projet via API:', formData);
    
    try {
      const response = await fetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: formData.projectId,
          config: {
            name: formData.name,
            template: formData.template
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Projet créé avec succès:', data.message);
        // Recharger la liste des projets
        await loadProjects();
      } else {
        throw new Error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
      throw new Error(`Création échouée: ${error.message}`);
    }
  };

  const handleProjectAction = async (projectId, action) => {
    console.log(`Action ${action} sur projet ${projectId}`);
    
    const actionKey = `${projectId}-${action}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      if (action === 'EDIT') {
        // Trouver l'état du projet
        const project = projects.find(p => p.id === projectId);
        
        if (project && project.state !== 'DRAFT') {
          // Si pas DRAFT, faire revert d'abord
          console.log(`Revert ${projectId} de ${project.state} vers DRAFT`);
          
          const revertResponse = await fetch(`http://localhost:3000/projects/${projectId}/revert`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!revertResponse.ok) {
            throw new Error(`Erreur revert HTTP: ${revertResponse.status}`);
          }

          const revertData = await revertResponse.json();
          
          if (revertData.success) {
            console.log('Revert réussi:', revertData.message);
            // Recharger la liste pour voir l'état DRAFT
            await loadProjects();
          } else {
            throw new Error(revertData.error || 'Erreur lors du revert');
          }
        }
        
        // Naviguer vers l'éditeur (que ce soit DRAFT original ou après revert)
        navigate(`/editor/${projectId}`);
        return;
      }
      
      if (action === 'BUILD') {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/build`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Build réussi:', data.message);
          // Recharger la liste pour avoir l'état à jour
          await loadProjects();
        } else {
          throw new Error(data.error || 'Erreur lors du build');
        }
      }
      
      if (action === 'DELETE') {
        const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Suppression réussie:', data.message);
          // Recharger la liste
          await loadProjects();
        } else {
          throw new Error(data.error || 'Erreur lors de la suppression');
        }
      }
      
    } catch (error) {
      console.error(`Erreur action ${action}:`, error);
      setError(`${action} échoué: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const clearError = () => setError(null);

  return {
    projects,
    loading,
    error,
    actionLoading,
    showCreateModal,
    handleNewProject,
    handleCloseModal,
    handleCreateProject,
    handleProjectAction,
    clearError,
    loadProjects
  };
}