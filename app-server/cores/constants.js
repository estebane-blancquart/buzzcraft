/**
 * Constantes système - VERSION PIXEL PARFAIT
 * @module constants
 * @description Constantes globales et configuration système centralisée
 */

import { resolve, join } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obtenir le répertoire du fichier actuel (app-server/cores/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Racine app-server (remonte d'un niveau depuis app-server/cores/)
const APP_SERVER_ROOT = resolve(__dirname, '../');

// === CHEMINS SYSTÈME ===

/**
 * Chemins absolus vers les ressources système
 * @type {object}
 * @readonly
 */
export const PATHS = {
  // Racine du système
  root: APP_SERVER_ROOT,

  // Données d'entrée - CHEMINS FIXES
  dataInputs: resolve(APP_SERVER_ROOT, "data/inputs"),
  projectTemplates: resolve(APP_SERVER_ROOT, "data/inputs/templates/structure/projects"),
  containerTemplates: resolve(APP_SERVER_ROOT, "data/inputs/templates/structure/containers"),
  componentTemplates: resolve(APP_SERVER_ROOT, "data/inputs/templates/structure/components"),
  codeTemplates: resolve(APP_SERVER_ROOT, "data/inputs/templates/code"),
  schemas: resolve(APP_SERVER_ROOT, "data/inputs/schemas"),

  // Données de sortie
  dataOutputs: resolve(APP_SERVER_ROOT, "data/outputs"),

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
  REVERT: "REVERT", // BUILT/OFFLINE/ONLINE → DRAFT
  UPDATE: "UPDATE", // DRAFT → DRAFT (save)
};

/**
 * Transitions d'états autorisées dans la machine à états
 * @type {object}
 * @readonly
 */
export const VALID_TRANSITIONS = {
  VOID: ["CREATE"],
  DRAFT: ["BUILD", "DELETE", "UPDATE"],
  BUILT: ["DEPLOY", "REVERT", "DELETE"],
  OFFLINE: ["START", "REVERT", "DELETE"],
  ONLINE: ["STOP", "DELETE"],
};

// === MESSAGES D'ERREUR ===

/**
 * Messages d'erreur standardisés
 * @type {object}
 * @readonly
 */
export const ERROR_MESSAGES = {
  MISSING_PROJECT_ID: "Project ID is required",
  INVALID_PROJECT_ID: "Project ID must contain only lowercase letters, numbers, and hyphens",
  PROJECT_NOT_FOUND: "Project not found",
  PROJECT_ALREADY_EXISTS: "Project already exists",
  INVALID_STATE: "Project is not in the correct state for this operation",
  INVALID_ACTION: "Unknown or invalid action",
  INVALID_TRANSITION: "State transition not allowed",
  VALIDATION_ERROR: "Data validation failed",
  FILE_NOT_FOUND: "Required file not found",
  TEMPLATE_NOT_FOUND: "Template not found",
  PERMISSION_DENIED: "Permission denied",
  NETWORK_ERROR: "Network communication error",
  TIMEOUT_ERROR: "Operation timeout",
  UNKNOWN_ERROR: "An unknown error occurred",
};

/**
 * Messages de succès standardisés
 * @type {object}
 * @readonly
 */
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: "Project created successfully",
  PROJECT_UPDATED: "Project updated successfully",
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
  if (!currentState || !VALID_TRANSITIONS[currentState]) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_STATE,
    };
  }

  if (!VALID_TRANSITIONS[currentState].includes(action)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_TRANSITION,
    };
  }

  return { valid: true };
}

/**
 * Valide une action de workflow
 * @param {string} action - Action à valider
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 *
 * @example
 * const result = validateWorkflowAction('BUILD');
 * if (!result.valid) console.error(result.error);
 */
export function validateWorkflowAction(action) {
  if (!action || typeof action !== "string") {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_ACTION,
    };
  }

  const validActions = Object.values(WORKFLOW_ACTIONS);
  if (!validActions.includes(action.toUpperCase())) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_ACTION,
    };
  }

  return { valid: true };
}

/**
 * Normalise un ID de projet selon les règles
 * @param {string} input - ID brut à normaliser
 * @returns {string} ID normalisé
 *
 * @example
 * const normalized = normalizeProjectId('Mon Super Projet!');
 * // Returns: 'mon-super-projet'
 */
export function normalizeProjectId(input) {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Supprimer caractères invalides
    .replace(/\s+/g, "-") // Espaces → tirets
    .replace(/-+/g, "-") // Tirets multiples → tiret unique
    .replace(/^-+|-+$/g, ""); // Supprimer tirets début/fin
}

/**
 * Formate un nom de projet à partir de son ID
 * @param {string} projectId - ID du projet
 * @returns {string} Nom formaté
 *
 * @example
 * const name = formatProjectName('mon-super-projet');
 * // Returns: 'Mon Super Projet'
 */
export function formatProjectName(projectId) {
  if (!projectId || typeof projectId !== "string") {
    return "Untitled Project";
  }

  return projectId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Génère un horodatage standardisé
 * @returns {string} Horodatage ISO
 *
 * @example
 * const timestamp = generateTimestamp();
 * // Returns: '2024-01-15T10:30:45.123Z'
 */
export function generateTimestamp() {
  return new Date().toISOString();
}

/**
 * Valide la structure d'un objet de configuration
 * @param {object} config - Configuration à valider
 * @param {string[]} requiredFields - Champs obligatoires
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 *
 * @example
 * const result = validateConfig(config, ['name', 'template']);
 * if (!result.valid) console.error(result.error);
 */
export function validateConfig(config, requiredFields = []) {
  if (!config || typeof config !== "object") {
    return {
      valid: false,
      error: "Configuration must be an object",
    };
  }

for (const field of requiredFields) {
  if (!(field in config)) {
    return {
      valid: false,
      error: `Missing required field: ${field}`,
    };
  }
}

return { valid: true };
}

// === COULEURS LOGS ===
export const LOG_COLORS = {
  // Couleurs simples pour les logs console
  success: '\x1b[32m',  // Vert
  warning: '\x1b[33m',  // Jaune  
  error: '\x1b[31m',    // Rouge
  info: '\x1b[36m',     // Cyan
  debug: '\x1b[90m',    // Gris
  reset: '\x1b[0m',     // Reset
  
  // Couleurs pour états projets
  projectStates: {
    DRAFT: { console: '\x1b[35m', css: '#524e9b' },
    BUILT: { console: '\x1b[34m', css: '#3b82f6' },
    OFFLINE: { console: '\x1b[33m', css: '#f59e0b' },
    ONLINE: { console: '\x1b[32m', css: '#10b981' },
  },
  
  // Couleurs détaillées (pour usage avancé)
  messages: {
    success: { console: '\x1b[32m', css: '#22c55e' },
    warning: { console: '\x1b[33m', css: '#fbbf24' },
    error: { console: '\x1b[31m', css: '#ef4444' },
    info: { console: '\x1b[36m', css: '#0ea5e9' },
    debug: { console: '\x1b[90m', css: '#9ca3af' },
  }
};

