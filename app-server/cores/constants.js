import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

/**
 * Constantes centralisées pour éviter les cycles d'imports - VERSION PIXEL PARFAIT
 * @module constants
 * @description Toutes les constantes système BuzzCraft organisées par domaine
 */

// Détection automatique de la racine projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORRIGÉ: Navigation depuis app-server/cores/ vers racine buzzcraft/
const PROJECT_ROOT = resolve(__dirname, '../../');

/**
 * Chemins absolus vers tous les répertoires du projet
 * @type {object}
 * @readonly
 */
export const PATHS = {
  // Racine projet
  root: PROJECT_ROOT,
  
  // Services principaux
  appApi: resolve(PROJECT_ROOT, 'app-api'),
  appServer: resolve(PROJECT_ROOT, 'app-server'),
  appClient: resolve(PROJECT_ROOT, 'app-client'),
  
  // Données app-server
  serverData: resolve(PROJECT_ROOT, 'app-server/data'),
  serverInputs: resolve(PROJECT_ROOT, 'app-server/data/inputs'),
  serverOutputs: resolve(PROJECT_ROOT, 'app-server/data/outputs'),
  
  // Templates par catégorie
  templates: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates'),
  templatesStructure: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/structure'),
  templatesCode: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/code'),
  templatesProjects: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/structure/projects'),
  templatesComponents: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/structure/components'),
  templatesContainers: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/structure/containers'),
  
  // Validations et schemas
  validations: resolve(PROJECT_ROOT, 'app-server/data/inputs/validations'),
  
  // Configuration et documentation
  configs: resolve(PROJECT_ROOT, '.configs'),
  docs: resolve(PROJECT_ROOT, '.docs'),
  tests: resolve(PROJECT_ROOT, '.tests'),
};

/**
 * États possibles d'un projet dans la machine à états BuzzCraft
 * @type {object}
 * @readonly
 */
export const PROJECT_STATES = {
  /** Projet inexistant, pas de project.json */
  VOID: 'VOID',
  /** Structure JSON créée, éditable, pas de code généré */
  DRAFT: 'DRAFT',
  /** Services générés, prêts pour déploiement */
  BUILT: 'BUILT',
  /** Containers créés mais arrêtés */
  OFFLINE: 'OFFLINE',
  /** Services actifs, site accessible */
  ONLINE: 'ONLINE'
};

/**
 * Actions de workflow disponibles dans BuzzCraft
 * @type {object}
 * @readonly
 */
export const WORKFLOW_ACTIONS = {
  /** Créer un nouveau projet (VOID → DRAFT) */
  CREATE: 'CREATE',
  /** Générer les services (DRAFT → BUILT) */
  BUILD: 'BUILD',
  /** Déployer les containers (BUILT → OFFLINE) */
  DEPLOY: 'DEPLOY',
  /** Démarrer les services (OFFLINE → ONLINE) */
  START: 'START',
  /** Arrêter les services (ONLINE → OFFLINE) */
  STOP: 'STOP',
  /** Mettre à jour sans changer d'état */
  UPDATE: 'UPDATE',
  /** Supprimer complètement (ANY → VOID) */
  DELETE: 'DELETE',
  /** Revenir en arrière dans la machine à états */
  REVERT: 'REVERT'
};

/**
 * Transitions d'état autorisées pour validation
 * @type {object}
 * @readonly
 */
export const STATE_TRANSITIONS = {
  [PROJECT_STATES.VOID]: [PROJECT_STATES.DRAFT],
  [PROJECT_STATES.DRAFT]: [PROJECT_STATES.BUILT, PROJECT_STATES.VOID],
  [PROJECT_STATES.BUILT]: [PROJECT_STATES.OFFLINE, PROJECT_STATES.DRAFT, PROJECT_STATES.VOID],
  [PROJECT_STATES.OFFLINE]: [PROJECT_STATES.ONLINE, PROJECT_STATES.BUILT, PROJECT_STATES.VOID],
  [PROJECT_STATES.ONLINE]: [PROJECT_STATES.OFFLINE, PROJECT_STATES.VOID]
};

/**
 * Mapping entre actions et transitions d'état attendues
 * @type {object}
 * @readonly
 */
export const ACTION_TRANSITIONS = {
  [WORKFLOW_ACTIONS.CREATE]: { from: PROJECT_STATES.VOID, to: PROJECT_STATES.DRAFT },
  [WORKFLOW_ACTIONS.BUILD]: { from: PROJECT_STATES.DRAFT, to: PROJECT_STATES.BUILT },
  [WORKFLOW_ACTIONS.DEPLOY]: { from: PROJECT_STATES.BUILT, to: PROJECT_STATES.OFFLINE },
  [WORKFLOW_ACTIONS.START]: { from: PROJECT_STATES.OFFLINE, to: PROJECT_STATES.ONLINE },
  [WORKFLOW_ACTIONS.STOP]: { from: PROJECT_STATES.ONLINE, to: PROJECT_STATES.OFFLINE },
  [WORKFLOW_ACTIONS.REVERT]: { from: [PROJECT_STATES.BUILT, PROJECT_STATES.OFFLINE], to: PROJECT_STATES.DRAFT },
  [WORKFLOW_ACTIONS.UPDATE]: { from: [PROJECT_STATES.OFFLINE, PROJECT_STATES.ONLINE], to: 'SAME' },
  [WORKFLOW_ACTIONS.DELETE]: { from: 'ANY', to: PROJECT_STATES.VOID }
};

/**
 * Types d'éléments supportés par le générateur
 * @type {object}
 * @readonly
 */
export const ELEMENT_TYPES = {
  // Components de contenu
  HEADING: 'heading',
  PARAGRAPH: 'paragraph', 
  BUTTON: 'button',
  IMAGE: 'image',
  VIDEO: 'video',
  LINK: 'link',
  
  // Containers de layout
  DIV: 'div',
  LIST: 'list',
  FORM: 'form'
};

/**
 * Types de components (éléments atomiques)
 * @type {string[]}
 * @readonly
 */
export const COMPONENT_TYPES = [
  ELEMENT_TYPES.HEADING,
  ELEMENT_TYPES.PARAGRAPH,
  ELEMENT_TYPES.BUTTON,
  ELEMENT_TYPES.IMAGE,
  ELEMENT_TYPES.VIDEO,
  ELEMENT_TYPES.LINK
];

/**
 * Types de containers (éléments contenant d'autres éléments)
 * @type {string[]}
 * @readonly
 */
export const CONTAINER_TYPES = [
  ELEMENT_TYPES.DIV,
  ELEMENT_TYPES.LIST,
  ELEMENT_TYPES.FORM
];

/**
 * Règles de validation pour les inputs utilisateur
 * @type {object}
 * @readonly
 */
export const VALIDATION_RULES = {
  PROJECT_ID: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-z0-9-]+$/,
    DESCRIPTION: 'Lowercase letters, numbers and hyphens only'
  },
  PROJECT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    DESCRIPTION: 'Human readable project name'
  },
  TEMPLATE_ID: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-z0-9-]+$/,
    DESCRIPTION: 'Template identifier format'
  }
};

/**
 * Limites système pour éviter les abus et timeouts
 * @type {object}
 * @readonly
 */
export const SYSTEM_LIMITS = {
  /** Profondeur maximum pour validation récursive */
  MAX_RECURSION_DEPTH: 10,
  /** Taille maximum d'un fichier template (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Nombre maximum de variables dans un template */
  MAX_TEMPLATE_VARIABLES: 1000,
  /** Timeout compilation Handlebars (30s) */
  COMPILATION_TIMEOUT: 30000,
  /** Timeout workflow complet (5 minutes) */
  WORKFLOW_TIMEOUT: 300000
};

/**
 * Messages d'erreur standardisés
 * @type {object}
 * @readonly
 */
export const ERROR_MESSAGES = {
  // Types d'erreurs
  VALIDATION_ERROR: 'ValidationError',
  GENERATION_ERROR: 'GenerationError',
  COMPILATION_ERROR: 'CompilationError',
  LOAD_ERROR: 'LoadError',
  
  // Messages spécifiques
  INVALID_PROJECT_ID: 'Project ID must be non-empty string matching pattern',
  INVALID_TEMPLATE: 'Template not found or invalid format',
  WORKFLOW_FORBIDDEN: 'Workflow not allowed in current state',
  CYCLES_DETECTED: 'Circular dependency detected',
  TIMEOUT_EXCEEDED: 'Operation timeout exceeded'
};

/**
 * Préfixes de logs pour identification rapide
 * @type {object}
 * @readonly
 */
export const LOG_PREFIXES = {
  TEMPLATE_LOADER: '[TEMPLATE-LOADER]',
  HANDLEBARS_COMPILER: '[HANDLEBARS-COMPILER]', 
  PROJECT_GENERATOR: '[PROJECT-GENERATOR]',
  SERVICE_GENERATOR: '[SERVICE-GENERATOR]',
  WORKFLOW: '[WORKFLOW]',
  STATE_DETECTOR: '[STATE-DETECTOR]',
  PATH_RESOLVER: '[PATH-RESOLVER]',
  VALIDATOR: '[VALIDATOR]',
  SCHEMA_VALIDATOR: '[SCHEMA-VALIDATOR]',
  TEMPLATE_VALIDATOR: '[TEMPLATE-VALIDATOR]',
  VARIABLE_GENERATOR: '[VARIABLE-GENERATOR]'
};

/**
 * Extensions de fichiers supportées
 * @type {object}
 * @readonly
 */
export const FILE_EXTENSIONS = {
  JSON: '.json',
  HANDLEBARS: '.hbs',
  TYPESCRIPT: '.ts',
  TSX: '.tsx',
  JAVASCRIPT: '.js',
  JSX: '.jsx',
  MARKDOWN: '.md',
  SCSS: '.scss',
  CSS: '.css',
  HTML: '.html'
};

/**
 * Utilitaire de debug pour afficher tous les paths calculés
 * @returns {void} Affiche les paths dans la console
 */
export function debugPaths() {
  console.log('\n=== BUZZCRAFT PATHS DEBUG ===');
  Object.entries(PATHS).forEach(([key, path]) => {
    const status = path ? '✅' : '❌';
    console.log(`${status} ${key.padEnd(20)} : ${path}`);
  });
  console.log('==============================\n');
}

/**
 * Valide qu'un état de projet est valide
 * @param {string} state - État à valider
 * @returns {boolean} true si l'état est valide
 */
export function isValidProjectState(state) {
  return Object.values(PROJECT_STATES).includes(state);
}

/**
 * Valide qu'une action de workflow est valide
 * @param {string} action - Action à valider
 * @returns {boolean} true si l'action est valide
 */
export function isValidWorkflowAction(action) {
  return Object.values(WORKFLOW_ACTIONS).includes(action);
}

/**
 * Vérifie si une transition d'état est autorisée
 * @param {string} fromState - État de départ
 * @param {string} toState - État d'arrivée
 * @returns {boolean} true si la transition est autorisée
 */
export function isValidStateTransition(fromState, toState) {
  const allowedTransitions = STATE_TRANSITIONS[fromState];
  return allowedTransitions && allowedTransitions.includes(toState);
}

// === EXPORTS LEGACY (rétrocompatibilité) ===
/** @deprecated Utiliser PATHS.root */
export const PROJECT_ROOT_LEGACY = PROJECT_ROOT;
/** @deprecated Utiliser PATHS.templatesStructure */
export const TEMPLATES_STRUCTURE_PATH = PATHS.templatesStructure;
/** @deprecated Utiliser PATHS.templatesCode */
export const TEMPLATES_CODE_PATH = PATHS.templatesCode;

console.log(`[CONSTANTS] Constants loaded successfully - PIXEL PERFECT VERSION`);