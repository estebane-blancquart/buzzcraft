import { useState, useCallback, useMemo, useEffect } from "react";
import { apiUrl } from "@config/api.js";
import { MESSAGE_TYPES, PROJECT_STATES, PROJECT_ACTIONS } from "@config/constants.js";

/*
 * FAIT QUOI : Gestion centralisée workflows projets avec optimisations
 * REÇOIT : Rien (hook autonome)
 * RETOURNE : Interface API + états + console
 * ERREURS : Gestion complète avec messages console + throw pour composants
 */

export function useWorkflows() {
  // === ÉTATS CENTRALISÉS ===
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // { 'project-id-ACTION': boolean }
  const [consoleMessages, setConsoleMessages] = useState([]);

  // Chargement initial projets
  useEffect(() => {
    console.log("🔄 useWorkflows: Effect triggered");
    loadProjects();
  }, []);

  // === CONSOLE FUNCTIONS ===

  // Ajout message console avec horodatage
  const addConsoleMessage = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    const newMessage = {
      id: Date.now() + Math.random(),
      type,
      message,
      timestamp,
    };

    setConsoleMessages((prev) => [...prev, newMessage]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  // Clear console
  const clearConsole = useCallback(() => {
    setConsoleMessages([]);
    console.log("🧹 Console cleared");
  }, []);

  // === ÉTAT MUTATIONS ===

  // Mise à jour état projet local (optimistic UI)
  const updateProjectState = useCallback((projectId, newState) => {
    console.log(`🔄 Updating project ${projectId} state to:`, newState);
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

  // Création projet avec validation + DEBUG
  const createProject = useCallback(
    async (formData) => {
      console.log("🟡 [CLIENT] === DEBUG createProject START ===");
      console.log("🟡 [CLIENT] formData complet:", JSON.stringify(formData, null, 2));
      console.log("🟡 [CLIENT] formData.template =", `"${formData.template}"`);
      console.log("🟡 [CLIENT] typeof formData.template =", typeof formData.template);
      console.log("🟡 [CLIENT] formData.template length =", formData.template?.length);
      console.log("🟡 [CLIENT] formData.template === 'empty' ?", formData.template === 'empty');
      console.log("🟡 [CLIENT] Boolean(formData.template) =", Boolean(formData.template));

      if (!formData?.name?.trim()) {
        throw new Error("Le nom du projet est requis");
      }

      try {
        console.log("🟡 [CLIENT] Creating projectId from name...");

        // ✅ GÉNÉRATION projectId conforme aux règles serveur
        const projectId = formData.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\-]/g, "-") // Remplace tout sauf a-z0-9-
          .replace(/-+/g, "-") // Évite les doubles tirets
          .replace(/^-+|-+$/g, ""); // Supprime tirets début/fin

        // ✅ Validation côté client avant envoi
        if (projectId.length < 3) {
          throw new Error(
            "Le nom du projet doit faire au moins 3 caractères une fois formaté"
          );
        }

        const requestBody = {
          projectId: projectId, // ✅ REQUIS par parser
          config: {
            // ✅ WRAPPER config requis
            name: formData.name.trim(),
            template: formData.template, // ✅ PAS DE FALLBACK ICI
          },
        };

        console.log("🟡 [CLIENT] Request body créé:");
        console.log("🟡 [CLIENT]", JSON.stringify(requestBody, null, 2));
        console.log("🟡 [CLIENT] requestBody.config.template =", `"${requestBody.config.template}"`);
        console.log("🟡 [CLIENT] Sending to API...");
        console.log("🟡 [CLIENT] === DEBUG CLIENT START ===");
console.log("🟡 [CLIENT] formData.template ORIGINAL =", `"${formData.template}"`);
console.log("🟡 [CLIENT] requestBody.config.template =", `"${requestBody.config.template}"`);
console.log("🟡 [CLIENT] Sending to API...");

        const data = await makeApiCall("projects", {
          method: "POST",
          body: JSON.stringify(requestBody),
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