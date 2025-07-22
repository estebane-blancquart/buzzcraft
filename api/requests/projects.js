/**
 * COMMIT 42 - API Requests
 * 
 * FAIT QUOI : Gestion requêtes API projets avec validation et workflows engines
 * REÇOIT : req: Request, res: Response, projectId?: string, action?: string
 * RETOURNE : { success: boolean, data: object, metadata: object, timing: number }
 * ERREURS : RequestValidationError si requête invalide, EngineExecutionError si workflow échoue, ProjectNotFoundError si projet inexistant
 */

import { validateRequestSchema } from '../schemas/request-schemas.js';
import { executeCreateWorkflow } from '../../app-server/engines/create/workflow.js';
import { executeEditWorkflow } from '../../app-server/engines/edit/workflow.js';
import { executeDeleteWorkflow } from '../../app-server/engines/delete/workflow.js';

export async function createProjectRequest(req, res) {
  const startTime = Date.now();
  
  try {
    // 1. Valider requête
    const validation = await validateRequestSchema(req.body, '/api/projects', 'POST', true);
    if (!validation.valid) {
      throw new Error(`RequestValidationError: ${validation.errors.length} erreurs de validation`);
    }

    // 2. Préparer configuration création
    const createConfig = {
      name: validation.sanitized.name,
      template: validation.sanitized.template,
      description: validation.sanitized.description || '',
      settings: validation.sanitized.settings || {}
    };

    // 3. Appeler engine création
    const result = await executeCreateWorkflow(createConfig.name, createConfig);
    
    // 4. Formater réponse succès
    const response = {
      success: true,
      data: {
        project: {
          id: result.projectId,
          name: createConfig.name,
          template: createConfig.template,
          state: 'DRAFT',
          createdAt: new Date().toISOString()
        }
      },
      metadata: {
        endpoint: 'POST /api/projects',
        timing: Date.now() - startTime,
        validation: {
          sanitized: validation.sanitized.length || 0,
          errors: validation.errors.length
        }
      },
      timing: Date.now() - startTime
    };

    res.status(201).json(response);

  } catch (error) {
    // 5. Gestion erreurs
    handleProjectRequestError(error, res, startTime, 'CREATE');
  }
}

export async function getProjectRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const projectId = req.params.id;
    
    if (!projectId) {
      throw new Error('RequestValidationError: projectId requis dans URL');
    }

    // Simuler récupération projet (en attendant integration avec states)
    const mockProject = {
      id: projectId,
      name: `project-${projectId}`,
      state: 'DRAFT',
      template: 'react',
      createdAt: new Date().toISOString()
    };

    const response = {
      success: true,
      data: {
        project: mockProject
      },
      metadata: {
        endpoint: 'GET /api/projects/:id',
        timing: Date.now() - startTime,
        cached: false
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleProjectRequestError(error, res, startTime, 'GET');
  }
}

export async function updateProjectRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const projectId = req.params.id;
    
    if (!projectId) {
      throw new Error('RequestValidationError: projectId requis dans URL');
    }

    // 1. Valider requête
    const validation = await validateRequestSchema(req.body, '/api/projects/:id', 'PUT', true);
    if (!validation.valid) {
      throw new Error(`RequestValidationError: ${validation.errors.length} erreurs de validation`);
    }

    // 2. Préparer configuration édition
    const editConfig = {
      name: validation.sanitized.name,
      description: validation.sanitized.description,
      settings: validation.sanitized.settings
    };

    // 3. Appeler engine édition
    const result = await executeEditWorkflow(projectId, editConfig);

    // 4. Formater réponse
    const response = {
      success: true,
      data: {
        project: {
          id: projectId,
          name: editConfig.name,
          state: result.newState,
          updatedAt: new Date().toISOString()
        }
      },
      metadata: {
        endpoint: 'PUT /api/projects/:id',
        timing: Date.now() - startTime,
        stateTransition: `${result.previousState} → ${result.newState}`
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleProjectRequestError(error, res, startTime, 'UPDATE');
  }
}

export async function deleteProjectRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const projectId = req.params.id;
    
    if (!projectId) {
      throw new Error('RequestValidationError: projectId requis dans URL');
    }

    // Appeler engine suppression
    const result = await executeDeleteWorkflow(projectId);

    const response = {
      success: true,
      data: {
        projectId,
        deleted: true,
        previousState: result.previousState
      },
      metadata: {
        endpoint: 'DELETE /api/projects/:id',
        timing: Date.now() - startTime,
        cleanup: result.cleanupActions || []
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleProjectRequestError(error, res, startTime, 'DELETE');
  }
}

export async function listProjectsRequest(req, res) {
  const startTime = Date.now();
  
  try {
    // 1. Valider requête query params
    const validation = await validateRequestSchema(req.query, '/api/projects', 'GET', false);
    if (!validation.valid) {
      throw new Error(`RequestValidationError: ${validation.errors.length} erreurs dans query params`);
    }

    // 2. Appliquer filtres et pagination
    const filters = validation.normalized;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;

    // Mock de liste projets
    const mockProjects = [
      { id: 'proj-1', name: 'project-one', state: 'DRAFT', template: 'react' },
      { id: 'proj-2', name: 'project-two', state: 'BUILT', template: 'vue' }
    ];

    const response = {
      success: true,
      data: {
        projects: mockProjects.slice(offset, offset + limit),
        pagination: {
          limit,
          offset,
          total: mockProjects.length
        }
      },
      metadata: {
        endpoint: 'GET /api/projects',
        timing: Date.now() - startTime,
        filters: filters
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleProjectRequestError(error, res, startTime, 'LIST');
  }
}

function handleProjectRequestError(error, res, startTime, operation) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';

  if (error.message.includes('RequestValidationError')) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.message.includes('ProjectNotFoundError')) {
    statusCode = 404;
    errorCode = 'PROJECT_NOT_FOUND';
  } else if (error.message.includes('EngineExecutionError')) {
    statusCode = 500;
    errorCode = 'ENGINE_ERROR';
  }

  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: error.message,
      operation,
      timestamp: new Date().toISOString()
    },
    metadata: {
      timing: Date.now() - startTime,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    timing: Date.now() - startTime
  };

  res.status(statusCode).json(errorResponse);
}

// requests/projects : API Requests (commit 42)
// DEPENDENCY FLOW : api/requests/ → api/schemas/ → engines/ → transitions/ → systems/
