/**
 * CALL 2: Request Processor - Process données parsées en données système
 * @param {object} requestData - Données parsées du request parser
 * @returns {Promise<{success: boolean, data: object}>} Données système pour workflow
 * @throws {Error} ValidationError si requestData invalide
 */

export async function process(requestData) {
  // Validation du paramètre d'entrée
  const validation = validateRequestData(requestData);
  if (!validation.valid) {
    console.log(`[REQUEST-PROCESSOR] Validation failed: ${validation.error}`);
    throw new Error(`ValidationError: ${validation.error}`);
  }

  const { action, projectId, config, metadata } = requestData;

  // Construction des données système pour le workflow
  const processedData = {
    action,
    projectId,
    projectPath: generateProjectPath(projectId),
    config: processActionConfig(action, config, projectId),
    metadata: {
      ...metadata,
      processedAt: new Date().toISOString(),
      processedBy: "request-processor",
      workflow: action,
    },
    validation: {
      passed: true,
      timestamp: new Date().toISOString(),
      rules: generateValidationRules(action),
    },
  };

  // Validation finale des données système
  const systemValidation = validateSystemData(processedData);
  if (!systemValidation.valid) {
    console.log(`[REQUEST-PROCESSOR] System validation failed: ${systemValidation.error}`);
    return {
      success: false,
      error: `System data validation failed: ${systemValidation.error}`,
    };
  }

  // Enrichissement avec données spécifiques au workflow
  enrichDataForWorkflow(processedData, action, config);

  return {
    success: true,
    data: processedData,
  };
}

/**
 * Valide la structure des données reçues du parser
 * @param {object} requestData - Données à valider
 * @returns {{valid: boolean, error?: string}}
 * @private
 */
function validateRequestData(requestData) {
  if (!requestData) {
    return { valid: false, error: "requestData is required" };
  }

  if (typeof requestData !== "object") {
    return { valid: false, error: "requestData must be an object" };
  }

  const requiredFields = ["action", "projectId", "config", "metadata"];
  for (const field of requiredFields) {
    if (!requestData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validation de l'action
  const VALID_ACTIONS = [
    "CREATE",
    "BUILD",
    "DEPLOY",
    "START",
    "STOP",
    "DELETE",
    "REVERT",
    "UPDATE",
  ];
  if (!VALID_ACTIONS.includes(requestData.action)) {
    return { valid: false, error: `Invalid action: ${requestData.action}` };
  }

  // Validation du projectId
  if (
    typeof requestData.projectId !== "string" ||
    requestData.projectId.length === 0
  ) {
    return { valid: false, error: "projectId must be non-empty string" };
  }

  // Validation de la config
  if (typeof requestData.config !== "object") {
    return { valid: false, error: "config must be an object" };
  }

  return { valid: true };
}

/**
 * Génère le chemin système du projet
 * @param {string} projectId - ID du projet
 * @returns {string} Chemin vers le dossier projet
 * @private
 */
function generateProjectPath(projectId) {
  if (!projectId) {
    return null;
  }
  
  // Chemin simple sans utiliser path.resolve pour éviter les problèmes d'import
  return `./app-server/data/outputs/${projectId}`;
}

/**
 * Traite la configuration spécifique à l'action
 * @param {string} action - Action à traiter
 * @param {object} config - Configuration brute
 * @param {string} projectId - ID du projet
 * @returns {object} Configuration traitée
 * @private
 */
function processActionConfig(action, config, projectId) {
  const processedConfig = { ...config };

  // Traitement spécifique par action
  switch (action) {
    case "CREATE":
      return processCreateConfig(processedConfig, projectId);
    case "BUILD":
      return processBuildConfig(processedConfig);
    case "DEPLOY":
      return processDeployConfig(processedConfig);
    default:
      return processedConfig;
  }
}

/**
 * Traite la configuration CREATE
 * @param {object} config - Configuration CREATE
 * @param {string} projectId - ID du projet
 * @returns {object} Configuration CREATE traitée
 * @private
 */
function processCreateConfig(config, projectId) {
  const processedConfig = {
    // Nom du projet avec fallback intelligent
    name: config.name || projectId?.replace(/-/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'New Project',
    
    // Template avec validation
    template: config.template || 'basic',
    
    // Description optionnelle
    description: config.description || '',
    
    // Métadonnées additionnelles
    metadata: config.metadata || {},
    
    // Options de création
    options: {
      overwrite: config.overwrite === true,
      backup: config.backup !== false, // true par défaut
      validate: config.validate !== false, // true par défaut
      ...config.options
    }
  };

  // Validation du template
  const validTemplates = ['basic', 'empty', 'contact', 'list', 'restaurant'];
  if (!validTemplates.includes(processedConfig.template)) {
    processedConfig.template = 'basic';
  }

  return processedConfig;
}

/**
 * Traite la configuration BUILD
 * @param {object} config - Configuration BUILD
 * @returns {object} Configuration BUILD traitée
 * @private
 */
function processBuildConfig(config) {
  return {
    // Targets de build
    targets: config.targets || ['app-visitor'],
    
    // Options de build
    minify: config.minify !== false, // true par défaut
    sourceMaps: config.sourceMaps === true, // false par défaut
    skipValidation: config.skipValidation === true, // false par défaut
    
    // Configuration de build avancée
    buildOptions: config.buildOptions || {},
    
    // Métadonnées
    buildId: config.buildId || `build-${Date.now()}`,
    triggeredBy: config.triggeredBy || 'manual'
  };
}

/**
 * Traite la configuration DEPLOY
 * @param {object} config - Configuration DEPLOY
 * @returns {object} Configuration DEPLOY traitée
 * @private
 */
function processDeployConfig(config) {
  return {
    // Environnement cible
    environment: config.environment || 'development',
    
    // Options de déploiement
    strategy: config.strategy || 'rolling',
    replicas: config.replicas || 1,
    
    // Configuration réseau
    port: config.port || 3000,
    ssl: config.ssl === true,
    
    // Métadonnées
    deployId: config.deployId || `deploy-${Date.now()}`,
    triggeredBy: config.triggeredBy || 'manual'
  };
}

/**
 * Génère les règles de validation pour une action
 * @param {string} action - Action à valider
 * @returns {Array} Règles de validation
 * @private
 */
function generateValidationRules(action) {
  const baseRules = [
    { field: 'projectId', type: 'string', required: true },
    { field: 'config', type: 'object', required: true }
  ];

  switch (action) {
    case 'CREATE':
      return [
        ...baseRules,
        { field: 'config.name', type: 'string', required: false },
        { field: 'config.template', type: 'string', required: false }
      ];
    case 'BUILD':
      return [
        ...baseRules,
        { field: 'config.targets', type: 'array', required: false }
      ];
    default:
      return baseRules;
  }
}

/**
 * Valide les données système construites
 * @param {object} systemData - Données système à valider
 * @returns {{valid: boolean, error?: string}}
 * @private
 */
function validateSystemData(systemData) {
  if (!systemData || typeof systemData !== 'object') {
    return { valid: false, error: 'System data must be an object' };
  }

  // Vérification des champs obligatoires
  const requiredFields = ['action', 'projectId', 'config', 'metadata'];
  for (const field of requiredFields) {
    if (!systemData[field]) {
      return { valid: false, error: `Missing system field: ${field}` };
    }
  }

  // Validation de la structure metadata
  if (!systemData.metadata.processedAt || !systemData.metadata.processedBy) {
    return { valid: false, error: 'Invalid metadata structure' };
  }

  return { valid: true };
}

/**
 * Enrichit les données avec des informations spécifiques au workflow
 * @param {object} processedData - Données à enrichir
 * @param {string} action - Action du workflow
 * @param {object} config - Configuration originale
 * @private
 */
function enrichDataForWorkflow(processedData, action, config) {
  // Ajout d'informations sur le workflow attendu
  switch (action) {
    case "CREATE":
      processedData.workflow = {
        type: "creation",
        expectedDuration: 5000,
        rollbackSupported: true,
        stateTransition: "VOID -> DRAFT",
      };
      break;

    case "BUILD":
      processedData.workflow = {
        type: "compilation",
        expectedDuration: 30000,
        rollbackSupported: true,
        stateTransition: "DRAFT -> BUILT",
      };
      break;

    case "DELETE":
      processedData.workflow = {
        type: "destruction",
        expectedDuration: 2000,
        rollbackSupported: false,
        stateTransition: "ANY -> VOID",
      };
      break;

    default:
      processedData.workflow = {
        type: "generic",
        expectedDuration: 10000,
        rollbackSupported: false,
        stateTransition: "UNKNOWN",
      };
  }

  // Ajout timestamp de début de traitement
  processedData.processing = {
    startedAt: new Date().toISOString(),
    requestProcessor: true,
    nextStage: "workflow-coordinator",
  };
}