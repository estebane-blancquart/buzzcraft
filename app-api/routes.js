import express from 'express';
import { readdir, readFile, writeFile, rm, stat } from 'fs/promises';
import { join } from 'path';
import { request } from './request/parser.js';
import { process as processRequest } from './request/processor.js';
import { response } from './response/parser.js';
import { process as processResponse } from './response/processor.js';
import { createWorkflow } from '../app-server/engines/create/coordinator.js';
import { buildWorkflow } from '../app-server/engines/build/coordinator.js';
import { validateProjectSchema } from '../app-server/systems/schema-validator.js';

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

// GET /projects/:id - Charger un projet pour édition
router.get('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectPath = `../app-server/outputs/projects/${projectId}`;
    const projectFile = join(projectPath, 'project.json');
    
    try {
      const content = await readFile(projectFile, 'utf8');
      const projectData = JSON.parse(content);
      
      // Validation du schema
      const validation = validateProjectSchema(projectData);
      
      res.json({ 
        success: true,
        project: projectData,
        validation: {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings
        }
      });
      
    } catch (error) {
      res.status(404).json({ 
        success: false,
        error: `Project ${projectId} not found` 
      });
    }
    
  } catch (error) {
    console.error('Load project error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load project' 
    });
  }
});

// POST /projects - Créer un projet (pattern 12 CALLS)
router.post('/', handleRequest);

// PATCH /projects/:id - Modification partielle d'un projet
router.patch('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectPath = `../app-server/outputs/projects/${projectId}`;
    const projectFile = join(projectPath, 'project.json');
    const updates = req.body;
    
    // Charger le projet existant
    let currentProject;
    try {
      const content = await readFile(projectFile, 'utf8');
      currentProject = JSON.parse(content);
    } catch (error) {
      return res.status(404).json({ 
        success: false,
        error: `Project ${projectId} not found` 
      });
    }
    
    // Appliquer les modifications (merge profond)
    const updatedProject = deepMerge(currentProject, updates);
    
    // Validation du schema après modification
    const validation = validateProjectSchema(updatedProject);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        error: 'Schema validation failed',
        details: validation.errors,
        warnings: validation.warnings
      });
    }
    
    // Mettre à jour la date de modification
    updatedProject.lastModified = new Date().toISOString();
    
    // Si le projet était BUILT, le remettre en DRAFT
    if (currentProject.state === 'BUILT') {
      console.log(`[PATCH] Project ${projectId} was BUILT, reverting to DRAFT due to modifications`);
      
      // Nettoyer les services générés
      const servicesToClean = [
        join(projectPath, 'app-visitor'),
        join(projectPath, 'server'),
        join(projectPath, 'app-manager')
      ];
      
      for (const servicePath of servicesToClean) {
        try {
          await rm(servicePath, { recursive: true, force: true });
        } catch (error) {
          console.log(`[PATCH] Service not found (OK): ${servicePath}`);
        }
      }
      
      updatedProject.state = 'DRAFT';
    }
    
    // Sauvegarder
    await writeFile(projectFile, JSON.stringify(updatedProject, null, 2), 'utf8');
    
    console.log(`[PATCH] Project ${projectId} updated successfully`);
    
    res.json({ 
      success: true,
      message: `Project ${projectId} updated successfully`,
      project: updatedProject,
      validation: {
        valid: true,
        warnings: validation.warnings
      }
    });
    
  } catch (error) {
    console.error('Patch project error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update project' 
    });
  }
});

// PUT /projects/:id/revert - Remettre BUILT en DRAFT (défaire le build) - VERSION FIXÉE
router.put('/:id/revert', async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectPath = `../app-server/outputs/projects/${projectId}`;
    const projectFile = join(projectPath, 'project.json');
    
    console.log(`[REVERT] Starting revert for project: ${projectId}`);
    console.log(`[REVERT] Project path: ${projectPath}`);
    
    const content = await readFile(projectFile, 'utf8');
    const projectData = JSON.parse(content);
    
    console.log(`[REVERT] Current project state: ${projectData.state}`);
    
    if (projectData.state !== 'BUILT') {
      return res.status(400).json({ 
        success: false,
        error: `Project ${projectId} must be in BUILT state for revert (current: ${projectData.state})` 
      });
    }
    
    // Vérifier ce qui existe avant suppression
    const servicesToClean = [
      join(projectPath, 'app-visitor'),
      join(projectPath, 'server'),
      join(projectPath, 'app-manager')
    ];
    
    console.log(`[REVERT] Services to clean:`, servicesToClean);
    
    // Vérifier l'existence avant suppression
    for (const servicePath of servicesToClean) {
      try {
        const stats = await stat(servicePath);
        console.log(`[REVERT] Found service to delete: ${servicePath} (${stats.isDirectory() ? 'directory' : 'file'})`);
      } catch (error) {
        console.log(`[REVERT] Service not found (will skip): ${servicePath}`);
      }
    }
    
    // Suppression avec logs détaillés
    let cleanedServices = 0;
    for (const servicePath of servicesToClean) {
      try {
        console.log(`[REVERT] Attempting to delete: ${servicePath}`);
        await rm(servicePath, { recursive: true, force: true });
        console.log(`[REVERT] ✅ Successfully deleted: ${servicePath}`);
        cleanedServices++;
      } catch (error) {
        console.log(`[REVERT] ⚠️  Failed to delete ${servicePath}: ${error.message}`);
      }
    }
    
    console.log(`[REVERT] Cleaned ${cleanedServices} services`);
    
    // Vérifier que les services ont bien été supprimés
    console.log(`[REVERT] Verification after cleanup:`);
    for (const servicePath of servicesToClean) {
      try {
        await stat(servicePath);
        console.log(`[REVERT] ❌ STILL EXISTS: ${servicePath}`);
      } catch (error) {
        console.log(`[REVERT] ✅ DELETED: ${servicePath}`);
      }
    }
    
    // Remettre l'état en DRAFT
    projectData.state = 'DRAFT';
    projectData.revertedAt = new Date().toISOString();
    delete projectData.lastBuild; // Supprimer la date de build
    
    await writeFile(projectFile, JSON.stringify(projectData, null, 2), 'utf8');
    
    console.log(`[REVERT] Project ${projectId} state updated to DRAFT`);
    
    res.json({ 
      success: true,
      message: `Project ${projectId} reverted to DRAFT successfully`,
      project: {
        id: projectId,
        fromState: 'BUILT',
        toState: 'DRAFT'
      },
      debug: {
        servicesFound: cleanedServices,
        servicesExpected: servicesToClean.length
      }
    });
    
  } catch (error) {
    console.error('[REVERT] Error:', error.message);
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

// GET /projects/meta/templates - Lister les templates disponibles
router.get('/meta/templates', async (req, res) => {
  try {
    const { discoverAvailableTemplates } = await import('../app-server/transitions/build/loader.js');
    const discovery = await discoverAvailableTemplates();
    
    if (!discovery.loaded) {
      return res.status(500).json({
        success: false,
        error: 'Failed to discover templates'
      });
    }
    
    res.json({
      success: true,
      templates: discovery.data.templates,
      count: discovery.data.count
    });
    
  } catch (error) {
    console.error('Templates discovery error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to discover templates'
    });
  }
});

// POST /projects/:id/validate - Validation du schema sans sauvegarde
router.post('/:id/validate', async (req, res) => {
  try {
    const projectData = req.body;
    
    if (!projectData) {
      return res.status(400).json({
        success: false,
        error: 'Project data is required'
      });
    }
    
    const validation = validateProjectSchema(projectData);
    
    res.json({
      success: true,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      }
    });
    
  } catch (error) {
    console.error('Validation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to validate project'
    });
  }
});

// Fonction helper pour merge profond
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // Merge récursif pour les objets
        result[key] = result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])
          ? deepMerge(result[key], source[key])
          : source[key];
      } else {
        // Remplacement direct pour les primitives et arrays
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

export default router;