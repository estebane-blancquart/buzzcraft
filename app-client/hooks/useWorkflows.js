import { useState, useEffect, useRef } from "react";
import { apiUrl } from "@config/api.js";
import { PROJECT_ACTIONS, MESSAGE_TYPES } from "@config/constants.js";

/*
 * FAIT QUOI : Hook métier workflows - Gestion complète projets + API + console
 * REÇOIT : Rien (hook autonome)
 * RETOURNE : États + handlers complets pour workflows
 * ERREURS : Gestion complète avec états d'erreur + logging
 */

export function useWorkflows() {
  // États principaux
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [consoleMessages, setConsoleMessages] = useState([]);

  // Ref pour éviter double appel en StrictMode
  const didFetch = useRef(false);

  // Chargement projets au montage
  useEffect(() => {
    if (!didFetch.current) {
      loadProjects();
      didFetch.current = true;
    }
  }, []);

  // === GESTION PROJETS ===

  /**
   * Charge tous les projets depuis l'API
   * @param {boolean} silent - si true, n'ajoute pas de message console
   */
  const loadProjects = async (silent = false) => {
    try {
      if (!silent) console.log("[useWorkflows] Loading projects...");

      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl("projects"));
      const data = await response.json();

      if (data.success) {
        let projectsList = data.data.projects || [];
        
        // VALIDATION ET NETTOYAGE DES PROJETS
        console.log("[useWorkflows] Raw projects before validation:", projectsList);
        
        // Filtrer les projets invalides et logger les problèmes
        const validProjects = projectsList.filter((project, index) => {
          if (!project || typeof project !== 'object') {
            console.warn(`[useWorkflows] Project ${index} is not an object:`, project);
            return false;
          }
          
          if (!project.id || project.id === 'undefined') {
            console.warn(`[useWorkflows] Project ${index} has invalid ID:`, project);
            return false;
          }
          
          if (!project.name) {
            console.warn(`[useWorkflows] Project ${index} has no name:`, project);
            return false;
          }
          
          // Si le projet a un content string, essayer de le parser pour récupérer le vrai ID
          if (typeof project.content === 'string') {
            try {
              const parsed = JSON.parse(project.content);
              if (parsed.id && parsed.id !== 'undefined') {
                project.id = parsed.id; // Utiliser l'ID du content parsé
                project.name = parsed.name || project.name;
                console.log(`[useWorkflows] Fixed project ID from content: ${parsed.id}`);
              }
            } catch (e) {
              console.warn(`[useWorkflows] Could not parse project content:`, e);
            }
          }
          
          return true;
        });
        
        console.log(`[useWorkflows] Filtered ${projectsList.length} → ${validProjects.length} valid projects`);
        
        // Logger chaque projet valide
        validProjects.forEach((project, index) => {
          console.log(`[useWorkflows] Valid project ${index}:`, {
            id: project.id,
            name: project.name,
            state: project.state
          });
        });
        
        setProjects(validProjects);

        if (!silent) {
          addConsoleMessage(
            MESSAGE_TYPES.SUCCESS,
            `${validProjects.length} projet(s) chargé(s)`
          );
          console.log(`[useWorkflows] Loaded ${validProjects.length} projects`);
        }
      } else {
        throw new Error(data.error || "Failed to load projects");
      }
    } catch (err) {
      setError(`Erreur chargement projets: ${err.message}`);
      if (!silent)
        addConsoleMessage(MESSAGE_TYPES.ERROR, `Erreur: ${err.message}`);
      console.error("[useWorkflows] Load projects error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crée un nouveau projet
   */
  const createProject = async (formData) => {
    try {
      console.log("[useWorkflows] Creating project:", formData);

      const response = await fetch(apiUrl("projects"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("[useWorkflows] Project created successfully");
        addConsoleMessage(MESSAGE_TYPES.SUCCESS, "Projet créé avec succès");

        // Recharger la liste des projets en silence
        await loadProjects(true);

        return { success: true, data: data.data };
      } else {
        throw new Error(data.error || "Project creation failed");
      }
    } catch (err) {
      console.error("[useWorkflows] Create project error:", err);
      addConsoleMessage(
        MESSAGE_TYPES.ERROR,
        `Création échouée: ${err.message}`
      );
      throw err;
    }
  };

  /**
   * Exécute une action sur un projet
   */
  const executeProjectAction = async (projectId, action) => {
    const actionKey = `${projectId}-${action}`;

    try {
      console.log(`[useWorkflows] Executing ${action} on project ${projectId}`);

      // Validation de l'ID du projet
      if (!projectId || projectId === 'undefined') {
        throw new Error(`Invalid project ID: ${projectId}`);
      }

      // État de chargement pour l'action spécifique
      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

      let url = "";
      let method = "";

      // Configuration selon l'action
      switch (action) {
        case PROJECT_ACTIONS.BUILD:
          url = `projects/${projectId}/build`;
          method = "POST";
          break;
        case PROJECT_ACTIONS.DEPLOY:
          url = `projects/${projectId}/deploy`;
          method = "POST";
          break;
        case PROJECT_ACTIONS.START:
          url = `projects/${projectId}/start`;
          method = "POST";
          break;
        case PROJECT_ACTIONS.STOP:
          url = `projects/${projectId}/stop`;
          method = "POST";
          break;
        case PROJECT_ACTIONS.REVERT:
          url = `projects/${projectId}/revert`;
          method = "PUT";
          break;
        case PROJECT_ACTIONS.DELETE:
          url = `projects/${projectId}`;
          method = "DELETE";
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const response = await fetch(apiUrl(url), {
        method,
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        console.log(`[useWorkflows] ${action} completed successfully`);
        addConsoleMessage(
          MESSAGE_TYPES.SUCCESS,
          `${action} terminé avec succès`
        );

        // Recharger les projets en silence
        await loadProjects(true);

        return { success: true, data: data.data };
      } else {
        // Gestion spéciale pour les actions non implémentées
        if (data.error === "NOT_IMPLEMENTED") {
          addConsoleMessage(
            MESSAGE_TYPES.WARNING,
            `${action} pas encore implémenté (prévu v2.0)`
          );
        } else {
          throw new Error(data.error || `${action} failed`);
        }
      }
    } catch (err) {
      console.error(`[useWorkflows] ${action} error:`, err);
      addConsoleMessage(
        MESSAGE_TYPES.ERROR,
        `${action} échoué: ${err.message}`
      );
      throw err;
    } finally {
      setActionLoading((prev) => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };

  /**
   * Supprime un projet (raccourci pour DELETE)
   */
  const deleteProject = async (projectId) => {
    return executeProjectAction(projectId, PROJECT_ACTIONS.DELETE);
  };

  // === GESTION CONSOLE ===

  /**
   * Ajoute un message à la console
   */
  const addConsoleMessage = (type, message) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    setConsoleMessages((prev) => [...prev, newMessage]);
    console.log(`[useWorkflows] Console: [${type}] ${message}`);
  };

  /**
   * Vide la console
   */
  const clearConsole = () => {
    setConsoleMessages([]);
    console.log("[useWorkflows] Console cleared");
  };

  // === ÉTATS TRANSITOIRES ===

  /**
   * Vérifie si une action est en cours pour un projet
   */
  const isActionInProgress = (projectId, action) => {
    return Boolean(actionLoading[`${projectId}-${action}`]);
  };

  /**
   * Vérifie si le projet est dans un état transitoire
   */
  const isProjectInTransition = (project) => {
    const transitionalStates = [
      "[BUILDING]",
      "[DEPLOYING]",
      "[STARTING]",
      "[REVERTING]",
    ];
    return transitionalStates.includes(project.state);
  };

  // Interface publique du hook
  return {
    // États
    projects,
    loading,
    error,
    actionLoading,
    consoleMessages,

    // Actions projets
    loadProjects,
    createProject,
    executeProjectAction,
    deleteProject,

    // Console
    addConsoleMessage,
    clearConsole,

    // Utilitaires
    isActionInProgress,
    isProjectInTransition,
  };
}

export default useWorkflows;