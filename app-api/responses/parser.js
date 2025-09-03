/**
 * CALL 12: Response Parser - Parse workflowResult en structure HTTP
 * @param {object} workflowResult - Résultat du workflow coordinator
 * @returns {Promise<{success: boolean, data: object}>} Structure parsée pour processor
 * @throws {Error} ValidationError si workflowResult invalide
 */

export async function response(workflowResult) {
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

  return {
    success: true,
    data: parsedData
  };
}

/**
 * Valide la structure du résultat de workflow
 * @param {object} workflowResult - Résultat à valider
 * @returns {{valid: boolean, error?: string}}
 * @private
 */
function validateWorkflowResult(workflowResult) {
  if (!workflowResult) {
    return { valid: false, error: 'workflowResult is required' };
  }

  if (typeof workflowResult !== 'object') {
    return { valid: false, error: 'workflowResult must be an object' };
  }

  // Pour les workflows échoués, on a besoin au minimum de success: false
  if (workflowResult.success === false) {
    if (!workflowResult.error) {
      return { valid: false, error: 'Failed workflow must have error field' };
    }
    return { valid: true }; // Échec valide
  }

  // Pour les workflows réussis, validation plus stricte
  if (workflowResult.success !== true) {
    return { valid: false, error: 'workflowResult.success must be boolean' };
  }

  if (!workflowResult.data) {
    return { valid: false, error: 'Successful workflow must have data field' };
  }

  // Validation des champs requis dans data
  const requiredDataFields = ['projectId', 'fromState', 'toState'];
  for (const field of requiredDataFields) {
    if (!workflowResult.data[field]) {
      return { valid: false, error: `Missing required data field: ${field}` };
    }
  }

  return { valid: true };
}

/**
 * Détermine l'action à partir de la transition d'état
 * @param {string} fromState - État initial
 * @param {string} toState - État final
 * @returns {string} Action déduite
 * @private
 */
function determineActionFromTransition(fromState, toState) {
  // Mapping des transitions vers actions
  const transitions = {
    'VOID->DRAFT': 'CREATE',
    'DRAFT->BUILT': 'BUILD',
    'BUILT->OFFLINE': 'DEPLOY',
    'OFFLINE->ONLINE': 'START',
    'ONLINE->OFFLINE': 'STOP',
    'BUILT->DRAFT': 'REVERT',
    'ANY->VOID': 'DELETE',
    'DRAFT->VOID': 'DELETE',
    'BUILT->VOID': 'DELETE',
    'OFFLINE->VOID': 'DELETE',
    'ONLINE->VOID': 'DELETE'
  };

  const transitionKey = `${fromState}->${toState}`;
  
  // Recherche exacte
  if (transitions[transitionKey]) {
    return transitions[transitionKey];
  }
  
  // Recherche avec pattern ANY
  const anyTransitionKey = `ANY->${toState}`;
  if (transitions[anyTransitionKey]) {
    return transitions[anyTransitionKey];
  }
  
  // Recherche par état final pour certains cas
  switch (toState) {
    case 'VOID':
      return 'DELETE';
    case 'DRAFT':
      return fromState === 'BUILT' ? 'REVERT' : 'CREATE';
    case 'BUILT':
      return 'BUILD';
    case 'OFFLINE':
      return 'DEPLOY';
    case 'ONLINE':
      return 'START';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Génère un message approprié pour l'action
 * @param {string} action - Action effectuée
 * @param {string} projectId - ID du projet
 * @returns {string} Message formaté
 * @private
 */
function generateActionMessage(action, projectId) {
  const messages = {
    'CREATE': `Project '${projectId}' created successfully`,
    'BUILD': `Project '${projectId}' built successfully`,
    'DEPLOY': `Project '${projectId}' deployed successfully`,
    'START': `Project '${projectId}' started successfully`,
    'STOP': `Project '${projectId}' stopped successfully`,
    'REVERT': `Project '${projectId}' reverted successfully`,
    'DELETE': `Project '${projectId}' deleted successfully`,
    'UPDATE': `Project '${projectId}' updated successfully`,
    'UNKNOWN': `Project '${projectId}' processed successfully`
  };

  return messages[action] || messages['UNKNOWN'];
}

/**
 * Extrait les données additionnelles du résultat de workflow
 * @param {object} workflowData - Données du workflow
 * @returns {object} Données additionnelles extraites
 * @private
 */
function extractAdditionalData(workflowData) {
  const additionalData = {};

  // Préservation des données spécifiques selon le type de workflow
  if (workflowData.project) {
    additionalData.projectDetails = workflowData.project;
  }

  if (workflowData.build) {
    additionalData.buildInfo = workflowData.build;
  }

  if (workflowData.deployment) {
    additionalData.deploymentInfo = workflowData.deployment;
  }

  if (workflowData.workflow) {
    additionalData.workflowInfo = workflowData.workflow;
  }

  if (workflowData.files) {
    additionalData.filesInfo = workflowData.files;
  }

  if (workflowData.deletion) {
    additionalData.deletionInfo = workflowData.deletion;
  }

  if (workflowData.backup) {
    additionalData.backupInfo = workflowData.backup;
  }

  // Préservation des métadonnées temporelles
  if (workflowData.createdAt) {
    additionalData.createdAt = workflowData.createdAt;
  }

  if (workflowData.builtAt) {
    additionalData.builtAt = workflowData.builtAt;
  }

  if (workflowData.deployedAt) {
    additionalData.deployedAt = workflowData.deployedAt;
  }

  // Préservation des informations de template utilisé
  if (workflowData.templateUsed) {
    additionalData.templateUsed = workflowData.templateUsed;
  }

  return additionalData;
}