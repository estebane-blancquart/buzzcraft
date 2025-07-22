/**
 * COMMIT 42 - API Requests
 * 
 * FAIT QUOI : Gestion requêtes API transitions avec appel direct aux engines workflows
 * REÇOIT : req: Request, res: Response, transitionType: string, projectId: string
 * RETOURNE : { success: boolean, transition: object, state: object, timing: number }
 * ERREURS : TransitionValidationError si transition invalide, StateError si état incompatible, WorkflowError si exécution échoue
 */

import { executeCreateWorkflow } from '../../app-server/engines/create/workflow.js';
import { executeSaveWorkflow } from '../../app-server/engines/save/workflow.js';
import { executeBuildWorkflow } from '../../app-server/engines/build/workflow.js';
import { executeDeployWorkflow } from '../../app-server/engines/deploy/workflow.js';
import { executeStartWorkflow } from '../../app-server/engines/start/workflow.js';
import { executeStopWorkflow } from '../../app-server/engines/stop/workflow.js';
import { executeUpdateWorkflow } from '../../app-server/engines/update/workflow.js';
import { executeMigrateWorkflow } from '../../app-server/engines/migrate/workflow.js';

const TRANSITION_ENGINES = {
  'create': executeCreateWorkflow,
  'save': executeSaveWorkflow,
  'build': executeBuildWorkflow,
  'deploy': executeDeployWorkflow,
  'start': executeStartWorkflow,
  'stop': executeStopWorkflow,
  'update': executeUpdateWorkflow,
  'migrate': executeMigrateWorkflow
};

export async function executeTransitionRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { transitionType, projectId } = req.params;
    const config = req.body || {};

    // 1. Valider type de transition
    if (!TRANSITION_ENGINES[transitionType]) {
      throw new Error(`TransitionValidationError: Type de transition '${transitionType}' non supporté`);
    }

    if (!projectId && transitionType !== 'create') {
      throw new Error('TransitionValidationError: projectId requis pour cette transition');
    }

    // 2. Préparer paramètres selon type de transition
    let engineParams = prepareEngineParams(transitionType, projectId, config);

    // 3. Exécuter workflow engine approprié
    const engineFunction = TRANSITION_ENGINES[transitionType];
    const result = await engineFunction(...engineParams);

    // 4. Formater réponse de transition
    const response = {
      success: true,
      transition: {
        type: transitionType,
        projectId: projectId || result.projectId,
        previousState: result.previousState,
        newState: result.newState,
        executedAt: new Date().toISOString()
      },
      state: {
        current: result.newState,
        valid: true,
        metadata: result.stateMetadata || {}
      },
      metadata: {
        endpoint: `POST /api/transitions/${transitionType}`,
        timing: Date.now() - startTime,
        workflow: {
          steps: result.executedSteps || [],
          recovery: result.recoveryActions || []
        }
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleTransitionRequestError(error, res, startTime, req.params.transitionType);
  }
}

export async function getTransitionStatusRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { transitionId } = req.params;

    if (!transitionId) {
      throw new Error('TransitionValidationError: transitionId requis');
    }

    // Mock de statut transition (en attendant integration avec logging)
    const mockStatus = {
      id: transitionId,
      type: 'build',
      status: 'COMPLETED',
      progress: 100,
      startedAt: new Date(Date.now() - 30000).toISOString(),
      completedAt: new Date().toISOString(),
      steps: [
        { name: 'validation', status: 'COMPLETED', duration: 150 },
        { name: 'execution', status: 'COMPLETED', duration: 2847 },
        { name: 'cleanup', status: 'COMPLETED', duration: 203 }
      ]
    };

    const response = {
      success: true,
      transition: mockStatus,
      metadata: {
        endpoint: 'GET /api/transitions/status/:id',
        timing: Date.now() - startTime,
        realtime: false
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleTransitionRequestError(error, res, startTime, 'STATUS');
  }
}

export async function listTransitionsRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { projectId } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Mock de liste transitions
    const mockTransitions = [
      {
        id: 'trans-1',
        type: 'create',
        projectId: projectId || 'proj-1',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'trans-2', 
        type: 'build',
        projectId: projectId || 'proj-1',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    const response = {
      success: true,
      data: {
        transitions: mockTransitions.slice(offset, offset + limit),
        pagination: {
          limit,
          offset,
          total: mockTransitions.length
        }
      },
      metadata: {
        endpoint: 'GET /api/transitions',
        timing: Date.now() - startTime,
        filters: { projectId }
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleTransitionRequestError(error, res, startTime, 'LIST');
  }
}

function prepareEngineParams(transitionType, projectId, config) {
  switch (transitionType) {
    case 'create':
      return [config.name || 'new-project', {
        template: config.template || 'react',
        description: config.description,
        settings: config.settings
      }];
    
    case 'save':
      return [projectId, {
        content: config.content,
        files: config.files,
        backup: config.createBackup !== false
      }];
    
    case 'build':
      return [projectId, {
        target: config.target || 'production',
        optimization: config.optimization !== false,
        cache: config.useCache !== false
      }];
    
    case 'deploy':
      return [projectId, {
        environment: config.environment || 'staging',
        domain: config.domain,
        ssl: config.ssl !== false
      }];
    
    case 'start':
      return [projectId, {
        port: config.port,
        memory: config.memory,
        replicas: config.replicas || 1
      }];
    
    case 'stop':
      return [projectId, {
        graceful: config.graceful !== false,
        timeout: config.timeout || 30
      }];
    
    case 'update':
      return [projectId, {
        deploymentId: config.deploymentId,
        updateType: config.updateType || 'minor',
        version: config.version,
        rollbackOnFailure: config.rollbackOnFailure !== false
      }];
    
    case 'migrate':
      return [projectId, {
        migrationType: config.migrationType,
        targetTemplate: config.targetTemplate,
        preserveData: config.preserveData !== false
      }];
    
    default:
      throw new Error(`TransitionValidationError: Paramètres non définis pour transition '${transitionType}'`);
  }
}

function handleTransitionRequestError(error, res, startTime, transitionType) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';

  if (error.message.includes('TransitionValidationError')) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.message.includes('StateError')) {
    statusCode = 409;
    errorCode = 'STATE_CONFLICT';
  } else if (error.message.includes('WorkflowError')) {
    statusCode = 500;
    errorCode = 'WORKFLOW_ERROR';
  }

  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: error.message,
      transition: transitionType,
      timestamp: new Date().toISOString()
    },
    metadata: {
      timing: Date.now() - startTime,
      retryable: !error.message.includes('ValidationError')
    },
    timing: Date.now() - startTime
  };

  res.status(statusCode).json(errorResponse);
}

// requests/transitions : API Requests (commit 42)
// DEPENDENCY FLOW : api/requests/ → api/schemas/ → engines/ → transitions/ → systems/
