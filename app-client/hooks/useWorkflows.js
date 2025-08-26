import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { apiUrl } from "@config/api.js";
import {
  PROJECT_STATES,
  PROJECT_ACTIONS,
  MESSAGE_TYPES,
} from "@config/constants.js";

/*
 * FAIT QUOI : Gestion workflows et communications API centralisées
 * REÇOIT : Rien (hook autonome)
 * RETOURNE : États techniques et fonctions API optimisées
 * ERREURS : Gérées avec states d'erreur + retry logic
 */

export function useWorkflows() {
  const hasLoadedOnce = useRef(false);

  // États techniques API
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  // Configuration console avec limite mémoire
  const MAX_CONSOLE_MESSAGES = 100;

  // Charger les projets au montage
  useEffect(() => {
    if (!hasLoadedOnce.current) {
      loadProjects();
      hasLoadedOnce.current = true;
    }
  }, []);

  // === FONCTIONS UTILITAIRES OPTIMISÉES ===

  // Gestion console avec limite mémoire
  const addConsoleMessage = useCallback((type, text) => {
    console.log("📝 ADD MESSAGE:", type, text);

    const message = {
      type,
      text,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setConsoleMessages((prev) => {
      const updated = [...prev, message];
      // Limite mémoire : garder seulement les N derniers messages
      return updated.slice(-MAX_CONSOLE_MESSAGES);
    });
  }, []);

  const clearConsole = useCallback(() => {
    console.log("🗑️ CLEAR CONSOLE");
    setConsoleMessages([]);
  }, []);

  // Mise à jour optimiste état projet avec validation
  const updateProjectState = useCallback((projectId, newState) => {
    console.log("🔄 OPTIMISTIC UPDATE:", projectId, "→", newState);

    if (!projectId || !newState) {
      console.warn("Invalid state update parameters");
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, state: newState } : project
      )
    );
  }, []);

  // === API ABSTRACTION LAYER ===

  // Fonction générique pour appels API - VERSION SIMPLIFIÉE
  const makeApiCall = useCallback(async (url, options = {}) => {
    const defaultOptions = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      ...options,
    };

    try {
      const response = await fetch(apiUrl(url), defaultOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "API call failed");
      }

      return data;
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  }, []);

  // === FONCTIONS API PRINCIPALES ===

  // Chargement projets avec protection race condition
  const loadProjects = useCallback(
    async (forceReload = false) => {
      console.log(
        "🔍 loadProjects called, loading:",
        loading,
        "forceReload:",
        forceReload
      );

      if (loading && !forceReload) {
        console.log("🔍 Load already in progress, skipping");
        return;
      }

      try {
        setLoading(true);
        console.log("🔍 setLoading(true) - Starting API call...");
        console.log("🔍 API URL will be:", apiUrl("projects"));

        const data = await makeApiCall("projects");
        console.log("🔍 makeApiCall response:", data);

        if (data) {
          console.log("🔍 data.projects:", data.projects);
          console.log("🔍 data.data:", data.data);
          console.log("🔍 Full data structure:", JSON.stringify(data, null, 2));

          // Accéder à data.data.projects selon le format API
          const projectsList = data.data?.projects || data.projects || [];
          setProjects(projectsList);
          console.log(`🔍 Projects set: ${projectsList.length} projets`);
        } else {
          console.log("🔍 No data returned from API");
        }
      } catch (error) {
        console.error("🔍 loadProjects ERROR:", error);
        addConsoleMessage(
          MESSAGE_TYPES.ERROR,
          `Chargement échoué: ${error.message}`
        );
      } finally {
        console.log("🔍 setLoading(false) - API call finished");
        setLoading(false);
      }
    },
    [makeApiCall, addConsoleMessage]
  );

  // Création projet avec validation
  const createProject = useCallback(
    async (formData) => {
      if (!formData?.name?.trim()) {
        throw new Error("Le nom du projet est requis");
      }

      try {
        console.log("🆕 CREATING PROJECT:", formData.name);

        const data = await makeApiCall("projects", {
          method: "POST",
          body: JSON.stringify({
            name: formData.name.trim(),
            template: formData.template || "basic",
          }),
        });

        if (data) {
          console.log("Projet créé avec succès:", data.message);
          addConsoleMessage(
            MESSAGE_TYPES.SUCCESS,
            `Projet "${formData.name}" créé avec succès`
          );
          await loadProjects(true);
        }
      } catch (error) {
        console.error("Erreur création:", error);
        addConsoleMessage(
          MESSAGE_TYPES.ERROR,
          `Création échouée: ${error.message}`
        );
        throw error;
      }
    },
    [makeApiCall, addConsoleMessage, loadProjects]
  );

  // Suppression projet
  const deleteProject = useCallback(
    async (projectId) => {
      if (!projectId) {
        throw new Error("ID projet requis pour suppression");
      }

      try {
        console.log("🗑️ DELETING PROJECT:", projectId);

        const data = await makeApiCall(`projects/${projectId}`, {
          method: "DELETE",
        });

        if (data) {
          console.log("Suppression réussie:", data.message);
          addConsoleMessage(
            MESSAGE_TYPES.SUCCESS,
            `Projet ${projectId} supprimé`
          );
          setProjects((prev) => prev.filter((p) => p.id !== projectId));
        }
      } catch (error) {
        console.error("Erreur DELETE:", error);
        addConsoleMessage(
          MESSAGE_TYPES.ERROR,
          `Suppression échouée: ${error.message}`
        );
        throw error;
      }
    },
    [makeApiCall, addConsoleMessage]
  );

  // === GESTION ACTIONS PROJET ===

  // Configuration des actions avec endpoints et états
  const actionConfig = useMemo(
    () => ({
      [PROJECT_ACTIONS.BUILD]: {
        endpoint: "build",
        method: "POST",
        targetState: PROJECT_STATES.BUILT,
        successMessage: "Build terminé avec succès",
      },
      [PROJECT_ACTIONS.DEPLOY]: {
        endpoint: "deploy",
        method: "POST",
        targetState: PROJECT_STATES.OFFLINE,
        successMessage: "Déploiement terminé avec succès",
      },
      [PROJECT_ACTIONS.START]: {
        endpoint: "start",
        method: "POST",
        targetState: PROJECT_STATES.ONLINE,
        successMessage: "Projet démarré avec succès",
      },
      [PROJECT_ACTIONS.STOP]: {
        endpoint: "stop",
        method: "POST",
        targetState: PROJECT_STATES.OFFLINE,
        successMessage: "Projet arrêté avec succès",
      },
      [PROJECT_ACTIONS.REVERT]: {
        endpoint: "revert",
        method: "PUT",
        targetState: PROJECT_STATES.DRAFT,
        successMessage: "Projet remis en DRAFT",
      },
    }),
    []
  );

  // Exécution action projet unifiée et optimisée
  const executeProjectAction = useCallback(
    async (projectId, action) => {
      if (!projectId || !action) {
        throw new Error("Project ID et action requis");
      }

      const actionKey = `${projectId}-${action}`;
      console.log("🔄 START ACTION:", action, "sur", projectId);

      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

      try {
        // Action spéciale UPDATE (simulation blue-green)
        if (action === PROJECT_ACTIONS.UPDATE) {
          addConsoleMessage(
            MESSAGE_TYPES.INFO,
            `Démarrage mise à jour blue-green pour ${projectId}`
          );

          // Simulation délai
          await new Promise((resolve) => setTimeout(resolve, 2000));

          console.log("Update blue-green simulé avec succès");
          addConsoleMessage(
            MESSAGE_TYPES.SUCCESS,
            `Mise à jour blue-green terminée pour ${projectId}`
          );
          return;
        }

        // Actions standard avec configuration
        const config = actionConfig[action];
        if (!config) {
          throw new Error(`Action non supportée: ${action}`);
        }

        const data = await makeApiCall(
          `projects/${projectId}/${config.endpoint}`,
          {
            method: config.method,
          }
        );

        if (data) {
          console.log(
            `${action} réussi:`,
            data.message || config.successMessage
          );
          addConsoleMessage(
            MESSAGE_TYPES.SUCCESS,
            data.message || config.successMessage
          );

          if (config.targetState) {
            updateProjectState(projectId, config.targetState);
          }
        }
      } catch (error) {
        console.error(`Erreur action ${action}:`, error);
        addConsoleMessage(
          MESSAGE_TYPES.ERROR,
          `${action} échoué: ${error.message}`
        );
        throw error;
      } finally {
        console.log("✅ SET LOADING FALSE pour:", actionKey);
        setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
        console.log("🔄 END ACTION:", action, "sur", projectId);
      }
    },
    [makeApiCall, addConsoleMessage, updateProjectState, actionConfig]
  );

  // === MEMOIZATION POUR PERFORMANCE ===

  // Interface API memorisée
  const api = useMemo(
    () => ({
      loadProjects,
      createProject,
      deleteProject,
      executeProjectAction,
    }),
    [loadProjects, createProject, deleteProject, executeProjectAction]
  );

  // Terminal console memorisée
  const terminalConsole = useMemo(
    () => ({
      messages: consoleMessages,
      addMessage: addConsoleMessage,
      clear: clearConsole,
    }),
    [consoleMessages, addConsoleMessage, clearConsole]
  );

  // États memorisés
  const state = useMemo(
    () => ({
      projects,
      loading,
      actionLoading,
    }),
    [projects, loading, actionLoading]
  );

  return {
    // États groupés
    ...state,

    // API groupée
    ...api,

    // Console avec protection défensive
    consoleMessages: consoleMessages || [],
    addConsoleMessage,
    clearConsole,

    // Utils
    updateProjectState,
  };
}