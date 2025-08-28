/**
 * CALL 12: Response Parser - Parse workflowResult en structure HTTP
 * @param {object} workflowResult - Résultat du workflow coordinator
 * @returns {Promise<{success: boolean, data: object}>} Structure parsée pour processor
 * @throws {Error} ValidationError si workflowResult invalide
 */

export async function response(workflowResult) {
  console.log(`[RESPONSE-PARSER] CALL 12: Parsing workflow result...`);
  
  // Validation du paramètre d'entrée
  const validation = validateWorkflowResult(workflowResult);
  if (!validation.valid) {
    console.log(`[RESPONSE-PARSER] Validation failed: ${validation.error}`);
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  if (!workflowResult.success) {
    console.log(`[RESPONSE-PARSER] Workflow failed: ${workflowResult.error}`);
    return {
      success: false,
      error: workflowResult.error
    };
  }

  const { projectId, fromState, toState, duration } = workflowResult.data;
  
  // Déterminer l'action à partir de la transition d'état
  const action = determineActionFromTransition(fromState, toState);
  console.log(`[RESPONSE-PARSER] Action determined: ${action} (${fromState} → ${toState})`);
  
  // Générer le message approprié
  const message = generateActionMessage(action, projectId);
  
  // Structure de données parsée pour le processor
  const parsedData = {
    action,
    message,
    project: {
      id: projectId,
      fromState,
      toState,
      duration
    },
    metadata: {
      timestamp: new Date().toISOString(),
      parsedBy: 'response-parser',
      workflowSuccess: true
    },
    // Préserver les données additionnelles du workflow
    ...extractAdditionalData(workflowResult.data)
  };

  console.log(`[RESPONSE-PARSER] Parsing completed successfully for action: ${action}`);
  return {
    success: true,
    data: parsedData
  };
}

/**
 * Valide la structure du résultat de workflow
 * @param {object} workflowResult - Résultat à valider
 * @returns {{valid: boolean, error?: string}}
 */
function validateWorkflowResult(workflowResult) {
  if (!workflowResult) {
    return { valid: false, error: 'workflowResult is required' };
  }
  
  if (typeof workflowResult !== 'object') {
    return { valid: false, error: 'workflowResult must be an object' };
  }
  
  if (typeof workflowResult.success !== 'boolean') {
    return { valid: false, error: 'workflowResult.success must be boolean' };
  }
  
  if (!workflowResult.success) {
    // En cas d'échec, on valide juste que error existe
    if (!workflowResult.error) {
      return { valid: false, error: 'workflowResult.error is required when success is false' };
    }
    return { valid: true };
  }
  
  // Validation pour les cas de succès
  if (!workflowResult.data) {
    return { valid: false, error: 'workflowResult.data is required when success is true' };
  }
  
  const { projectId, fromState, toState } = workflowResult.data;
  
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: 'workflowResult.data.projectId must be non-empty string' };
  }
  
  if (!fromState || typeof fromState !== 'string') {
    return { valid: false, error: 'workflowResult.data.fromState must be non-empty string' };
  }
  
  if (!toState || typeof toState !== 'string') {
    return { valid: false, error: 'workflowResult.data.toState must be non-empty string' };
  }
  
  return { valid: true };
}

/**
 * Détermine l'action à partir de la transition d'état
 * @param {string} fromState - État de départ
 * @param {string} toState - État d'arrivée
 * @returns {string} Action correspondante
 */
function determineActionFromTransition(fromState, toState) {
  // Mapping des transitions vers les actions
  const STATE_TRANSITIONS = {
    'VOID→DRAFT': 'CREATE',
    'DRAFT→BUILT': 'BUILD',
    'BUILT→OFFLINE': 'DEPLOY',
    'OFFLINE→ONLINE': 'START',
    'ONLINE→OFFLINE': 'STOP',
    'BUILT→DRAFT': 'REVERT',
    'OFFLINE→DRAFT': 'REVERT',
    'ANY→VOID': 'DELETE'
  };
  
  // Construire la clé de transition
  const transitionKey = `${fromState}→${toState}`;
  
  // Cas spéciaux
  if (toState === 'VOID') {
    return 'DELETE';
  }
  
  if (fromState === toState && (fromState === 'ONLINE' || fromState === 'OFFLINE')) {
    return 'UPDATE';
  }
  
  // Lookup dans la table de mapping
  const action = STATE_TRANSITIONS[transitionKey];
  
  if (!action) {
    console.log(`[RESPONSE-PARSER] Unknown transition: ${transitionKey}, defaulting to UNKNOWN`);
    return 'UNKNOWN';
  }
  
  return action;
}

/**
 * Génère un message approprié pour l'action
 * @param {string} action - Action exécutée
 * @param {string} projectId - ID du projet
 * @returns {string} Message formaté
 */
function generateActionMessage(action, projectId) {
  const ACTION_MESSAGES = {
    CREATE: `Project ${projectId} created successfully`,
    BUILD: `Project ${projectId} built successfully`,
    DEPLOY: `Project ${projectId} deployed successfully`,
    START: `Project ${projectId} started successfully`,
    STOP: `Project ${projectId} stopped successfully`,
    DELETE: `Project ${projectId} deleted successfully`,
    UPDATE: `Project ${projectId} updated successfully`,
    REVERT: `Project ${projectId} reverted successfully`
  };
  
  return ACTION_MESSAGES[action] || `Project ${projectId} processed successfully`;
}

/**
 * Extrait les données additionnelles du workflow result
 * @param {object} workflowData - Données du workflow
 * @returns {object} Données additionnelles nettoyées
 */
function extractAdditionalData(workflowData) {
  const additionalData = {};
  
  // Données optionnelles à préserver
  const OPTIONAL_FIELDS = [
    'templateUsed',
    'servicesGenerated', 
    'artifacts',
    'fallbackUsed',
    'fileWritten',
    'buildStats'
  ];
  
  OPTIONAL_FIELDS.forEach(field => {
    if (workflowData[field] !== undefined) {
      additionalData[field] = workflowData[field];
    }
  });
  
  return additionalData;
}

console.log(`[RESPONSE-PARSER] Response parser module loaded`);

export default { response };