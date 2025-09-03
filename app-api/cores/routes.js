/**
 * Routes HTTP pour gestion des projets - VERSION SIMPLE ET PROPRE
 * @returns {express.Router} Router configuré
 */

import express from "express";
import { join } from "path";
import { request } from "../requests/parser.js";
import { process as processRequest } from "../requests/processor.js";
import { response } from "../responses/parser.js";
import { process as processResponse } from "../responses/processor.js";
import { readdir, readFile } from "fs/promises";
import { createWorkflow } from "../../app-server/engines/create-coordinator.js";
import { buildWorkflow } from "../../app-server/engines/build-coordinator.js";
import { deployWorkflow } from "../../app-server/engines/deploy-coordinator.js";
import { startWorkflow } from "../../app-server/engines/start-coordinator.js";
import { stopWorkflow } from "../../app-server/engines/stop-coordinator.js";
import { deleteWorkflow } from "../../app-server/engines/delete-coordinator.js";
import { revertWorkflow } from '../../app-server/engines/revert-coordinator.js';

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
 * Gestionnaire générique pour tous les workflows
 * @param {express.Request} req - Requête HTTP
 * @param {express.Response} res - Réponse HTTP
 */
async function handleWorkflowRequest(req, res) {
  const startTime = Date.now();

  try {
    // Request parsing
    const parsedRequest = await request(req);
    
    if (!parsedRequest.success) {
      console.log(`[ROUTES] Request parsing failed: ${parsedRequest.error}`);
      return res.status(400).json({
        success: false,
        error: parsedRequest.error
      });
    }

    // Request processing
    const processedRequest = await processRequest(parsedRequest.data);
    
    if (!processedRequest.success) {
      console.log(`[ROUTES] Request processing failed: ${processedRequest.error}`);
      return res.status(400).json({
        success: false,
        error: processedRequest.error
      });
    }

    // Workflow execution
    const { action, projectId, config } = processedRequest.data;
    const coordinator = WORKFLOW_COORDINATORS[action];

    if (!coordinator) {
      console.log(`[ROUTES] Unknown action: ${action}`);
      return res.status(400).json({
        success: false,
        error: `UNSUPPORTED_ACTION: ${action}`,
        availableActions: Object.keys(WORKFLOW_COORDINATORS)
      });
    }

    const workflowResult = await coordinator(projectId, config);

    if (!workflowResult.success) {
      console.log(`[ROUTES] Workflow ${action} failed: ${workflowResult.error}`);
      return res.status(workflowResult.error === 'NOT_IMPLEMENTED' ? 501 : 500).json({
        success: false,
        error: workflowResult.error,
        message: workflowResult.message,
        details: workflowResult.details
      });
    }

    // Response parsing
    const parsedResponse = await response(workflowResult);
    
    if (!parsedResponse.success) {
      console.log(`[ROUTES] Response parsing failed: ${parsedResponse.error}`);
      return res.status(500).json({
        success: false,
        error: parsedResponse.error
      });
    }

    // Response processing
    const finalResponse = await processResponse(parsedResponse);
    
    if (!finalResponse.success) {
      console.log(`[ROUTES] Response processing failed: ${finalResponse.error}`);
      return res.status(500).json({
        success: false,
        error: finalResponse.error
      });
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: finalResponse.data,
      duration,
      action
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[ROUTES] Unexpected error: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error during workflow execution",
      duration
    });
  }
}

/**
 * Gestionnaire d'erreurs de route
 * @param {express.Response} res - Réponse HTTP
 * @param {Error} error - Erreur capturée
 * @param {string} operation - Opération qui a échoué
 * @private
 */
function handleRouteError(res, error, operation) {
  console.log(`[ROUTES] ${operation} failed: ${error.message}`);
  
  res.status(500).json({
    success: false,
    error: `Server error during ${operation}`,
    message: error.message,
    timestamp: new Date().toISOString()
  });
}

// ===== ROUTES GET =====

/**
 * GET /projects - Lister tous les projets
 */
router.get("/projects", async (req, res) => {
  try {
    const { PATHS } = await import('../../app-server/cores/constants.js');
    
    const projectFolders = await readdir(PATHS.dataOutputs);
    const projects = [];
    
    for (const folder of projectFolders) {
      try {
        const projectPath = join(PATHS.dataOutputs, folder);
        const projectFile = join(projectPath, "project.json");
        const content = await readFile(projectFile, "utf8");
        const projectData = JSON.parse(content);
        projects.push(projectData);
      } catch (projectError) {
        // Skip invalid projects silently
        continue;
      }
    }
    
    res.json({
      success: true,
      data: {
        projects,
        count: projects.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleRouteError(res, error, "list projects");
  }
});

/**
 * GET /projects/:id - Récupérer un projet spécifique
 */
router.get("/projects/:id", async (req, res) => {
  const { id: projectId } = req.params;
  
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'projectId must be non-empty string'
    });
  }

  try {
    const { PATHS } = await import('../../app-server/cores/constants.js');
    
    const projectFile = join(PATHS.dataOutputs, projectId, "project.json");
    
    try {
      const content = await readFile(projectFile, "utf8");
      const projectData = JSON.parse(content);

      res.json({
        success: true,
        data: {
          project: projectData,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
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

// ===== ROUTES WORKFLOWS =====

router.post("/projects", handleWorkflowRequest);
router.post("/projects/:id/build", handleWorkflowRequest);
router.post("/projects/:id/deploy", handleWorkflowRequest);
router.post("/projects/:id/start", handleWorkflowRequest);
router.post("/projects/:id/stop", handleWorkflowRequest);
router.delete("/projects/:id", handleWorkflowRequest);
router.put("/projects/:id/revert", handleWorkflowRequest);
router.post("/projects/:id/revert", handleWorkflowRequest);

export default router;