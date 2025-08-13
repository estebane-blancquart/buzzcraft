import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function useProjectActions() {
  const navigate = useNavigate();
  const hasLoadedOnce = useRef(false);
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterState, setFilterState] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Charger les projets au montage
  useEffect(() => {
    if (!hasLoadedOnce.current) {
      loadProjects();
      hasLoadedOnce.current = true;
    }
  }, []);

  const addConsoleMessage = (type, text) => {
    console.log('📝 ADD MESSAGE:', type, text);
    const message = {
      type,
      text,
      timestamp: new Date().toISOString()
    };
    setConsoleMessages(prev => {
      console.log('📝 CONSOLE MESSAGES LENGTH:', prev.length, '→', prev.length + 1);
      return [...prev, message];
    });
  };

  const clearConsole = () => {
    console.log('🗑️ CLEAR CONSOLE');
    setConsoleMessages([]);
  };

  const updateProjectState = (projectId, newState) => {
    console.log('🔄 OPTIMISTIC UPDATE:', projectId, '→', newState);
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId 
          ? { ...project, state: newState }
          : project
      )
    );
  };

  const getFilteredProjects = () => {
    let filtered = projects;
    
    if (filterState) {
      filtered = projects.filter(project => project.state === filterState);
      console.log('🔍 FILTER BY STATE:', filterState, '→', filtered.length, 'projets');
    }
    
    return filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
  };

  const handleStateFilter = (state) => {
    console.log('🔍 FILTER CHANGED:', filterState, '→', state);
    setFilterState(state);
    if (state) {
      addConsoleMessage('info', `Filtrage par état: ${state}`);
    } else {
      addConsoleMessage('info', 'Affichage de tous les projets');
    }
  };

  const loadProjects = async (silent = false) => {
    setLoading(true);
    console.log('📂 LOAD PROJECTS START, silent:', silent);
    
    try {
      console.log('Chargement des projets...');
      const response = await fetch('http://localhost:3000/projects');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('📂 PROJECTS LOADED:', data.projects.length);
        const sortedProjects = data.projects.sort((a, b) => new Date(b.created) - new Date(a.created));
        setProjects(sortedProjects);
        console.log(`${data.projects.length} projets chargés`);
        if (!silent) {
          addConsoleMessage('info', `Dashboard initialisé - ${data.projects.length} projets`);
        }
      } else {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur loadProjects:', error);
      addConsoleMessage('error', `Impossible de charger les projets: ${error.message}`);
    } finally {
      console.log('📂 LOAD PROJECTS END');
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
        addConsoleMessage('success', `Projet "${formData.name}" créé avec succès`);
        await loadProjects(true);
      } else {
        throw new Error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
      addConsoleMessage('error', `Création échouée: ${error.message}`);
      throw new Error(`Création échouée: ${error.message}`);
    }
  };

  const handleDeleteRequest = (projectId, projectName) => {
    console.log('🗑️ DELETE REQUEST for:', projectId);
    setProjectToDelete({ id: projectId, name: projectName });
    setShowConfirmModal(true);
  };

  const handleCancelDelete = () => {
    console.log('❌ DELETE CANCELLED');
    setShowConfirmModal(false);
    setProjectToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    
    console.log('💀 DELETE CONFIRMED for:', projectToDelete.id);
    setShowConfirmModal(false);
    
    await handleProjectAction(projectToDelete.id, 'DELETE');
    
    setProjectToDelete(null);
  };

  const executeDeleteAction = async (projectId) => {
    console.log('🗑️ EXECUTING DELETE for:', projectId);
    
    try {
      const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Suppression réussie:', data.message);
        addConsoleMessage('success', `Projet ${projectId} supprimé`);
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur DELETE:', error);
      addConsoleMessage('error', `Suppression échouée: ${error.message}`);
    }
  };

  const handleProjectAction = async (projectId, action) => {
    console.log('🔄 START ACTION:', action, 'sur', projectId);
    
    const actionKey = `${projectId}-${action}`;
    console.log('⏳ SET LOADING TRUE pour:', actionKey);
    setActionLoading(prev => {
      if (prev[actionKey] === true) {
        console.log('⏳ SKIP SET LOADING - déjà true');
        return prev;
      }
      const newState = { ...prev, [actionKey]: true };
      console.log('⏳ ACTION LOADING STATE:', newState);
      return newState;
    });
    
    try {
      if (action === 'EDIT') {
        console.log(`Navigation vers éditeur pour projet DRAFT: ${projectId}`);
        addConsoleMessage('info', `Ouverture éditeur pour projet ${projectId}`);
        navigate(`/editor/${projectId}`);
        return;
      }
      
      if (action === 'REVERT') {
        console.log(`Revert projet ${projectId}`);
        
        const response = await fetch(`http://localhost:3000/projects/${projectId}/revert`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur revert HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Revert réussi:', data.message);
          addConsoleMessage('success', `Projet ${projectId} remis en DRAFT`);
          updateProjectState(projectId, 'DRAFT');
        } else {
          throw new Error(data.error || 'Erreur lors du revert');
        }
        return;
      }

      if (action === 'UPDATE') {
        console.log(`Simulation blue-green deployment pour projet ${projectId}`);
        addConsoleMessage('info', `Démarrage mise à jour blue-green pour ${projectId}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Update blue-green simulé avec succès');
        addConsoleMessage('success', `Mise à jour blue-green terminée pour ${projectId}`);
      }

      if (action === 'DEPLOY') {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/deploy`, {
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
          console.log('Deploy réussi:', data.message);
          addConsoleMessage('success', `Projet ${projectId} déployé avec succès`);
          updateProjectState(projectId, 'OFFLINE');
        } else {
          throw new Error(data.error || 'Erreur lors du deploy');
        }
      }

      if (action === 'START') {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/start`, {
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
          console.log('Start réussi:', data.message);
          addConsoleMessage('success', `Services ${projectId} démarrés`);
          updateProjectState(projectId, 'ONLINE');
        } else {
          throw new Error(data.error || 'Erreur lors du start');
        }
      }

      if (action === 'STOP') {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/stop`, {
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
          console.log('Stop réussi:', data.message);
          addConsoleMessage('success', `Services ${projectId} arrêtés`);
          updateProjectState(projectId, 'OFFLINE');
        } else {
          throw new Error(data.error || 'Erreur lors du stop');
        }
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
          addConsoleMessage('success', `Projet ${projectId} compilé avec succès`);
          updateProjectState(projectId, 'BUILT');
        } else {
          throw new Error(data.error || 'Erreur lors du build');
        }
      }
      
      if (action === 'DELETE') {
        await executeDeleteAction(projectId);
        return;
      }
      
    } catch (error) {
      console.error(`Erreur action ${action}:`, error);
      addConsoleMessage('error', `${action} échoué: ${error.message}`);
    } finally {
      console.log('✅ SET LOADING FALSE pour:', actionKey);
      setActionLoading(prev => {
        if (prev[actionKey] === false) {
          console.log('✅ SKIP SET LOADING - déjà false');
          return prev;
        }
        const newState = { ...prev, [actionKey]: false };
        console.log('✅ ACTION LOADING FINAL STATE:', newState);
        return newState;
      });
      console.log('🔄 END ACTION:', action, 'sur', projectId);
    }
  };

  return {
    projects: getFilteredProjects(),
    allProjects: projects,
    loading,
    consoleMessages,
    actionLoading,
    showCreateModal,
    filterState,
    showConfirmModal,
    projectToDelete,
    handleNewProject,
    handleCloseModal,
    handleCreateProject,
    handleProjectAction,
    handleStateFilter,
    handleDeleteRequest,
    handleCancelDelete,
    handleConfirmDelete,
    clearConsole,
    loadProjects
  };
}