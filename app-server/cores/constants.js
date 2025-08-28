/**
 * Constantes système - VERSION PIXEL PARFAIT
 * @module constants
 * @description Constantes globales et configuration système centralisée
 */

import { resolve, join } from "path";
import { existsSync } from "fs";

// === CHEMINS SYSTÈME ===

/**
 * Chemins absolus vers les ressources système
 * @type {object}
 * @readonly
 */
export const PATHS = {
  // Racine du système
  root: resolve("../app-server"),

  // Données d'entrée
  dataInputs: resolve("../app-server/data/inputs"),
  projectTemplates: resolve(
    "../app-server/data/inputs/templates/structure/projects"
  ),
  containerTemplates: resolve(
    "../app-server/data/inputs/templates/structure/containers"
  ),
  componentTemplates: resolve(
    "../app-server/data/inputs/templates/structure/components"
  ),
  codeTemplates: resolve("../app-server/data/inputs/templates/code"),
  schemas: resolve("../app-server/data/inputs/schemas"),

  // Données de sortie
  dataOutputs: resolve("../app-server/data/outputs"),

  // Configuration
  configs: resolve("./configs"),

  // Logs et temporaire
  logs: resolve("./logs"),
  temp: resolve("./temp"),
  backups: resolve("./backups"),
};

// === ÉTATS PROJET ===

/**
 * États possibles d'un projet dans la machine à états
 * @type {object}
 * @readonly
 */
export const PROJECT_STATES = {
  VOID: "VOID", // Projet inexistant
  DRAFT: "DRAFT", // Projet créé, éditable
  BUILT: "BUILT", // Code généré, prêt à déployer
  OFFLINE: "OFFLINE", // Containers créés mais arrêtés
  ONLINE: "ONLINE", // Services actifs et accessibles
};

/**
 * Actions de workflow disponibles
 * @type {object}
 * @readonly
 */
export const WORKFLOW_ACTIONS = {
  CREATE: "CREATE", // VOID → DRAFT
  BUILD: "BUILD", // DRAFT → BUILT
  DEPLOY: "DEPLOY", // BUILT → OFFLINE
  START: "START", // OFFLINE → ONLINE
  STOP: "STOP", // ONLINE → OFFLINE
  DELETE: "DELETE", // ANY → VOID
  REVERT: "REVERT", // BUILT/OFFLINE → DRAFT
  UPDATE: "UPDATE", // ONLINE → ONLINE
};

/**
 * Transitions autorisées de la machine à états
 * @type {object}
 * @readonly
 */
export const STATE_TRANSITIONS = {
  [WORKFLOW_ACTIONS.CREATE]: {
    from: PROJECT_STATES.VOID,
    to: PROJECT_STATES.DRAFT,
  },
  [WORKFLOW_ACTIONS.BUILD]: {
    from: PROJECT_STATES.DRAFT,
    to: PROJECT_STATES.BUILT,
  },
  [WORKFLOW_ACTIONS.DEPLOY]: {
    from: PROJECT_STATES.BUILT,
    to: PROJECT_STATES.OFFLINE,
  },
  [WORKFLOW_ACTIONS.START]: {
    from: PROJECT_STATES.OFFLINE,
    to: PROJECT_STATES.ONLINE,
  },
  [WORKFLOW_ACTIONS.STOP]: {
    from: PROJECT_STATES.ONLINE,
    to: PROJECT_STATES.OFFLINE,
  },
  [WORKFLOW_ACTIONS.DELETE]: {
    from: "ANY",
    to: PROJECT_STATES.VOID,
  },
  [WORKFLOW_ACTIONS.REVERT]: {
    from: [PROJECT_STATES.BUILT, PROJECT_STATES.OFFLINE],
    to: PROJECT_STATES.DRAFT,
  },
  [WORKFLOW_ACTIONS.UPDATE]: {
    from: PROJECT_STATES.ONLINE,
    to: PROJECT_STATES.ONLINE,
  },
};

// === TYPES D'ÉLÉMENTS ===

/**
 * Types de composants supportés
 * @type {object}
 * @readonly
 */
export const COMPONENT_TYPES = {
  HEADING: "heading",
  PARAGRAPH: "paragraph",
  BUTTON: "button",
  IMAGE: "image",
  VIDEO: "video",
  LINK: "link",
};

/**
 * Types de containers supportés
 * @type {object}
 * @readonly
 */
export const CONTAINER_TYPES = {
  DIV: "div",
  LIST: "list",
  FORM: "form",
};

/**
 * Tous les types d'éléments DOM
 * @type {string[]}
 * @readonly
 */
export const ALL_ELEMENT_TYPES = [
  ...Object.values(COMPONENT_TYPES),
  ...Object.values(CONTAINER_TYPES),
];

// === EXTENSIONS FICHIERS ===

/**
 * Extensions de fichiers supportées par le système
 * @type {object}
 * @readonly
 */
export const FILE_EXTENSIONS = {
  // Données
  JSON: ".json",

  // Templates
  HANDLEBARS: ".hbs",

  // Code généré
  JAVASCRIPT: ".js",
  JSX: ".jsx",
  TYPESCRIPT: ".ts",
  TSX: ".tsx",
  HTML: ".html",
  CSS: ".css",
  SCSS: ".scss",

  // Documentation
  MARKDOWN: ".md",
};

/**
 * Extensions spécifiques aux templates
 * @type {object}
 * @readonly
 */
export const TEMPLATE_EXTENSIONS = {
  HANDLEBARS: [".hbs", ".handlebars"],
  PARTIALS: [".partial.hbs"],
  LAYOUTS: [".layout.hbs"],
};

// === MESSAGES D'ERREUR ===

/**
 * Messages d'erreur standardisés
 * @type {object}
 * @readonly
 */
export const ERROR_MESSAGES = {
  // Validation des paramètres
  MISSING_PROJECT_ID: "Project ID is required",
  INVALID_PROJECT_ID: "Project ID must be non-empty string matching pattern",
  MISSING_CONFIG: "Configuration object is required",

  // États et workflows
  INVALID_STATE: "Invalid project state",
  WORKFLOW_FORBIDDEN: "Workflow not allowed in current state",
  STATE_TRANSITION_ERROR: "State transition not permitted",

  // Templates et fichiers
  TEMPLATE_NOT_FOUND: "Template not found",
  INVALID_TEMPLATE: "Template format is invalid",
  FILE_READ_ERROR: "File read operation failed",
  FILE_WRITE_ERROR: "File write operation failed",

  // Validation
  VALIDATION_ERROR: "Data validation failed",
  SCHEMA_ERROR: "Schema validation failed",

  // Système
  INTERNAL_ERROR: "Internal system error",
  TIMEOUT_ERROR: "Operation timeout exceeded",
  PERMISSION_ERROR: "Insufficient permissions",
};

/**
 * Messages de succès standardisés
 * @type {object}
 * @readonly
 */
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: "Project created successfully",
  PROJECT_BUILT: "Project built successfully",
  PROJECT_DEPLOYED: "Project deployed successfully",
  PROJECT_STARTED: "Project started successfully",
  PROJECT_STOPPED: "Project stopped successfully",
  PROJECT_DELETED: "Project deleted successfully",
  TEMPLATE_LOADED: "Template loaded successfully",
  FILE_WRITTEN: "File written successfully",
};

// === PRÉFIXES LOGS ===

/**
 * Préfixes pour identification des logs
 * @type {object}
 * @readonly
 */
export const LOG_PREFIXES = {
  // Coordinateurs
  CREATE: "[CREATE]",
  BUILD: "[BUILD]",
  DEPLOY: "[DEPLOY]",
  START: "[START]",
  STOP: "[STOP]",
  DELETE: "[DELETE]",
  UPDATE: "[UPDATE]",

  // Détecteurs
  VOID_DETECTOR: "[VOID-DETECTOR]",
  DRAFT_DETECTOR: "[DRAFT-DETECTOR]",
  BUILT_DETECTOR: "[BUILT-DETECTOR]",
  OFFLINE_DETECTOR: "[OFFLINE-DETECTOR]",
  ONLINE_DETECTOR: "[ONLINE-DETECTOR]",

  // Cores
  READER: "[READER]",
  WRITER: "[WRITER]",
  PATHS: "[PATHS]",
  EXTRACTOR: "[EXTRACTOR]",
};

// === CONFIGURATION SYSTÈME ===

/**
 * Configuration par défaut du système
 * @type {object}
 * @readonly
 */
export const SYSTEM_CONFIG = {
  // Limites
  MAX_PROJECT_NAME_LENGTH: 100,
  MAX_PROJECTS_PER_USER: 50,
  MAX_PAGES_PER_PROJECT: 20,
  MAX_COMPONENTS_PER_PAGE: 100,

  // Timeouts (en millisecondes)
  DEFAULT_TIMEOUT: 30000,
  BUILD_TIMEOUT: 120000,
  DEPLOY_TIMEOUT: 180000,

  // Validation
  PROJECT_ID_PATTERN: /^[a-z0-9-]+$/,
  MIN_PROJECT_ID_LENGTH: 3,
  MAX_PROJECT_ID_LENGTH: 50,

  // Build
  DEFAULT_BUILD_TARGETS: ["app-visitor"],
  SUPPORTED_BUILD_TARGETS: ["app-visitor", "app-server"],
};

// === UTILITAIRES ===

/**
 * Valide qu'un ID de projet respecte les règles système
 * @param {string} projectId - ID à valider
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 *
 * @example
 * const result = validateProjectId('mon-projet');
 * if (!result.valid) console.error(result.error);
 */
export function validateProjectId(projectId) {
  if (!projectId || typeof projectId !== "string") {
    return {
      valid: false,
      error: ERROR_MESSAGES.MISSING_PROJECT_ID,
    };
  }

  if (projectId.length < SYSTEM_CONFIG.MIN_PROJECT_ID_LENGTH) {
    return {
      valid: false,
      error: `Project ID must be at least ${SYSTEM_CONFIG.MIN_PROJECT_ID_LENGTH} characters`,
    };
  }

  if (projectId.length > SYSTEM_CONFIG.MAX_PROJECT_ID_LENGTH) {
    return {
      valid: false,
      error: `Project ID must be at most ${SYSTEM_CONFIG.MAX_PROJECT_ID_LENGTH} characters`,
    };
  }

  if (!SYSTEM_CONFIG.PROJECT_ID_PATTERN.test(projectId)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_PROJECT_ID,
    };
  }

  return { valid: true };
}

/**
 * Vérifie si une transition d'état est autorisée
 * @param {string} currentState - État actuel
 * @param {string} action - Action à exécuter
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 *
 * @example
 * const result = validateStateTransition('DRAFT', 'BUILD');
 * if (!result.valid) console.error(result.error);
 */
export function validateStateTransition(currentState, action) {
  const transition = STATE_TRANSITIONS[action];

  if (!transition) {
    return {
      valid: false,
      error: `Unknown action: ${action}`,
    };
  }

  // Cas spécial : DELETE autorisé depuis tout état
  if (action === WORKFLOW_ACTIONS.DELETE) {
    return { valid: true };
  }

  // Vérification transition standard
  if (Array.isArray(transition.from)) {
    // Transition depuis plusieurs états possibles
    if (!transition.from.includes(currentState)) {
      return {
        valid: false,
        error: `Action ${action} not allowed from state ${currentState}. Allowed from: ${transition.from.join(", ")}`,
      };
    }
  } else {
    // Transition depuis un seul état
    if (currentState !== transition.from) {
      return {
        valid: false,
        error: `Action ${action} not allowed from state ${currentState}. Required state: ${transition.from}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Utilitaire de debug pour afficher tous les chemins système
 * @returns {void} Affiche les paths dans la console avec leur statut
 *
 * @example
 * debugPaths(); // Affiche tous les chemins avec EXISTS/MISSING
 */
export function debugPaths() {
  console.log("\n=== BUZZCRAFT SYSTEM PATHS DEBUG ===");

  Object.entries(PATHS).forEach(([key, path]) => {
    const exists = existsSync(path);
    const status = exists ? "✅ EXISTS" : "❌ MISSING";
    const displayKey = key.padEnd(20);

    console.log(`${displayKey} ${status} ${path}`);
  });

  console.log("=====================================\n");
}

console.log(
  `[CONSTANTS] Constants loaded successfully - PIXEL PERFECT VERSION`
);
