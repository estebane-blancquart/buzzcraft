/**
 * Request Processor - Traitement des requêtes HTTP - VERSION CORRIGÉE PIXEL PERFECT
 * @description Transforme les données parsées en format coordinateur
 */

/**
 * Traite une requête parsée pour la transformer en format coordinateur
 * @param {object} requestData - Données de requête parsées
 * @returns {Promise<{success: boolean, data: object}>} Données traitées
 */
export async function process(requestData) {
  console.log("��� [API] === DEBUG process START ===");
  console.log("��� [API] requestData complet:", JSON.stringify(requestData, null, 2));

  try {
    // Validation des données d'entrée
    if (!requestData || typeof requestData !== 'object') {
      return {
        success: false,
        error: 'Invalid request data: must be object'
      };
    }

    // Traitement selon l'action
    switch (requestData.action) {
      case 'CREATE':
        return await processCreateRequest(requestData);
      case 'BUILD':
      case 'DEPLOY':
      case 'START':
      case 'STOP':
      case 'DELETE':
      case 'REVERT':
        return await processProjectAction(requestData);
      default:
        return {
          success: false,
          error: `Unknown action: ${requestData.action}`
        };
    }
    
  } catch (error) {
    console.log(`[REQUEST-PROCESSOR] Processing error: ${error.message}`);
    return {
      success: false,
      error: `Request processing failed: ${error.message}`
    };
  }
}

/**
 * Traite une requête CREATE spécifiquement
 * @param {object} requestData - Données de requête CREATE
 * @returns {Promise<{success: boolean, data: object}>} Données CREATE traitées
 * @private
 */
async function processCreateRequest(requestData) {
  console.log("[REQUEST-PROCESSOR] CALL 2: Processing CREATE request...");
  
  // PROBLÈME IDENTIFIÉ : Les données arrivent dans rawRequest.body
  let formData;
  
  // Récupération des données du formulaire
  if (requestData.rawRequest && requestData.rawRequest.body) {
    formData = requestData.rawRequest.body;
    console.log("��� [API] formData from body:", JSON.stringify(formData, null, 2));
  } else {
    console.log("��� [API] No body found in rawRequest");
    return {
      success: false,
      error: 'Missing required field: form data'
    };
  }

  // Validation des champs requis
  if (!formData.projectId || typeof formData.projectId !== 'string') {
    console.log("[REQUEST-PROCESSOR] Validation failed: Missing required field: projectId");
    return {
      success: false,
      error: 'Missing required field: projectId'
    };
  }

  if (!formData.name || typeof formData.name !== 'string') {
    console.log("[REQUEST-PROCESSOR] Validation failed: Missing required field: name");
    return {
      success: false,
      error: 'Missing required field: name'
    };
  }

  if (!formData.template || typeof formData.template !== 'string') {
    console.log("[REQUEST-PROCESSOR] Validation failed: Missing required field: template");
    return {
      success: false,
      error: 'Missing required field: template'
    };
  }

  // Construction des données pour le coordinateur
  const processedData = {
    action: 'CREATE',
    projectId: formData.projectId.trim(),
    config: {
      name: formData.name.trim(),
      template: formData.template.trim(),
      description: formData.description || ''
    },
    metadata: {
      ...requestData.metadata,
      processedBy: 'request-processor',
      processedAt: new Date().toISOString()
    }
  };

  console.log("��� [API] processedData final:", JSON.stringify(processedData, null, 2));
  console.log("[REQUEST-PROCESSOR] CREATE request processed successfully");

  return {
    success: true,
    data: processedData
  };
}

/**
 * Traite une requête d'action projet (BUILD, DEPLOY, etc.)
 * @param {object} requestData - Données de requête d'action
 * @returns {Promise<{success: boolean, data: object}>} Données d'action traitées
 * @private
 */
async function processProjectAction(requestData) {
  console.log(`[REQUEST-PROCESSOR] CALL 2: Processing ${requestData.action} request...`);

  // Extraction projectId du path pour les actions
  const projectId = requestData.rawRequest?.params?.id;
  
  if (!projectId) {
    return {
      success: false,
      error: 'Missing required field: projectId in path'
    };
  }

  // Construction des données pour le coordinateur
  const processedData = {
    action: requestData.action,
    projectId: projectId,
    config: requestData.config || {},
    metadata: {
      ...requestData.metadata,
      processedBy: 'request-processor',
      processedAt: new Date().toISOString()
    }
  };

  console.log(`[REQUEST-PROCESSOR] ${requestData.action} request processed successfully`);

  return {
    success: true,
    data: processedData
  };
}

console.log("[REQUEST-PROCESSOR] Request processor loaded successfully - PIXEL PERFECT VERSION");
