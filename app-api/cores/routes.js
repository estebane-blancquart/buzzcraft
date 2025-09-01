import express from "express";
import { join } from "path";
import { request } from "../requests/parser.js";
import { process as processRequest } from "../requests/processor.js";
import { response } from "../responses/parser.js";
import { process as processResponse } from "../responses/processor.js";
import { readdir, readFile, writeFile, rm, stat } from "fs/promises";
import { createWorkflow } from "../../app-server/engines/create-coordinator.js";
import { buildWorkflow } from "../../app-server/engines/build-coordinator.js";
import { deployWorkflow } from "../../app-server/engines/deploy-coordinator.js";
import { startWorkflow } from "../../app-server/engines/start-coordinator.js";
import { stopWorkflow } from "../../app-server/engines/stop-coordinator.js";
import { deleteWorkflow } from "../../app-server/engines/delete-coordinator.js";
import { revertWorkflow } from '../../app-server/engines/revert-coordinator.js';
import { generateWorkflowId, logCall, logWorkflow, logError } from "./enhanced-logger.js";

/**
 * Routes HTTP pour gestion des projets avec Pattern 13 CALLS
 * @returns {express.Router} Router configuré
 */
const router = express.Router();

// Workflow coordinators mapping
const WORKFLOW_COORDINATORS = {
  CREATE: createWorkflow,
  BUILD: buildWorkflow,
  DEPLOY: deployWorkflow,
  START: startWorkflow,
  STOP: stopWorkflow,
  DELETE: deleteWorkflow,
  REVERT: revertWorkflow,
};

/**
 * Gestionnaire générique Pattern 13 CALLS avec logs enrichis
 * @param {express.Request} req - Requête HTTP
 * @param {express.Response} res - Réponse HTTP
 */
async function handleWorkflowRequest(req, res) {
  const startTime = Date.now();
  const workflowId = generateWorkflowId();
  
  logCall('ROUTES', 0, 'Workflow initiated', 'STARTED', {
    workflowId,
    method: req.method,
    path: req.path
  });

  try {
    // CALL 1: Request Parser
    logCall('ROUTES', 1, 'Request parsing', 'STARTED', { workflowId });
    const parsedRequest = await request(req);
    
    if (!parsedRequest.success) {
      logCall('ROUTES', 1, 'Request parsing', 'FAILED', {
        workflowId,
        error: parsedRequest.error
      });
      return res.status(400).json({
        success: false,
        error: parsedRequest.error,
        workflowId,
        failedAt: 'CALL_1_REQUEST_PARSER'
      });
    }
    
    logCall('ROUTES', 1, 'Request parsing', 'SUCCESS', { workflowId });

    // CALL 2: Request Processor  
    logCall('ROUTES', 2, 'Request processing', 'STARTED', { workflowId });
    const processedRequest = await processRequest(parsedRequest.data);
    
    if (!processedRequest.success) {
      logCall('ROUTES', 2, 'Request processing', 'FAILED', {
        workflowId,
        error: processedRequest.error
      });
      return res.status(400).json({
        success: false,
        error: processedRequest.error,
        workflowId,
        failedAt: 'CALL_2_REQUEST_PROCESSOR'
      });
    }
    
    logCall('ROUTES', 2, 'Request processing', 'SUCCESS', { workflowId });

    // CALL 3-10: Workflow Execution
    const { action, projectId, config } = processedRequest.data;
    const coordinator = WORKFLOW_COORDINATORS[action];

    if (!coordinator) {
      logError('ROUTES', `Unknown action: ${action}`, {
        workflowId,
        projectId,
        availableActions: Object.keys(WORKFLOW_COORDINATORS)
      });
      return res.status(400).json({
        success: false,
        error: `UNSUPPORTED_ACTION: ${action}`,
        workflowId,
        failedAt: 'CALL_3_COORDINATOR_LOOKUP',
        availableActions: Object.keys(WORKFLOW_COORDINATORS)
      });
    }

    logWorkflow(action, 'STARTED', { workflowId, projectId });
    const workflowResult = await coordinator(projectId, config);

    if (!workflowResult.success) {
      const duration = Date.now() - startTime;
      logWorkflow(action, 'FAILED', {
        workflowId,
        projectId,
        duration,
        error: workflowResult.error
      });
      
      return res.status(workflowResult.error === 'NOT_IMPLEMENTED' ? 501 : 500).json({
        success: false,
        error: workflowResult.error,
        message: workflowResult.message,
        details: workflowResult.details,
        workflowId,
        failedAt: `CALL_${action}_COORDINATOR`,
        duration
      });
    }
    
    logWorkflow(action, 'SUCCESS', { workflowId, projectId });

    // CALL 11: Response Parser
    logCall('ROUTES', 11, 'Response parsing', 'STARTED', { workflowId });
    const parsedResponse = await response(workflowResult);
    
    if (!parsedResponse.success) {
      logCall('ROUTES', 11, 'Response parsing', 'FAILED', {
        workflowId,
        error: parsedResponse.error
      });
      return res.status(500).json({
        success: false,
        error: parsedResponse.error,
        workflowId,
        failedAt: 'CALL_11_RESPONSE_PARSER'
      });
    }
    
    logCall('ROUTES', 11, 'Response parsing', 'SUCCESS', { workflowId });

    // CALL 12: Response Processor
    logCall('ROUTES', 12, 'Response processing', 'STARTED', { workflowId });
    const finalResponse = await processResponse(parsedResponse);
    
    if (!finalResponse.success) {
      logCall('ROUTES', 12, 'Response processing', 'FAILED', {
        workflowId,
        error: finalResponse.error
      });
      return res.status(500).json({
        success: false,
        error: finalResponse.error,
        workflowId,
        failedAt: 'CALL_12_RESPONSE_PROCESSOR'
      });
    }
    
    const duration = Date.now() - startTime;
    logCall('ROUTES', 12, 'Response processing', 'SUCCESS', {
      workflowId,
      duration
    });
    
    logWorkflow(action, 'COMPLETED', {
      workflowId,
      projectId,
      duration
    });
    
    res.json({
      success: true,
      data: finalResponse.data,
      workflowId,
      duration,
      action
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('ROUTES', error.message, {
      workflowId,
      duration,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error during workflow execution",
      workflowId,
      duration
    });
  }
}

/**
 * Utilitaire de validation des paramètres de route
 * @param {string} projectId - ID du projet
 * @returns {{valid: boolean, error?: string}} Résultat validation
 */
function validateRouteParams(projectId) {
  if (!projectId || typeof projectId !== "string") {
    return {
      valid: false,
      error: "Project ID is required and must be a string",
    };
  }

  if (projectId.length < 3 || projectId.length > 50) {
    return {
      valid: false,
      error: "Project ID must be between 3 and 50 characters",
    };
  }

  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return {
      valid: false,
      error: "Project ID must contain only lowercase letters, numbers, and hyphens",
    };
  }

  return { valid: true };
}

/**
 * Gestionnaire d'erreur pour les routes
 * @param {express.Response} res - Réponse HTTP
 * @param {Error} error - Erreur capturée
 * @param {string} operation - Description de l'opération
 */
function handleRouteError(res, error, operation) {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  logError('ROUTES', `${operation} failed: ${error.message}`, {
    errorId,
    operation,
    stack: error.stack
  });
  
  res.status(500).json({
    success: false,
    error: "Internal server error",
    errorId,
    operation,
  });
}

// ===== ROUTES GET =====

/**
 * GET /projects - Lister tous les projets
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

          const project = projectData.data || projectData;

          projects.push({
            id: project.id,
            name: project.name,
            state: project.state,
            template: project.template,
            created: project.created,
            lastModified: project.lastModified || project.created,
          });
        } catch (error) {
          console.log(
            `[ROUTES] Skipping invalid project folder ${folder}: ${error.message}`
          );
        }
      }
    } catch (error) {
      console.log(
        `[ROUTES] Projects directory not found, returning empty list`
      );
    }

    console.log(`[ROUTES] Successfully loaded ${projects.length} projects`);
    res.json({
      success: true,
      data: {
        projects,
        count: projects.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleRouteError(res, error, "load projects");
  }
});

/**
 * GET /projects/:id - Charger un projet spécifique
 */
router.get("/projects/:id", async (req, res) => {
  const projectId = req.params.id;
  console.log(`[ROUTES] GET /projects/${projectId} - Loading project details`);

  const validation = validateRouteParams(projectId);
  if (!validation.valid) {
    console.log(`[ROUTES] Invalid project ID: ${validation.error}`);
    return res.status(400).json({
      success: false,
      error: validation.error,
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
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.log(`[ROUTES] Project ${projectId} not found: ${error.message}`);
      res.status(404).json({
        success: false,
        error: `Project ${projectId} not found`,
      });
    }
  } catch (error) {
    handleRouteError(res, error, `load project ${projectId}`);
  }
});

/**
 * GET /projects/meta/templates - Lister les templates disponibles
 */
router.get("/projects/meta/templates", async (req, res) => {
  console.log(`[ROUTES] GET /projects/meta/templates - Loading available templates`);

  try {
    const { PATHS } = await import('../../app-server/cores/constants.js');
    
    let templates = [];
    
    try {
      const files = await readdir(PATHS.projectTemplates);
      
      templates = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const id = file.replace('.json', '');
          return {
            id: id,
            name: `${id.charAt(0).toUpperCase() + id.slice(1)} Template`,
            description: `Template ${id} pour créer votre projet`
          };
        });
      
      console.log(`[ROUTES] Found ${templates.length} template files: ${templates.map(t => t.id).join(', ')}`);
      
    } catch (dirError) {
      console.log(`[ROUTES] Templates directory not accessible: ${dirError.message}`);
      
      return res.status(500).json({
        success: false,
        error: `Templates directory not found: ${PATHS.projectTemplates}`,
        details: dirError.message
      });
    }

    res.json({
      success: true,
      data: {
        templates,
        count: templates.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.log(`[ROUTES] Templates loading error: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: `Failed to load templates: ${error.message}`
    });
  }
});

// ===== ROUTES POST/DELETE =====

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
 * PUT /projects/:id/revert - Revert un projet (REVERT workflow)
 */
router.put("/projects/:id/revert", handleWorkflowRequest);

/**
 * POST /projects/:id/revert - Revert un projet (REVERT workflow - alternative)
 */
router.post("/projects/:id/revert", handleWorkflowRequest);

console.log(`[ROUTES] Enhanced router with unified logging initialized`);
export default router;
