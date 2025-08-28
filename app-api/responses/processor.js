/**
 * CALL 13: Response Processor - Process données parsées en réponse finale HTTP
 * @param {object} responseData - Données parsées du response parser
 * @returns {Promise<{success: boolean, data: object}>} Réponse finale pour le client
 * @throws {Error} ValidationError si responseData invalide
 */

export async function process(responseData) {
  console.log(`[RESPONSE-PROCESSOR] CALL 13: Processing final response...`);
  
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
  console.log(`[RESPONSE-PROCESSOR] Processing action: ${action} for project: ${project.id}`);
  
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

  console.log(`[RESPONSE-PROCESSOR] Final response processed successfully for action: ${action}`);
  return {
    success: true,
    data: finalResponse
  };
}

/**
 * Valide la structure des données reçues du parser
 * @param {object} responseData - Données à valider
 * @returns {{valid: boolean, error?: string}}
 */
function validateResponseData(responseData) {
  if (!responseData) {
    return { valid: false, error: 'responseData is required' };
  }
  
  if (typeof responseData !== 'object') {
    return { valid: false, error: 'responseData must be an object' };
  }
  
  if (typeof responseData.success !== 'boolean') {
    return { valid: false, error: 'responseData.success must be boolean' };
  }
  
  if (!responseData.success) {
    // En cas d'échec du parsing, on valide juste que error existe
    if (!responseData.error) {
      return { valid: false, error: 'responseData.error is required when success is false' };
    }
    return { valid: true };
  }
  
  // Validation pour les cas de succès
  if (!responseData.data) {
    return { valid: false, error: 'responseData.data is required when success is true' };
  }
  
  const { action, message, project, metadata } = responseData.data;
  
  if (!action || typeof action !== 'string') {
    return { valid: false, error: 'responseData.data.action must be non-empty string' };
  }
  
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'responseData.data.message must be non-empty string' };
  }
  
  if (!project || typeof project !== 'object') {
    return { valid: false, error: 'responseData.data.project must be object' };
  }
  
  if (!project.id || typeof project.id !== 'string') {
    return { valid: false, error: 'responseData.data.project.id must be non-empty string' };
  }
  
  if (!metadata || typeof metadata !== 'object') {
    return { valid: false, error: 'responseData.data.metadata must be object' };
  }
  
  return { valid: true };
}

/**
 * Enrichit la réponse avec des données spécifiques à l'action
 * @param {object} finalResponse - Réponse à enrichir (modifiée en place)
 * @param {string} action - Action exécutée
 * @param {object} responseData - Données source du parser
 */
function enrichResponseByAction(finalResponse, action, responseData) {
  switch (action) {
    case 'CREATE':
      finalResponse.creation = {
        template: responseData.templateUsed || 'basic',
        fallbackUsed: responseData.fallbackUsed || false,
        artifactsCreated: responseData.artifacts?.length || 0
      };
      break;
      
    case 'BUILD':
      finalResponse.build = {
        servicesGenerated: responseData.servicesGenerated || 0,
        templatesProcessed: responseData.templatesUsed || 0,
        buildStats: responseData.buildStats || null
      };
      break;
      
    case 'DEPLOY':
      finalResponse.deployment = {
        containersCreated: responseData.containersCreated || 0,
        networkConfigured: responseData.networkConfigured || false,
        healthCheckPassed: responseData.healthCheckPassed || false
      };
      break;
      
    case 'START':
      finalResponse.startup = {
        servicesStarted: responseData.servicesStarted || 0,
        healthStatus: responseData.healthStatus || 'unknown',
        accessUrl: responseData.accessUrl || null
      };
      break;
      
    case 'STOP':
      finalResponse.shutdown = {
        servicesStopped: responseData.servicesStopped || 0,
        cleanupCompleted: responseData.cleanupCompleted || false,
        resourcesFreed: responseData.resourcesFreed || []
      };
      break;
      
    case 'DELETE':
      finalResponse.deletion = {
        artifactsRemoved: responseData.artifactsRemoved || 0,
        cleanupCompleted: responseData.cleanupCompleted || false,
        storageFreed: responseData.storageFreed || '0MB'
      };
      break;
      
    case 'UPDATE':
      finalResponse.update = {
        componentsUpdated: responseData.componentsUpdated || 0,
        migrationApplied: responseData.migrationApplied || false,
        rollbackAvailable: responseData.rollbackAvailable || false
      };
      break;
      
    case 'REVERT':
      finalResponse.reversion = {
        stateReverted: true,
        artifactsRemoved: responseData.artifactsRemoved || 0,
        backupRestored: responseData.backupRestored || false
      };
      break;
      
    default:
      // Pour les actions inconnues, on ajoute une section générique
      finalResponse.operation = {
        type: action,
        completed: true,
        details: 'Operation completed successfully'
      };
  }
}

/**
 * Ajoute les données additionnelles préservées du workflow
 * @param {object} finalResponse - Réponse à enrichir (modifiée en place)
 * @param {object} responseData - Données source du parser
 */
function addAdditionalData(finalResponse, responseData) {
  // Données optionnelles à préserver dans la réponse finale
  const OPTIONAL_FIELDS = [
    'templateUsed',
    'fallbackUsed', 
    'artifacts',
    'fileWritten',
    'buildMetadata',
    'deploymentMetadata',
    'errorDetails'
  ];
  
  const additionalData = {};
  
  OPTIONAL_FIELDS.forEach(field => {
    if (responseData[field] !== undefined) {
      additionalData[field] = responseData[field];
    }
  });
  
  // Ajouter les données additionnelles seulement si il y en a
  if (Object.keys(additionalData).length > 0) {
    finalResponse.additional = additionalData;
  }
}

/**
 * Génère des statistiques sur la réponse finale
 * @param {object} finalResponse - Réponse finale
 * @returns {object} Statistiques de réponse
 */
function generateResponseStats(finalResponse) {
  return {
    responseSize: JSON.stringify(finalResponse).length,
    fieldsCount: Object.keys(finalResponse).length,
    hasAdditionalData: !!finalResponse.additional,
    processingAction: finalResponse.processing?.action || 'unknown'
  };
}

console.log(`[RESPONSE-PROCESSOR] Response processor module loaded`);

export default { process };