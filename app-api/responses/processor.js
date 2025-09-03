/**
 * CALL 13: Response Processor - Process données parsées en réponse finale HTTP
 * @param {object} responseData - Données parsées du response parser
 * @returns {Promise<{success: boolean, data: object}>} Réponse finale pour le client
 * @throws {Error} ValidationError si responseData invalide
 */

export async function process(responseData) {
  // Validation du paramètre d'entrée
  const validation = validateResponseData(responseData);
  if (!validation.valid) {
    console.log(`[RESPONSE-PROCESSOR] Validation failed: ${validation.error}`);
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  if (!responseData.success) {
    console.log(`[RESPONSE-PROCESSOR] Response parsing failed: ${responseData.error}`);
    return {
      success: false,
      error: responseData.error
    };
  }

  const { action, message, project, metadata } = responseData.data;
  
  // Structure de réponse finale standardisée
  const finalResponse = {
    // Métadonnées de réponse
    message,
    timestamp: metadata.timestamp,
    version: '1.0.0',
    
    // Données du projet
    project: {
      id: project.id,
      fromState: project.fromState,
      toState: project.toState,
      duration: project.duration
    },
    
    // Métadonnées de traitement
    processing: {
      action,
      success: true,
      processedBy: 'response-processor',
      callsCompleted: 13
    }
  };
  
  // Enrichissement spécifique par action
  enrichResponseByAction(finalResponse, action, responseData.data);
  
  // Ajout des données additionnelles préservées
  addAdditionalData(finalResponse, responseData.data);

  return {
    success: true,
    data: finalResponse
  };
}

/**
 * Valide la structure des données reçues du parser
 * @param {object} responseData - Données à valider
 * @returns {{valid: boolean, error?: string}}
 * @private
 */
function validateResponseData(responseData) {
  if (!responseData) {
    return { valid: false, error: 'responseData is required' };
  }

  if (typeof responseData !== 'object') {
    return { valid: false, error: 'responseData must be an object' };
  }

  // Pour les réponses échouées
  if (responseData.success === false) {
    if (!responseData.error) {
      return { valid: false, error: 'Failed response must have error field' };
    }
    return { valid: true };
  }

  // Pour les réponses réussies
  if (responseData.success !== true) {
    return { valid: false, error: 'responseData.success must be boolean' };
  }

  if (!responseData.data) {
    return { valid: false, error: 'Successful response must have data field' };
  }

  // Validation des champs requis
  const requiredFields = ['action', 'message', 'project', 'metadata'];
  for (const field of requiredFields) {
    if (!responseData.data[field]) {
      return { valid: false, error: `Missing required data field: ${field}` };
    }
  }

  // Validation de la structure project
  const projectRequiredFields = ['id', 'fromState', 'toState'];
  for (const field of projectRequiredFields) {
    if (!responseData.data.project[field]) {
      return { valid: false, error: `Missing required project field: ${field}` };
    }
  }

  return { valid: true };
}

/**
 * Enrichit la réponse avec des données spécifiques à l'action
 * @param {object} finalResponse - Réponse à enrichir
 * @param {string} action - Action effectuée
 * @param {object} responseData - Données source
 * @private
 */
function enrichResponseByAction(finalResponse, action, responseData) {
  switch (action) {
    case 'CREATE':
      enrichCreateResponse(finalResponse, responseData);
      break;
    case 'BUILD':
      enrichBuildResponse(finalResponse, responseData);
      break;
    case 'DEPLOY':
      enrichDeployResponse(finalResponse, responseData);
      break;
    case 'DELETE':
      enrichDeleteResponse(finalResponse, responseData);
      break;
    case 'REVERT':
      enrichRevertResponse(finalResponse, responseData);
      break;
    default:
      enrichGenericResponse(finalResponse, responseData);
  }
}

/**
 * Enrichissement spécifique pour CREATE
 * @param {object} finalResponse - Réponse à enrichir
 * @param {object} responseData - Données source
 * @private
 */
function enrichCreateResponse(finalResponse, responseData) {
  if (responseData.projectDetails) {
    finalResponse.project.name = responseData.projectDetails.name;
    finalResponse.project.description = responseData.projectDetails.description;
    finalResponse.project.pages = responseData.projectDetails.pages?.length || 0;
  }

  if (responseData.templateUsed) {
    finalResponse.template = {
      id: responseData.templateUsed,
      name: `${responseData.templateUsed.charAt(0).toUpperCase() + responseData.templateUsed.slice(1)} Template`
    };
  }

  if (responseData.filesInfo) {
    finalResponse.files = responseData.filesInfo;
  }
}

/**
 * Enrichissement spécifique pour BUILD
 * @param {object} finalResponse - Réponse à enrichir
 * @param {object} responseData - Données source
 * @private
 */
function enrichBuildResponse(finalResponse, responseData) {
  if (responseData.buildInfo) {
    finalResponse.build = {
      generatedFiles: responseData.buildInfo.generatedFiles,
      totalSize: responseData.buildInfo.totalSize,
      targets: responseData.buildInfo.targets,
      builtAt: responseData.buildInfo.builtAt
    };
  }

  if (responseData.workflowInfo) {
    finalResponse.workflow = responseData.workflowInfo;
  }
}

/**
 * Enrichissement spécifique pour DEPLOY
 * @param {object} finalResponse - Réponse à enrichir
 * @param {object} responseData - Données source
 * @private
 */
function enrichDeployResponse(finalResponse, responseData) {
  if (responseData.deploymentInfo) {
    finalResponse.deployment = responseData.deploymentInfo;
  }

  if (responseData.deployedAt) {
    finalResponse.deployedAt = responseData.deployedAt;
  }
}

/**
 * Enrichissement spécifique pour DELETE
 * @param {object} finalResponse - Réponse à enrichir
 * @param {object} responseData - Données source
 * @private
 */
function enrichDeleteResponse(finalResponse, responseData) {
  if (responseData.deletionInfo) {
    finalResponse.deletion = {
      deletedItems: responseData.deletionInfo.deletedItems?.length || 0,
      deletedCount: responseData.deletionInfo.deletedCount
    };
  }

  if (responseData.backupInfo) {
    finalResponse.backup = {
      created: true,
      path: responseData.backupInfo.path,
      size: responseData.backupInfo.size
    };
  }
}

/**
 * Enrichissement spécifique pour REVERT
 * @param {object} finalResponse - Réponse à enrichir
 * @param {object} responseData - Données source
 * @private
 */
function enrichRevertResponse(finalResponse, responseData) {
  if (responseData.workflowInfo) {
    finalResponse.revert = responseData.workflowInfo;
  }

  if (responseData.cleanup) {
    finalResponse.cleanup = responseData.cleanup;
  }
}

/**
 * Enrichissement générique
 * @param {object} finalResponse - Réponse à enrichir
 * @param {object} responseData - Données source
 * @private
 */
function enrichGenericResponse(finalResponse, responseData) {
  // Ajout de toute information utile disponible
  if (responseData.workflowInfo) {
    finalResponse.workflow = responseData.workflowInfo;
  }
}

/**
 * Ajoute les données additionnelles préservées
 * @param {object} finalResponse - Réponse à enrichir
 * @param {object} responseData - Données source
 * @private
 */
function addAdditionalData(finalResponse, responseData) {
  // Préservation des timestamps
  const timestamps = {};
  if (responseData.createdAt) timestamps.created = responseData.createdAt;
  if (responseData.builtAt) timestamps.built = responseData.builtAt;
  if (responseData.deployedAt) timestamps.deployed = responseData.deployedAt;
  
  if (Object.keys(timestamps).length > 0) {
    finalResponse.timestamps = timestamps;
  }

  // Préservation des métadonnées utiles
  if (responseData.metadata && responseData.metadata.workflowSuccess !== undefined) {
    finalResponse.processing.workflowSuccess = responseData.metadata.workflowSuccess;
  }

  // Ajout d'informations de debug en mode développement
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
      finalResponse.debug = {
        parsedBy: responseData.metadata?.parsedBy,
        originalDataKeys: Object.keys(responseData).filter(key => !['action', 'message', 'project', 'metadata'].includes(key))
      };
    }
  } catch (error) {
    // Ignore debug errors silently
  }
}