/**
 * CALL 2: Request Processor - Process données parsées en données système
 * @param {object} requestData - Données parsées du request parser
 * @returns {Promise<{success: boolean, data: object}>} Données système pour workflow
 * @throws {Error} ValidationError si requestData invalide
 */

export async function process(requestData) {
  console.log("🔵 [API] === DEBUG process START ===");
  console.log(
    "🔵 [API] requestData complet:",
    JSON.stringify(requestData, null, 2)
  );
  console.log("🔵 [API] requestData.config =", requestData.config);
  console.log(
    "🔵 [API] requestData.config.template =",
    `"${requestData.config?.template}"`
  );
  console.log(
    "🔵 [API] typeof requestData.config.template =",
    typeof requestData.config?.template
  );

  console.log(`[REQUEST-PROCESSOR] CALL 2: Processing request data...`);

  // Validation du paramètre d'entrée
  const validation = validateRequestData(requestData);
  if (!validation.valid) {
    console.log(`[REQUEST-PROCESSOR] Validation failed: ${validation.error}`);
    throw new Error(`ValidationError: ${validation.error}`);
  }

  const { action, projectId, config, metadata } = requestData;
  console.log(
    `[REQUEST-PROCESSOR] Processing ${action} action for project: ${projectId}`
  );

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
    console.log(
      `[REQUEST-PROCESSOR] System validation failed: ${systemValidation.error}`
    );
    return {
      success: false,
      error: `System data validation failed: ${systemValidation.error}`,
    };
  }

  // Enrichissement avec données spécifiques au workflow
  enrichDataForWorkflow(processedData, action, config);

  console.log("🔵 [API] processedData créé:");
  console.log("🔵 [API]", JSON.stringify(processedData, null, 2));
  console.log(
    "🔵 [API] processedData.config.template =",
    `"${processedData.config?.template}"`
  );

  console.log(
    `[REQUEST-PROCESSOR] Successfully processed ${action} request for project: ${projectId}`
  );
  return {
    success: true,
    data: processedData,
  };
}

/**
 * Valide la structure des données reçues du parser
 * @param {object} requestData - Données à valider
 * @returns {{valid: boolean, error?: string}}
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
    source: "request-processor",
  };

  // Merge de la config originale avec les enrichissements
  const enrichedConfig = {
    ...config, // ✅ On préserve TOUTE la config originale (y compris template)
    ...baseConfig,
  };

  // Enrichissements spécifiques par action
  switch (action) {
    case "CREATE":
      // Validation stricte du template - FAIL FAST
      if (
        !config.template ||
        typeof config.template !== "string" ||
        config.template.trim() === ""
      ) {
        throw new Error(
          "ValidationError: template is required and must be a non-empty string"
        );
      }

      return {
        ...enrichedConfig,
        template: config.template.trim(), // Pas de fallback, valeur exacte
        generateId: config.generateId !== false,
        validateTemplate: config.validateTemplate !== false,
      };

    case "BUILD":
      return {
        ...enrichedConfig,
        production: config.production || false,
        minify: config.minify !== false,
        targets: config.targets || ["app-visitor"],
      };

    case "DELETE":
      return {
        ...enrichedConfig,
        removeFiles: config.removeFiles !== false,
        createBackup: config.createBackup !== false,
      };

    case "REVERT":
      return {
        ...enrichedConfig,
        targetState: config.targetState || "DRAFT",
        preserveData: config.preserveData !== false,
        createBackup: config.createBackup !== false,
      };

    case "UPDATE":
      return {
        ...enrichedConfig,
        version: config.version || "1.0.0",
        strategy: config.strategy || "rolling",
        rollbackOnFailure: config.rollbackOnFailure !== false,
      };

    default:
      return enrichedConfig;
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
  const commonRules = [
    "projectId-format",
    "action-validity",
    "config-structure",
  ];

  const actionRules = {
    CREATE: [...commonRules, "unique-project", "template-exists"],
    BUILD: [...commonRules, "project-exists", "state-draft"],
    DEPLOY: [...commonRules, "project-exists", "state-built"],
    START: [...commonRules, "project-exists", "state-offline"],
    STOP: [...commonRules, "project-exists", "state-online"],
    DELETE: [...commonRules, "project-exists"],
    REVERT: [...commonRules, "project-exists", "revert-allowed"],
    UPDATE: [...commonRules, "project-exists", "update-allowed"],
  };

  return actionRules[action] || commonRules;
}

/**
 * Valide les données système générées
 * @param {object} systemData - Données système à valider
 * @returns {{valid: boolean, error?: string}}
 */
function validateSystemData(systemData) {
  const requiredFields = [
    "action",
    "projectId",
    "projectPath",
    "config",
    "metadata",
    "validation",
  ];

  for (const field of requiredFields) {
    if (!systemData[field]) {
      return { valid: false, error: `Missing system field: ${field}` };
    }
  }

  // Validation du projectPath
  if (!systemData.projectPath.includes(systemData.projectId)) {
    return { valid: false, error: "projectPath must contain projectId" };
  }

  // Validation de la metadata
  if (!systemData.metadata.processedAt || !systemData.metadata.processedBy) {
    return {
      valid: false,
      error: "Metadata must contain processedAt and processedBy",
    };
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

  // Ajout de métadonnées d'environnement
  processedData.environment = {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    processId: process.pid,
  };

  // Ajout timestamp de début de traitement
  processedData.processing = {
    startedAt: new Date().toISOString(),
    requestProcessor: true,
    nextStage: "workflow-coordinator",
  };
}

console.log(
  `[REQUEST-PROCESSOR] Request processor loaded successfully - PIXEL PERFECT VERSION`
);
