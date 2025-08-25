import { useState, useEffect, useRef } from 'react';
import { apiUrl } from '@config/api.js';
import { PROJECT_STATES, PROJECT_ACTIONS, MESSAGE_TYPES } from '@config/constants.js';

/*
 * FAIT QUOI : Gestion workflows et communications API centralisées
 * REÇOIT : Rien (hook autonome)
 * RETOURNE : États techniques et fonctions API
 * ERREURS : Gérées avec states d'erreur
 */

export function useWorkflows() {
  const hasLoadedOnce = useRef(false);
  
  // États techniques API
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  // Charger les projets au montage
  useEffect(() => {
    if (!hasLoadedOnce.current) {
      loadProjects();
      hasLoadedOnce.current = true;
    }
  }, []);

  // Gestion console
  const addConsoleMessage = (type, text) => {
    console.log('📝 ADD MESSAGE:', type, text);
    const message = {
      type,
      text,
      timestamp: new Date().toISOString()
    };
    setConsoleMessages(prev => [...prev, message]);
  };

  const clearConsole = () => {
    console.log('🗑️ CLEAR CONSOLE');
    setConsoleMessages([]);
  };

  // Mise à jour optimiste état projet
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

  // Chargement projets
  const loadProjects = async (silent = false) => {
    setLoading(true);
    console.log('📂 LOAD PROJECTS START, silent:', silent);
    
    try {
      console.log('Chargement des projets...');
      const response = await fetch(apiUrl('projects'));
      
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
          addConsoleMessage(MESSAGE_TYPES.INFO, `Dashboard initialisé - ${data.projects.length} projets`);
        }
      } else {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur loadProjects:', error);
      addConsoleMessage(MESSAGE_TYPES.ERROR, `Impossible de charger les projets: ${error.message}`);
    } finally {
      console.log('📂 LOAD PROJECTS END');
      setLoading(false);
    }
  };

  // Création projet
  const createProject = async (formData) => {
    console.log('Création projet via API:', formData);
    
    try {
      const response = await fetch(apiUrl('projects'), {
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
        addConsoleMessage(MESSAGE_TYPES.SUCCESS, `Projet "${formData.name}" créé avec succès`);
        await loadProjects(true);
      } else {
        throw new Error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
      addConsoleMessage(MESSAGE_TYPES.ERROR, `Création échouée: ${error.message}`);
      throw new Error(`Création échouée: ${error.message}`);
    }
  };

  // Suppression projet
  const deleteProject = async (projectId) => {
    console.log('🗑️ EXECUTING DELETE for:', projectId);
    
    try {
      const response = await fetch(apiUrl(`projects/${projectId}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Suppression réussie:', data.message);
        addConsoleMessage(MESSAGE_TYPES.SUCCESS, `Projet ${projectId} supprimé`);
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur DELETE:', error);
      addConsoleMessage(MESSAGE_TYPES.ERROR, `Suppression échouée: ${error.message}`);
    }
  };

  // Exécution action projet
  const executeProjectAction = async (projectId, action) => {
    console.log('🔄 START ACTION:', action, 'sur', projectId);
    
    const actionKey = `${projectId}-${action}`;
    console.log('⏳ SET LOADING TRUE pour:', actionKey);
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      if (action === PROJECT_ACTIONS.UPDATE) {
        console.log(`Simulation blue-green deployment pour projet ${projectId}`);
        addConsoleMessage(MESSAGE_TYPES.INFO, `Démarrage mise à jour blue-green pour ${projectId}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Update blue-green simulé avec succès');
        addConsoleMessage(MESSAGE_TYPES.SUCCESS, `Mise à jour blue-green terminée pour ${projectId}`);
        return;
      }

      if (action === PROJECT_ACTIONS.REVERT) {
        console.log(`Revert projet ${projectId}`);
        
        const response = await fetch(apiUrl(`projects/${projectId}/revert`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Erreur revert HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Revert réussi:', data.message);
          addConsoleMessage(MESSAGE_TYPES.SUCCESS, `Projet ${projectId} remis en DRAFT`);
          updateProjectState(projectId, PROJECT_STATES.DRAFT);
        } else {
          throw new Error(data.error || 'Erreur lors du revert');
        }
        return;
      }

      // Actions standard avec endpoints
      const endpoints = {
        [PROJECT_ACTIONS.BUILD]: `projects/${projectId}/build`,
        [PROJECT_ACTIONS.DEPLOY]: `projects/${projectId}/deploy`,
        [PROJECT_ACTIONS.START]: `projects/${projectId}/start`,
        [PROJECT_ACTIONS.STOP]: `projects/${projectId}/stop`
      };

      const stateTransitions = {
        [PROJECT_ACTIONS.BUILD]: PROJECT_STATES.BUILT,
        [PROJECT_ACTIONS.DEPLOY]: PROJECT_STATES.OFFLINE,
        [PROJECT_ACTIONS.START]: PROJECT_STATES.ONLINE,
        [PROJECT_ACTIONS.STOP]: PROJECT_STATES.OFFLINE
      };

      const endpoint = endpoints[action];
      const newState = stateTransitions[action];

      if (endpoint && newState) {
        const response = await fetch(apiUrl(endpoint), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log(`${action} réussi:`, data.message);
          addConsoleMessage(MESSAGE_TYPES.SUCCESS, data.message);
          updateProjectState(projectId, newState);
        } else {
          throw new Error(data.error || `Erreur lors du ${action}`);
        }
      }
      
    } catch (error) {
      console.error(`Erreur action ${action}:`, error);
      addConsoleMessage(MESSAGE_TYPES.ERROR, `${action} échoué: ${error.message}`);
    } finally {
      console.log('✅ SET LOADING FALSE pour:', actionKey);
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
      console.log('🔄 END ACTION:', action, 'sur', projectId);
    }
  };

  return {
    // États
    projects,
    loading,
    consoleMessages,
    actionLoading,
    
    // Fonctions API
    loadProjects,
    createProject,
    deleteProject,
    executeProjectAction,
    
    // Console
    addConsoleMessage,
    clearConsole,
    
    // Utils
    updateProjectState
  };
}