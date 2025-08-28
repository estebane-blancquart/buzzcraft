/**
 * CALL 2: Request Processor - Process données parsées en données système
 * @param {object} requestData - Données parsées du request parser
 * @returns {Promise<{success: boolean, data: object}>} Données système pour workflow
 * @throws {Error} ValidationError si requestData invalide
 */

export async function process(requestData) {
  console.log(`[REQUEST-PROCESSOR] CALL 2: Processing request data...`);
  
  // Validation du paramètre d'entrée
  const validation = validateRequestData(requestData);
  if (!validation.valid) {
    console.log(`[REQUEST-PROCESSOR] Validation failed: ${validation.error}`);
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  const { action, projectId, config, metadata } = requestData;
  console.log(`[REQUEST-PROCESSOR] Processing ${action} action for project: ${projectId}`);
  
  // Construction des données système pour le workflow
  const processedData = {
    action,
    projectId,
    projectPath: generateProjectPath(projectId),
    config: processActionConfig(action, config, projectId),
    metadata: {
      ...metadata,
      processedAt: new Date().toISOString(),
      processedBy: 'request-processor',
      workflow: action
    },
    validation: {
      passed: true,
      timestamp: new Date().toISOString(),
      rules: generateValidationRules(action)
    }
  };
  
  // Validation finale des données système
  const systemValidation = validateSystemData(processedData);
  if (!systemValidation.valid) {
    console.log(`[REQUEST-PROCESSOR] System validation failed: ${systemValidation.error}`);
    return {
      success: false,
      error: `System data validation failed: ${systemValidation.error}`
    };
  }
  
  // Enrichissement avec données spécifiques au workflow
  enrichDataForWorkflow(processedData, action, config);
  
  console.log(`[REQUEST-PROCESSOR] Successfully processed ${action} request for project: ${projectId}`);
  return {
    success: true,
    data: processedData
  };
}

/**
 * Valide la structure des données reçues du parser
 * @param {object} requestData - Données à valider
 * @returns {{valid: boolean, error?: string}}
 */
function validateRequestData(requestData) {
  if (!requestData) {
    return { valid: false, error: 'requestData is required' };
  }
  
  if (typeof requestData !== 'object') {
    return { valid: false, error: 'requestData must be an object' };
  }
  
  const requiredFields = ['action', 'projectId', 'config', 'metadata'];
  for (const field of requiredFields) {
    if (!requestData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validation de l'action
  const VALID_ACTIONS = ['CREATE', 'BUILD', 'DEPLOY', 'START', 'STOP', 'DELETE', 'REVERT', 'UPDATE'];
  if (!VALID_ACTIONS.includes(requestData.action)) {
    return { valid: false, error: `Invalid action: ${requestData.action}` };
  }
  
  // Validation du projectId
  if (typeof requestData.projectId !== 'string' || requestData.projectId.length === 0) {
    return { valid: false, error: 'projectId must be non-empty string' };
  }
  
  // Validation de la config
  if (typeof requestData.config !== 'object') {
    return { valid: false, error: 'config must be an object' };
  }
  
  return { valid: true };
}

/**
 * Génère le chemin système vers le projet
 * @param {string} projectId - ID du projet
 * @returns {string} Chemin complet vers le projet
 */
function generateProjectPath(projectId) {
  return `./app-server/data/outputs/${projectId}`;
}

/**
 * Process la configuration selon l'action
 * @param {string} action - Action à exécuter
 * @param {object} config - Configuration de base
 * @param {string} projectId - ID du projet
 * @returns {object} Configuration processée
 */
function processActionConfig(action, config, projectId) {
  const baseConfig = {
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
    ...config
  };
  
  switch (action) {
    case 'CREATE':
      return {
        ...baseConfig,
        name: config.name || projectId,
        template: config.template || 'basic',
        description: config.description || `Project ${projectId}`,
        generateDefaults: true,
        validateSchema: true
      };
      
    case 'BUILD':
      return {
        ...baseConfig,
        cleanBuild: config.cleanBuild !== false,
        generateSourceMaps: config.generateSourceMaps !== false,
        minify: config.minify !== false,
        skipValidation: config.skipValidation === true
      };
      
    case 'DEPLOY':
      return {
        ...baseConfig,
        environment: config.environment || 'development',
        healthCheck: config.healthCheck !== false,
        rollbackOnFailure: config.rollbackOnFailure !== false,
        timeout: config.timeout || 300000 // 5 minutes
      };
      
    case 'START':
      return {
        ...baseConfig,
        port: config.port || 8080,
        healthCheck: config.healthCheck !== false,
        waitForReady: config.waitForReady !== false,
        timeout: config.timeout || 60000 // 1 minute
      };
      
    case 'STOP':
      return {
        ...baseConfig,
        gracefulShutdown: config.gracefulShutdown !== false,
        timeout: config.timeout || 30000, // 30 secondes
        forceKill: config.forceKill === true
      };
      
    case 'DELETE':
      return {
        ...baseConfig,
        removeFiles: config.removeFiles !== false,
        removeContainers: config.removeContainers !== false,
        backup: config.backup === true,
        confirmDelete: config.confirmDelete !== false
      };
      
    case 'REVERT':
      return {
        ...baseConfig,
        targetState: config.targetState || 'DRAFT',
        preserveData: config.preserveData !== false,
        createBackup: config.createBackup !== false
      };
      
    case 'UPDATE':
      return {
        ...baseConfig,
        version: config.version || '1.0.0',
        strategy: config.strategy || 'rolling',
        rollbackOnFailure: config.rollbackOnFailure !== false
      };
      
    default:
      return baseConfig;
  }
}

/**
 * Génère un ID unique pour la requête
 * @returns {string} ID de requête unique
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Génère les règles de validation pour l'action
 * @param {string} action - Action concernée
 * @returns {string[]} Liste des règles appliquées
 */
function generateValidationRules(action) {
  const commonRules = ['projectId-format', 'action-validity', 'config-structure'];
  
  const actionRules = {
    CREATE: [...commonRules, 'unique-project', 'template-exists'],
    BUILD: [...commonRules, 'project-exists', 'state-draft'],
    DEPLOY: [...commonRules, 'project-exists', 'state-built'],
    START: [...commonRules, 'project-exists', 'state-offline'],
    STOP: [...commonRules, 'project-exists', 'state-online'],
    DELETE: [...commonRules, 'project-exists'],
    REVERT: [...commonRules, 'project-exists', 'revert-allowed'],
    UPDATE: [...commonRules, 'project-exists', 'update-allowed']
  };
  
  return actionRules[action] || commonRules;
}

/**
 * Valide les données système générées
 * @param {object} systemData - Données système à valider
 * @returns {{valid: boolean, error?: string}}
 */
function validateSystemData(systemData) {
  const requiredFields = ['action', 'projectId', 'projectPath', 'config', 'metadata', 'validation'];
  
  for (const field of requiredFields) {
    if (!systemData[field]) {
      return { valid: false, error: `Missing system field: ${field}` };
    }
  }
  
  // Validation du projectPath
  if (!systemData.projectPath.includes(systemData.projectId)) {
    return { valid: false, error: 'projectPath must contain projectId' };
  }
  
  // Validation de la metadata
  if (!systemData.metadata.processedAt || !systemData.metadata.processedBy) {
    return { valid: false, error: 'Metadata must contain processedAt and processedBy' };
  }
  
  return { valid: true };
}

/**
 * Enrichit les données avec informations spécifiques au workflow
 * @param {object} processedData - Données à enrichir (modifiées en place)
 * @param {string} action - Action concernée
 * @param {object} config - Configuration source
 */
function enrichDataForWorkflow(processedData, action, config) {
  // Ajout de données spécifiques selon l'action
  switch (action) {
    case 'CREATE':
      processedData.workflow = {
        type: 'creation',
        expectsTemplates: true,
        createsFiles: true,
        modifiesState: true,
        targetState: 'DRAFT'
      };
      break;
      
    case 'BUILD':
      processedData.workflow = {
        type: 'compilation',
        expectsTemplates: true,
        createsFiles: true,
        modifiesState: true,
        targetState: 'BUILT'
      };
      break;
      
    case 'DEPLOY':
      processedData.workflow = {
        type: 'deployment',
        expectsTemplates: false,
        createsFiles: false,
        modifiesState: true,
        targetState: 'OFFLINE'
      };
      break;
      
    case 'START':
      processedData.workflow = {
        type: 'startup',
        expectsTemplates: false,
        createsFiles: false,
        modifiesState: true,
        targetState: 'ONLINE'
      };
      break;
      
    case 'STOP':
      processedData.workflow = {
        type: 'shutdown',
        expectsTemplates: false,
        createsFiles: false,
        modifiesState: true,
        targetState: 'OFFLINE'
      };
      break;
      
    case 'DELETE':
      processedData.workflow = {
        type: 'destruction',
        expectsTemplates: false,
        createsFiles: false,
        modifiesState: true,
        targetState: 'VOID'
      };
      break;
      
    case 'REVERT':
      processedData.workflow = {
        type: 'reversion',
        expectsTemplates: false,
        createsFiles: false,
        modifiesState: true,
        targetState: config.targetState || 'DRAFT'
      };
      break;
      
    case 'UPDATE':
      processedData.workflow = {
        type: 'update',
        expectsTemplates: true,
        createsFiles: true,
        modifiesState: false,
        targetState: 'SAME'
      };
      break;
      
    default:
      processedData.workflow = {
        type: 'unknown',
        expectsTemplates: false,
        createsFiles: false,
        modifiesState: false,
        targetState: 'UNKNOWN'
      };
  }
  
  // Ajout de timestamps de traitement
  processedData.processing = {
    startedAt: new Date().toISOString(),
    callNumber: 2,
    nextCall: 3,
    expectedCalls: 13,
    phase: 'request-processing'
  };
}

console.log(`[REQUEST-PROCESSOR] Request processor module loaded`);

export default { process };