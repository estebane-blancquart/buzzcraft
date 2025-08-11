import express from 'express';
import { readdir, readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { request } from './request/parser.js';
import { process as processRequest } from './request/processor.js';
import { response } from './response/parser.js';
import { process as processResponse } from './response/processor.js';
import { createWorkflow } from '../app-server/engines/create/coordinator.js';
import { buildWorkflow } from '../app-server/engines/build/coordinator.js';

/*
 * FAIT QUOI : Routes HTTP pour gestion des projets
 * REÇOIT : Express router
 * RETOURNE : Router configuré avec routes /projects
 * ERREURS : Gestion erreurs HTTP, validation dans pattern 12 CALLS
 */

const router = express.Router();

// Workflow mapping (seulement ceux utilisés)
const workflows = {
  CREATE: createWorkflow,
  BUILD: buildWorkflow
};

// Generic request handler avec pattern 12 CALLS
async function handleRequest(req, res) {
  try {
    // Parse request (CALL 1) - validation incluse
    const requestResult = await request(req);
    if (!requestResult.success) {
      return res.status(400).json({ 
        success: false,
        error: requestResult.error 
      });
    }

    // Process request (CALL 2)
    const processedRequest = await processRequest(requestResult.data);
    if (!processedRequest.success) {
      return res.status(400).json({ 
        success: false,
        error: processedRequest.error 
      });
    }

    // Execute workflow (CALL 3-10)
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

    // Parse response (CALL 11)
    const responseResult = await response(workflowResult);
    if (!responseResult.success) {
      return res.status(500).json({ 
        success: false,
        error: responseResult.error 
      });
    }

    // Process response (CALL 12)
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
    console.error('Request handler error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}

// GET /projects - Lister tous les projets
router.get('/', async (req, res) => {
  try {
    const projectsDir = '../app-server/outputs/projects';
    const projects = [];
    
    const folders = await readdir(projectsDir);
    
    for (const folder of folders) {
      try {
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

// POST /projects - Créer un projet (pattern 12 CALLS)
router.post('/', handleRequest);

// PUT /projects/:id/revert - Remettre BUILT en DRAFT (défaire le build)
router.put('/:id/revert', async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectPath = `../app-server/outputs/projects/${projectId}`;
    const projectFile = join(projectPath, 'project.json');
    const content = await readFile(projectFile, 'utf8');
    const projectData = JSON.parse(content);
    
    if (projectData.state !== 'BUILT') {
      return res.status(400).json({ 
        success: false,
        error: `Project ${projectId} must be in BUILT state for revert (current: ${projectData.state})` 
      });
    }
    
    // Supprimer les services générés par BUILD
    const servicesToClean = [
      join(projectPath, 'app-visitor'),
      join(projectPath, 'server'),
      join(projectPath, 'app-manager')
    ];
    
    for (const servicePath of servicesToClean) {
      try {
        await rm(servicePath, { recursive: true, force: true });
        console.log(`[REVERT] Cleaned: ${servicePath}`);
      } catch (error) {
        console.log(`[REVERT] Service not found (OK): ${servicePath}`);
      }
    }
    
    // Remettre l'état en DRAFT
    projectData.state = 'DRAFT';
    projectData.revertedAt = new Date().toISOString();
    delete projectData.lastBuild; // Supprimer la date de build
    
    await writeFile(projectFile, JSON.stringify(projectData, null, 2), 'utf8');
    
    console.log(`[REVERT] Project ${projectId} reverted to DRAFT, services cleaned`);
    
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

// DELETE /projects/:id - Supprimer un projet (action directe)
router.delete('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectPath = `../app-server/outputs/projects/${projectId}`;
    
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

// POST /projects/:id/build - Builder un projet (pattern 12 CALLS)
router.post('/:id/build', handleRequest);

export default router;