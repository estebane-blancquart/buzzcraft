/**
 * COMMIT 42 - API Requests
 * 
 * FAIT QUOI : Gestion requêtes API états avec détection temps réel et validation
 * REÇOIT : req: Request, res: Response, projectId?: string, stateType?: string
 * RETOURNE : { success: boolean, state: object, detection: object, timing: number }
 * ERREURS : StateDetectionError si détection échoue, ProjectNotFoundError si projet inexistant, ValidationError si paramètres invalides
 */

import { detectVoidState } from '../../app-server/states/void/detector.js';
import { detectDraftState } from '../../app-server/states/draft/detector.js';
import { detectBuiltState } from '../../app-server/states/built/detector.js';
import { detectOfflineState } from '../../app-server/states/offline/detector.js';
import { detectOnlineState } from '../../app-server/states/online/detector.js';

const STATE_DETECTORS = {
  'void': detectVoidState,
  'draft': detectDraftState,
  'built': detectBuiltState,
  'offline': detectOfflineState,
  'online': detectOnlineState
};

export async function getProjectStateRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { projectId } = req.params;

    if (!projectId) {
      throw new Error('ValidationError: projectId requis dans URL');
    }

    // Détecter état actuel en testant tous les détecteurs
    const stateDetection = await detectCurrentProjectState(projectId);

    const response = {
      success: true,
      state: {
        current: stateDetection.current,
        valid: stateDetection.valid,
        confidence: stateDetection.confidence,
        lastChanged: stateDetection.lastChanged,
        metadata: stateDetection.metadata
      },
      detection: {
        method: 'multi-detector',
        checkedStates: stateDetection.checkedStates,
        conflicts: stateDetection.conflicts || []
      },
      metadata: {
        endpoint: 'GET /api/states/:projectId',
        timing: Date.now() - startTime,
        cached: false
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleStateRequestError(error, res, startTime, 'GET_STATE');
  }
}

export async function validateStateRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { projectId, expectedState } = req.params;

    if (!projectId || !expectedState) {
      throw new Error('ValidationError: projectId et expectedState requis');
    }

    if (!STATE_DETECTORS[expectedState.toLowerCase()]) {
      throw new Error(`ValidationError: État '${expectedState}' non reconnu`);
    }

    // Valider si projet est dans l'état attendu
    const detector = STATE_DETECTORS[expectedState.toLowerCase()];
    const detectionResult = await detector(projectId);

    const isValid = detectionResult.detected;
    const response = {
      success: true,
      validation: {
        projectId,
        expectedState: expectedState.toUpperCase(),
        actualState: detectionResult.detected ? expectedState.toUpperCase() : 'UNKNOWN',
        valid: isValid,
        confidence: detectionResult.confidence || 0
      },
      details: detectionResult.details || {},
      metadata: {
        endpoint: `POST /api/states/${projectId}/validate/${expectedState}`,
        timing: Date.now() - startTime,
        detector: expectedState.toLowerCase()
      },
      timing: Date.now() - startTime
    };

    res.status(isValid ? 200 : 409).json(response);

  } catch (error) {
    handleStateRequestError(error, res, startTime, 'VALIDATE_STATE');
  }
}

export async function getStateHistoryRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { projectId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    if (!projectId) {
      throw new Error('ValidationError: projectId requis');
    }

    // Mock historique états (en attendant integration avec logging)
    const mockHistory = [
      {
        state: 'VOID',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        transition: 'initial',
        duration: 0
      },
      {
        state: 'DRAFT',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        transition: 'create',
        duration: 2400000
      },
      {
        state: 'BUILT',
        timestamp: new Date(Date.now() - 600000).toISOString(), 
        transition: 'build',
        duration: 45000
      }
    ];

    const response = {
      success: true,
      data: {
        projectId,
        history: mockHistory.slice(offset, offset + limit),
        pagination: {
          limit,
          offset,
          total: mockHistory.length
        }
      },
      metadata: {
        endpoint: 'GET /api/states/:projectId/history',
        timing: Date.now() - startTime,
        source: 'state-logging'
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleStateRequestError(error, res, startTime, 'GET_HISTORY');
  }
}

export async function getAllStatesRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const filter = req.query.filter;
    const includeDetails = req.query.details === 'true';

    // Lister tous les états disponibles
    const allStates = [
      {
        name: 'VOID',
        description: 'Projet inexistant ou supprimé',
        detector: 'void',
        transitions: ['create']
      },
      {
        name: 'DRAFT',
        description: 'Projet en cours de développement',
        detector: 'draft',
        transitions: ['save', 'build', 'edit', 'delete']
      },
      {
        name: 'BUILT',
        description: 'Projet construit et prêt au déploiement',
        detector: 'built',
        transitions: ['deploy', 'edit', 'delete']
      },
      {
        name: 'OFFLINE',
        description: 'Projet déployé mais arrêté',
        detector: 'offline',
        transitions: ['start', 'update', 'delete']
      },
      {
        name: 'ONLINE',
        description: 'Projet déployé et en fonctionnement',
        detector: 'online',
        transitions: ['stop', 'update']
      }
    ];

    let filteredStates = allStates;
    if (filter) {
      filteredStates = allStates.filter(state => 
        state.name.toLowerCase().includes(filter.toLowerCase()) ||
        state.description.toLowerCase().includes(filter.toLowerCase())
      );
    }

    const response = {
      success: true,
      data: {
        states: filteredStates,
        count: filteredStates.length
      },
      metadata: {
        endpoint: 'GET /api/states',
        timing: Date.now() - startTime,
        includeDetails,
        filter
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleStateRequestError(error, res, startTime, 'GET_ALL_STATES');
  }
}

async function detectCurrentProjectState(projectId) {
  const checkedStates = [];
  const detectedStates = [];

  // Tester tous les détecteurs
  for (const [stateName, detector] of Object.entries(STATE_DETECTORS)) {
    try {
      const result = await detector(projectId);
      checkedStates.push(stateName.toUpperCase());
      
      if (result.detected) {
        detectedStates.push({
          state: stateName.toUpperCase(),
          confidence: result.confidence || 100,
          metadata: result.details || {}
        });
      }
    } catch (detectionError) {
      checkedStates.push(`${stateName.toUpperCase()}_ERROR`);
    }
  }

  // Résoudre conflits s'il y en a
  if (detectedStates.length === 0) {
    throw new Error('StateDetectionError: Aucun état détecté pour ce projet');
  }

  if (detectedStates.length > 1) {
    // Prendre l'état avec la plus haute confidence
    detectedStates.sort((a, b) => b.confidence - a.confidence);
  }

  const primaryState = detectedStates[0];
  
  return {
    current: primaryState.state,
    valid: true,
    confidence: primaryState.confidence,
    lastChanged: new Date().toISOString(),
    metadata: primaryState.metadata,
    checkedStates,
    conflicts: detectedStates.length > 1 ? detectedStates.slice(1) : []
  };
}

function handleStateRequestError(error, res, startTime, operation) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';

  if (error.message.includes('ValidationError')) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.message.includes('StateDetectionError')) {
    statusCode = 500;
    errorCode = 'DETECTION_ERROR';
  } else if (error.message.includes('ProjectNotFoundError')) {
    statusCode = 404;
    errorCode = 'PROJECT_NOT_FOUND';
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
      retryable: !error.message.includes('ValidationError')
    },
    timing: Date.now() - startTime
  };

  res.status(statusCode).json(errorResponse);
}

// requests/states : API Requests (commit 42)
// DEPENDENCY FLOW : api/requests/ → api/schemas/ → engines/ → states/ → systems/
