import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook useWorkflows avec logs unifiés et gestion loading/polling corrigée
 */
export function useWorkflows() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState([]);
  
  // Utiliser useRef pour éviter les multiples instances de polling
  const pollingIntervalRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  /**
   * Ajoute un message à la console avec format unifié
   */
  const addConsoleMessage = useCallback((type, text, metadata = {}) => {
    if (!isComponentMountedRef.current) return;
    
    const timestamp = new Date().toISOString();
    const workflowId = metadata.workflowId ? ` | Workflow: ${metadata.workflowId}` : '';
    const duration = metadata.duration ? ` | Duration: ${metadata.duration}ms` : '';
    
    const message = {
      type,
      text: `${text}${workflowId}${duration}`,
      timestamp,
      ...metadata
    };

    setConsoleMessages(prev => {
      const newMessages = [...prev, message];
      return newMessages.slice(-100); // Limite à 100 messages
    });
  }, []);

  /**
   * Execute une action de projet avec gestion loading corrigée
   */
  const executeProjectAction = useCallback(async (projectId, action, config = {}) => {
    if (loading) {
      console.log('[useWorkflows] Action already in progress, skipping');
      return;
    }

    const actionStart = Date.now();
    
    try {
      addConsoleMessage('info', `[WORKFLOW] Starting ${action}`, { projectId });
      setLoading(true);

      const endpoint = getActionEndpoint(projectId, action);
      const response = await fetch(endpoint, {
        method: getActionMethod(action),
        headers: {
          'Content-Type': 'application/json',
        },
        body: Object.keys(config).length > 0 ? JSON.stringify(config) : undefined,
      });

      const result = await response.json();
      const duration = Date.now() - actionStart;

      if (result.workflowId) {
        if (result.success) {
          addConsoleMessage('success', 
            `[WORKFLOW] ${action} completed successfully`, 
            { 
              workflowId: result.workflowId,
              projectId,
              duration: result.duration || duration
            }
          );
        } else {
          if (result.error === 'NOT_IMPLEMENTED') {
            addConsoleMessage('info', 
              `[WORKFLOW] ${result.message}`, 
              { 
                workflowId: result.workflowId,
                projectId,
                planned: result.details?.version
              }
            );
          } else {
            addConsoleMessage('error', 
              `[WORKFLOW] ${action} failed: ${result.message || result.error}`,
              { 
                workflowId: result.workflowId,
                projectId,
                failedAt: result.failedAt,
                duration
              }
            );
          }
        }
      }

      // Refresh projects après action - avec délai pour laisser le serveur se stabiliser
      // Refresh projects silently after action
      setTimeout(async () => {
        if (isComponentMountedRef.current) {
          await loadProjects();
        }
      }, 1000); // Wait 1s before refresh
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - actionStart;
      addConsoleMessage('error', 
        `[WORKFLOW] ${action} network error: ${error.message}`,
        { projectId, duration }
      );
      throw error;
    } finally {
      // CRITIQUE: Toujours désactiver loading, même en cas d'erreur
      if (isComponentMountedRef.current) {
        setLoading(false);
      }
    }
  }, [addConsoleMessage, loading]);

  /**
   * Charge la liste des projets
   */
  const loadProjects = useCallback(async () => {
    if (!isComponentMountedRef.current) return;
    
    try {
      const response = await fetch('http://localhost:3000/projects');
      const result = await response.json();
      
      if (result.success && isComponentMountedRef.current) {
        setProjects(result.data.projects || []);
      } else if (isComponentMountedRef.current) {
        addConsoleMessage('error', `[API] Failed to load projects: ${result.error}`);
      }
    } catch (error) {
      if (isComponentMountedRef.current) {
        addConsoleMessage('error', `[API] Network error loading projects: ${error.message}`);
      }
    }
  }, [addConsoleMessage]);

  /**
   * Actions spécifiques
   */
  const createProject = useCallback(async (formData) => {
    return executeProjectAction(null, 'CREATE', formData);
  }, [executeProjectAction]);

  const deleteProject = useCallback(async (projectId) => {
    return executeProjectAction(projectId, 'DELETE');
  }, [executeProjectAction]);

  /**
   * Clear console messages
   */
  const clearConsole = useCallback(() => {
    setConsoleMessages([]);
    addConsoleMessage('info', '[CONSOLE] Messages cleared');
  }, [addConsoleMessage]);

  /**
   * Polling contrôlé pour remplacer WebSocket
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('[POLLING] Already running, skipping start');
      return;
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      if (isComponentMountedRef.current && !loading) {
        try {
          await loadProjects();
        } catch (error) {
          // Silent fail pour le polling
          console.debug('[POLLING] Failed to refresh projects:', error.message);
        }
      }
    }, 5000); // 5 secondes comme prévu
    
    addConsoleMessage('info', '[POLLING] Auto-refresh started (5s interval)');
  }, [loadProjects, addConsoleMessage, loading]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      addConsoleMessage('info', '[POLLING] Auto-refresh stopped');
    }
  }, [addConsoleMessage]);

  /**
   * Effet initial avec cleanup propre
   */
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    // Charger les projets initialement
    loadProjects();
    
    // Démarrer le polling après un délai
    const startPollingTimer = setTimeout(() => {
      if (isComponentMountedRef.current) {
        startPolling();
      }
    }, 1000);
    
    // Cleanup au démontage
    return () => {
      isComponentMountedRef.current = false;
      clearTimeout(startPollingTimer);
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []); // Dépendances vides pour ne déclencher qu'au montage

  return {
    projects,
    loading,
    consoleMessages,
    executeProjectAction,
    createProject,
    deleteProject,
    loadProjects,
    addConsoleMessage,
    clearConsole,
    startPolling,
    stopPolling
  };
}

/**
 * Utilitaires pour la construction des endpoints
 */
function getActionEndpoint(projectId, action) {
  const base = 'http://localhost:3000';
  
  switch (action) {
    case 'CREATE':
      return `${base}/projects`;
    case 'BUILD':
      return `${base}/projects/${projectId}/build`;
    case 'DEPLOY':
      return `${base}/projects/${projectId}/deploy`;
    case 'START':
      return `${base}/projects/${projectId}/start`;
    case 'STOP':
      return `${base}/projects/${projectId}/stop`;
    case 'REVERT':
      return `${base}/projects/${projectId}/revert`;
    case 'DELETE':
      return `${base}/projects/${projectId}`;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function getActionMethod(action) {
  if (action === 'DELETE') return 'DELETE';
  if (action === 'REVERT') return 'POST'; // Utiliser POST pour REVERT
  return 'POST';
}

console.log('[useWorkflows] Enhanced workflows hook loaded with fixed loading/polling');
