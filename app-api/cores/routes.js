import express from "express";
import { join } from "path";
import { request } from "../requests/parser.js";
import { process as processRequest } from "../requests/processor.js";
import { response } from "../responses/parser.js";
import { process as processResponse } from "../responses/processor.js";
import { readdir, readFile, writeFile, rm, stat } from "fs/promises";
import { createWorkflow } from "../../app-server/engines/create-coordinator.js";
import { buildWorkflow } from "../../app-server/engines/build-coordinator.js";
// import { deployWorkflow } from "../../app-server/engines/deploy-coordinator.js";
// import { startWorkflow } from "../../app-server/engines/start-coordinator.js";
// import { stopWorkflow } from "../../app-server/engines/stop-coordinator.js";
// import { deleteWorkflow } from "../../app-server/engines/delete-coordinator.js";

/**
 * Routes HTTP pour gestion des projets avec Pattern 13 CALLS
 * @returns {express.Router} Router configuré
 */

const router = express.Router();

// Workflow coordinators mapping
const WORKFLOW_COORDINATORS = {
  CREATE: createWorkflow,
  BUILD: buildWorkflow,
  // DEPLOY: deployWorkflow,     // Temporairement désactivé - dépendances cassées
  // START: startWorkflow,       // Temporairement désactivé - dépendances cassées
  // STOP: stopWorkflow,         // Temporairement désactivé - dépendances cassées
  // DELETE: deleteWorkflow,     // Temporairement désactivé - dépendances cassées
};

/**
 * Gestionnaire générique Pattern 13 CALLS complet
 * @param {express.Request} req - Requête HTTP
 * @param {express.Response} res - Réponse HTTP
 */
async function handleWorkflowRequest(req, res) {
  console.log(`[ROUTES] Pattern 13 CALLS initiated for ${req.method} ${req.path}`);

  try {
    // CALL 1: Request Parser
    console.log(`[ROUTES] CALL 1: Parsing incoming request...`);
    const parsedRequest = await request(req);
    if (!parsedRequest.success) {
      console.log(`[ROUTES] CALL 1 failed: ${parsedRequest.error}`);
      return res.status(400).json({
        success: false,
        error: `Request parsing failed: ${parsedRequest.error}`
      });
    }

    // CALL 2: Request Processor
    console.log(`[ROUTES] CALL 2: Processing parsed request...`);
    const processedRequest = await processRequest(parsedRequest);
    if (!processedRequest.success) {
      console.log(`[ROUTES] CALL 2 failed: ${processedRequest.error}`);
      return res.status(400).json({
        success: false,
        error: `Request processing failed: ${processedRequest.error}`
      });
    }

    // CALL 3-10: Workflow Execution (handled by coordinator)
    const { action, projectId, config } = processedRequest.data;
    const coordinator = WORKFLOW_COORDINATORS[action];
    
    if (!coordinator) {
      console.log(`[ROUTES] Unknown workflow action: ${action}`);
      return res.status(400).json({
        success: false,
        error: `Unsupported workflow action: ${action}`
      });
    }

    console.log(`[ROUTES] CALL 3-10: Executing ${action} workflow...`);
    const workflowResult = await coordinator(projectId, config);
    
    if (!workflowResult.success) {
      console.log(`[ROUTES] Workflow ${action} failed: ${workflowResult.error}`);
      return res.status(500).json({
        success: false,
        error: `Workflow ${action} failed: ${workflowResult.error}`
      });
    }

    // CALL 11: Response Parser
    console.log(`[ROUTES] CALL 11: Parsing workflow result...`);
    const parsedResponse = await response(workflowResult);
    if (!parsedResponse.success) {
      console.log(`[ROUTES] CALL 11 failed: ${parsedResponse.error}`);
      return res.status(500).json({
        success: false,
        error: `Response parsing failed: ${parsedResponse.error}`
      });
    }

    // CALL 12: Response Processor
    console.log(`[ROUTES] CALL 12: Processing final response...`);
    const finalResponse = await processResponse(parsedResponse);
    if (!finalResponse.success) {
      console.log(`[ROUTES] CALL 12 failed: ${finalResponse.error}`);
      return res.status(500).json({
        success: false,
        error: `Response processing failed: ${finalResponse.error}`
      });
    }

    console.log(`[ROUTES] Pattern 13 CALLS completed successfully for ${action}`);
    res.json({
      success: true,
      data: finalResponse.data
    });

  } catch (error) {
    console.log(`[ROUTES] Unexpected error in Pattern 13 CALLS: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error during workflow execution'
    });
  }
}

/**
 * Utilitaire de validation des paramètres de route
 * @param {string} projectId - ID du projet
 * @returns {{valid: boolean, error?: string}}
 */
function validateRouteParams(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: 'Project ID must be non-empty string' };
  }
  if (projectId.length < 3 || projectId.length > 50) {
    return { valid: false, error: 'Project ID must be between 3 and 50 characters' };
  }
  if (!/^[a-zA-Z0-9-_]+$/.test(projectId)) {
    return { valid: false, error: 'Project ID can only contain letters, numbers, hyphens and underscores' };
  }
  return { valid: true };
}

/**
 * Gestionnaire d'erreurs standardisé
 * @param {express.Response} res - Réponse HTTP
 * @param {Error} error - Erreur capturée
 * @param {string} operation - Nom de l'opération
 */
function handleRouteError(res, error, operation) {
  console.log(`[ROUTES] Error in ${operation}: ${error.message}`);
  res.status(500).json({
    success: false,
    error: `Failed to ${operation}`
  });
}

// ===== ROUTES API =====

/**
 * GET /projects - Lister tous les projets avec pagination
 */
router.get("/projects", async (req, res) => {
  console.log(`[ROUTES] GET /projects - Loading all projects`);
  
  try {
    const projectsDir = "../app-server/data/outputs";
    const projects = [];

    try {
      const folders = await readdir(projectsDir);
      console.log(`[ROUTES] Found ${folders.length} project folders`);

      for (const folder of folders) {
        try {
          const projectFile = join(projectsDir, folder, "project.json");
          const content = await readFile(projectFile, "utf8");
          const projectData = JSON.parse(content);

          // Extraction standardisée des métadonnées projet
          const project = projectData.data || projectData;
          
          projects.push({
            id: project.id,
            name: project.name,
            state: project.state,
            template: project.template,
            created: project.created,
            lastModified: project.lastModified || project.created
          });
        } catch (error) {
          console.log(`[ROUTES] Skipping invalid project folder ${folder}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`[ROUTES] Projects directory not found, returning empty list`);
    }

    console.log(`[ROUTES] Successfully loaded ${projects.length} projects`);
    res.json({
      success: true,
      data: {
        projects,
        count: projects.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    handleRouteError(res, error, "load projects");
  }
});

/**
 * GET /projects/:id - Charger un projet spécifique pour édition
 */
router.get("/projects/:id", async (req, res) => {
  const projectId = req.params.id;
  console.log(`[ROUTES] GET /projects/${projectId} - Loading project details`);

  // Validation des paramètres
  const validation = validateRouteParams(projectId);
  if (!validation.valid) {
    console.log(`[ROUTES] Invalid project ID: ${validation.error}`);
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }

  try {
    const projectPath = `../app-server/data/outputs/${projectId}`;
    const projectFile = join(projectPath, "project.json");

    try {
      const content = await readFile(projectFile, "utf8");
      const projectData = JSON.parse(content);

      console.log(`[ROUTES] Project ${projectId} loaded successfully`);
      res.json({
        success: true,
        data: {
          project: projectData,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.log(`[ROUTES] Project ${projectId} not found: ${error.message}`);
      res.status(404).json({
        success: false,
        error: `Project ${projectId} not found`
      });
    }

  } catch (error) {
    handleRouteError(res, error, `load project ${projectId}`);
  }
});

/**
 * POST /projects - Créer un nouveau projet (CREATE workflow)
 */
router.post("/projects", handleWorkflowRequest);

/**
 * POST /projects/:id/build - Builder un projet (BUILD workflow)  
 */
router.post("/projects/:id/build", handleWorkflowRequest);

/**
 * POST /projects/:id/deploy - Déployer un projet (DEPLOY workflow)
 */
router.post("/projects/:id/deploy", handleWorkflowRequest);

/**
 * POST /projects/:id/start - Démarrer un projet (START workflow)
 */
router.post("/projects/:id/start", handleWorkflowRequest);

/**
 * POST /projects/:id/stop - Arrêter un projet (STOP workflow) 
 */
router.post("/projects/:id/stop", handleWorkflowRequest);

/**
 * DELETE /projects/:id - Supprimer un projet (DELETE workflow)
 */
router.delete("/projects/:id", handleWorkflowRequest);

/**
 * GET /templates - Lister les templates disponibles
 */
router.get("/templates", async (req, res) => {
  console.log(`[ROUTES] GET /templates - Loading available templates`);

  try {
    // Cette route sera implémentée quand les templates seront finalisés
    res.json({
      success: true,
      data: {
        templates: [
          { id: "basic", name: "Site Basique", description: "Template minimal pour démarrer" },
          { id: "business", name: "Site Business", description: "Template professionnel avec contact" },
          { id: "portfolio", name: "Portfolio", description: "Template pour présenter ses réalisations" }
        ],
        count: 3,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    handleRouteError(res, error, "load templates");
  }
});

console.log(`[ROUTES] Router initialized with Pattern 13 CALLS support`);

export default router;