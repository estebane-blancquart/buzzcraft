import express from "express";
import cors from "cors";
import { readdir, readFile, writeFile, rm } from 'fs/promises';
import { join } from "path";
import { request } from "./request/parser.js";
import { process as processRequest } from "./request/processor.js";
import { response } from "./response/parser.js";
import { process as processResponse } from "./response/processor.js";
import { createWorkflow } from "../app-server/engines/create/coordinator.js";
import { buildWorkflow } from "../app-server/engines/build/coordinator.js";
import { deployWorkflow } from "../app-server/engines/deploy/coordinator.js";
import { startWorkflow } from "../app-server/engines/start/coordinator.js";
import { stopWorkflow } from "../app-server/engines/stop/coordinator.js";
import { deleteWorkflow } from "../app-server/engines/delete/coordinator.js";
import { updateWorkflow } from "../app-server/engines/update/coordinator.js";

const app = express();
app.use(cors());
app.use(express.json());

// Validation helpers
function validateProjectInput(data) {
  const errors = [];
  
  if (!data.projectId || typeof data.projectId !== 'string') {
    errors.push('projectId must be a non-empty string');
  }
  
  if (data.projectId && !/^[a-z0-9-]+$/.test(data.projectId)) {
    errors.push('projectId must contain only lowercase letters, numbers, and hyphens');
  }
  
  if (!data.config || typeof data.config !== 'object') {
    errors.push('config must be an object');
  }
  
  if (data.config && (!data.config.name || typeof data.config.name !== 'string')) {
    errors.push('config.name must be a non-empty string');
  }
  
  if (data.config && data.config.template && !['basic', 'test-button'].includes(data.config.template)) {
    errors.push('config.template must be one of: basic, test-button');
  }
  
  return errors;
}

function validateProjectId(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    return 'Project ID must be a non-empty string';
  }
  
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return 'Project ID must contain only lowercase letters, numbers, and hyphens';
  }
  
  return null;
}

// Workflow mapping
const workflows = {
  CREATE: createWorkflow,
  BUILD: buildWorkflow,
  DEPLOY: deployWorkflow,
  START: startWorkflow,
  STOP: stopWorkflow,
  DELETE: deleteWorkflow,
  UPDATE: updateWorkflow,
};

// Generic request handler with validation
async function handleRequest(req, res) {
  try {
    // Parse request
    const requestResult = await request(req);
    if (!requestResult.success) {
      return res.status(400).json({ 
        success: false,
        error: requestResult.error 
      });
    }

    // Process request
    const processedRequest = await processRequest(requestResult.data);
    if (!processedRequest.success) {
      return res.status(400).json({ 
        success: false,
        error: processedRequest.error 
      });
    }

    // Execute workflow
    const workflowFn = workflows[processedRequest.data.action];
    if (!workflowFn) {
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${processedRequest.data.action}`
      });
    }

    const workflowResult = await workflowFn(
      processedRequest.data.projectId,
      processedRequest.data.config
    );

    // Parse response
    const responseResult = await response(workflowResult);
    if (!responseResult.success) {
      return res.status(500).json({ 
        success: false,
        error: responseResult.error 
      });
    }

    // Process response
    const processedResponse = await processResponse(responseResult);
    if (!processedResponse.success) {
      return res.status(500).json({ 
        success: false,
        error: processedResponse.error 
      });
    }

    res.json({
      success: true,
      ...processedResponse.data
    });
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}

// Route pour lister tous les projets
app.get("/projects", async (req, res) => {
  try {
    const projectsDir = '../app-server/outputs/projects';
    const projects = [];
    
    // Lire tous les dossiers dans outputs/projects/
    const folders = await readdir(projectsDir);
    
    for (const folder of folders) {
      try {
        // Lire le project.json de chaque dossier
        const projectFile = join(projectsDir, folder, 'project.json');
        const content = await readFile(projectFile, 'utf8');
        const projectData = JSON.parse(content);
        
        projects.push({
          id: projectData.id,
          name: projectData.name,
          state: projectData.state,
          template: projectData.template,
          created: projectData.created
        });
      } catch (error) {
        // Skip si pas de project.json ou erreur de lecture
        console.error(`Skipping ${folder}: ${error.message}`);
      }
    }
    
    res.json({ 
      success: true,
      projects 
    });
  } catch (error) {
    console.error('Error loading projects:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load projects' 
    });
  }
});

// Route pour créer un projet avec validation
app.post("/projects", async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateProjectInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Use generic handler
    await handleRequest(req, res);
  } catch (error) {
    console.error('Create project error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create project' 
    });
  }
});

// Route pour remettre un projet BUILT en DRAFT
app.put("/projects/:id/revert", async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Validate project ID
    const validationError = validateProjectId(projectId);
    if (validationError) {
      return res.status(400).json({ 
        success: false,
        error: validationError 
      });
    }
    
    const projectPath = `../app-server/outputs/projects/${projectId}`;
    
    // Lire le project.json
    const projectFile = join(projectPath, 'project.json');
    const content = await readFile(projectFile, 'utf8');
    const projectData = JSON.parse(content);
    
    // Vérifier que le projet est BUILT
    if (projectData.state !== 'BUILT') {
      return res.status(400).json({ 
        success: false,
        error: `Project ${projectId} must be in BUILT state for revert (current: ${projectData.state})` 
      });
    }
    
    // Remettre en DRAFT
    projectData.state = 'DRAFT';
    projectData.revertedAt = new Date().toISOString();
    
    // Sauvegarder project.json
    await writeFile(projectFile, JSON.stringify(projectData, null, 2), 'utf8');
    
    res.json({ 
      success: true,
      message: `Project ${projectId} reverted to DRAFT successfully`,
      project: {
        id: projectId,
        fromState: 'BUILT',
        toState: 'DRAFT'
      }
    });
    
  } catch (error) {
    console.error('Revert error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to revert project' 
    });
  }
});

// Route pour supprimer complètement un projet
app.delete("/projects/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Validate project ID
    const validationError = validateProjectId(projectId);
    if (validationError) {
      return res.status(400).json({ 
        success: false,
        error: validationError 
      });
    }
    
    const projectPath = `../app-server/outputs/projects/${projectId}`;
    
    // Vérifier que le projet existe
    try {
      const projectFile = join(projectPath, 'project.json');
      const content = await readFile(projectFile, 'utf8');
      const projectData = JSON.parse(content);
      
      console.log(`[DELETE] Deleting project ${projectId} (${projectData.state})`);
    } catch (error) {
      return res.status(404).json({ 
        success: false,
        error: `Project ${projectId} not found` 
      });
    }
    
    // Supprimer tout le dossier projet
    await rm(projectPath, { recursive: true, force: true });
    
    console.log(`[DELETE] Project ${projectId} deleted successfully`);
    
    res.json({ 
      success: true,
      message: `Project ${projectId} deleted successfully`,
      project: {
        id: projectId,
        fromState: 'ANY',
        toState: 'VOID'
      }
    });
    
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete project' 
    });
  }
});

// Routes avec validation des paramètres
app.post("/projects/:id/build", (req, res) => {
  const validationError = validateProjectId(req.params.id);
  if (validationError) {
    return res.status(400).json({ 
      success: false,
      error: validationError 
    });
  }
  handleRequest(req, res);
});

app.post("/projects/:id/deploy", (req, res) => {
  const validationError = validateProjectId(req.params.id);
  if (validationError) {
    return res.status(400).json({ 
      success: false,
      error: validationError 
    });
  }
  handleRequest(req, res);
});

app.post("/projects/:id/start", (req, res) => {
  const validationError = validateProjectId(req.params.id);
  if (validationError) {
    return res.status(400).json({ 
      success: false,
      error: validationError 
    });
  }
  handleRequest(req, res);
});

app.post("/projects/:id/stop", (req, res) => {
  const validationError = validateProjectId(req.params.id);
  if (validationError) {
    return res.status(400).json({ 
      success: false,
      error: validationError 
    });
  }
  handleRequest(req, res);
});

app.put("/projects/:id", (req, res) => {
  const validationError = validateProjectId(req.params.id);
  if (validationError) {
    return res.status(400).json({ 
      success: false,
      error: validationError 
    });
  }
  handleRequest(req, res);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`BuzzCraft API running on http://localhost:${PORT}`);
});