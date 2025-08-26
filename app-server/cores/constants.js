import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

/*
 * FAIT QUOI : Constantes centralisées pour éviter les cycles d'imports
 * REÇOIT : Rien (utilise import.meta.url)
 * RETOURNE : Constantes organisées par domaine
 * ERREURS : Aucune (définitions statiques)
 */

// Détection automatique de la racine projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORRIGÉ: Navigation depuis app-server/cores/ vers racine buzzcraft/
const PROJECT_ROOT = resolve(__dirname, '../../');

// === PATHS STATIQUES ===
export const PATHS = {
  // Racine projet
  root: PROJECT_ROOT,
  
  // Services
  appApi: resolve(PROJECT_ROOT, 'app-api'),
  appServer: resolve(PROJECT_ROOT, 'app-server'),
  appClient: resolve(PROJECT_ROOT, 'app-client'),
  
  // Données app-server
  serverData: resolve(PROJECT_ROOT, 'app-server/data'),
  serverInputs: resolve(PROJECT_ROOT, 'app-server/data/inputs'),
  serverOutputs: resolve(PROJECT_ROOT, 'app-server/data/outputs'),
  
  // Templates
  templates: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates'),
  templatesStructure: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/structure'),
  templatesCode: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/code'),
  templatesProjects: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/structure/projects'),
  templatesComponents: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/structure/components'),
  templatesContainers: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/structure/containers'),
  
  // Validations
  validations: resolve(PROJECT_ROOT, 'app-server/data/inputs/validations'),
  
  // Configuration
  configs: resolve(PROJECT_ROOT, '.configs'),
  docs: resolve(PROJECT_ROOT, '.docs'),
  tests: resolve(PROJECT_ROOT, '.tests'),
};

// === ÉTATS PROJETS ===
export const PROJECT_STATES = {
  VOID: 'VOID',
  DRAFT: 'DRAFT',
  BUILT: 'BUILT',
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE'
};

// === ACTIONS WORKFLOWS ===
export const WORKFLOW_ACTIONS = {
  CREATE: 'CREATE',
  BUILD: 'BUILD',
  DEPLOY: 'DEPLOY',
  START: 'START',
  STOP: 'STOP',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  REVERT: 'REVERT'
};

// === TRANSITIONS ÉTATS AUTORISÉES ===
export const STATE_TRANSITIONS = {
  [PROJECT_STATES.VOID]: [PROJECT_STATES.DRAFT],
  [PROJECT_STATES.DRAFT]: [PROJECT_STATES.BUILT, PROJECT_STATES.VOID],
  [PROJECT_STATES.BUILT]: [PROJECT_STATES.OFFLINE, PROJECT_STATES.DRAFT, PROJECT_STATES.VOID],
  [PROJECT_STATES.OFFLINE]: [PROJECT_STATES.ONLINE, PROJECT_STATES.BUILT, PROJECT_STATES.VOID],
  [PROJECT_STATES.ONLINE]: [PROJECT_STATES.OFFLINE, PROJECT_STATES.VOID]
};

// === MAPPING ACTION → TRANSITION ===
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

// === TYPES ÉLÉMENTS ===
export const ELEMENT_TYPES = {
  // Components
  HEADING: 'heading',
  PARAGRAPH: 'paragraph', 
  BUTTON: 'button',
  IMAGE: 'image',
  VIDEO: 'video',
  LINK: 'link',
  
  // Containers
  DIV: 'div',
  LIST: 'list',
  FORM: 'form'
};

export const COMPONENT_TYPES = [
  ELEMENT_TYPES.HEADING,
  ELEMENT_TYPES.PARAGRAPH,
  ELEMENT_TYPES.BUTTON,
  ELEMENT_TYPES.IMAGE,
  ELEMENT_TYPES.VIDEO,
  ELEMENT_TYPES.LINK
];

export const CONTAINER_TYPES = [
  ELEMENT_TYPES.DIV,
  ELEMENT_TYPES.LIST,
  ELEMENT_TYPES.FORM
];

// === VALIDATIONS CONSTANTES ===
export const VALIDATION_RULES = {
  PROJECT_ID: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-z0-9-]+$/
  },
  PROJECT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  TEMPLATE_ID: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-z0-9-]+$/
  }
};

// === TIMEOUTS & LIMITS ===
export const SYSTEM_LIMITS = {
  MAX_RECURSION_DEPTH: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TEMPLATE_VARIABLES: 1000,
  COMPILATION_TIMEOUT: 30000, // 30 secondes
  WORKFLOW_TIMEOUT: 300000 // 5 minutes
};

// === MESSAGES D'ERREUR ===
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'ValidationError',
  GENERATION_ERROR: 'GenerationError',
  COMPILATION_ERROR: 'CompilationError',
  LOAD_ERROR: 'LoadError',
  
  INVALID_PROJECT_ID: 'Project ID must be non-empty string matching pattern',
  INVALID_TEMPLATE: 'Template not found or invalid format',
  WORKFLOW_FORBIDDEN: 'Workflow not allowed in current state',
  CYCLES_DETECTED: 'Circular dependency detected',
  TIMEOUT_EXCEEDED: 'Operation timeout exceeded'
};

// === PATTERNS LOG ===
export const LOG_PREFIXES = {
  TEMPLATE_LOADER: '[TEMPLATE-LOADER]',
  HANDLEBARS_COMPILER: '[HANDLEBARS-COMPILER]', 
  PROJECT_GENERATOR: '[PROJECT-GENERATOR]',
  SERVICE_GENERATOR: '[SERVICE-GENERATOR]',
  WORKFLOW: '[WORKFLOW]',
  STATE_DETECTOR: '[STATE-DETECTOR]',
  PATH_RESOLVER: '[PATH-RESOLVER]',
  VALIDATOR: '[VALIDATOR]'
};

// === EXTENSIONS FICHIERS ===
export const FILE_EXTENSIONS = {
  JSON: '.json',
  HANDLEBARS: '.hbs',
  TYPESCRIPT: '.ts',
  TSX: '.tsx',
  JAVASCRIPT: '.js',
  JSX: '.jsx',
  MARKDOWN: '.md',
  SCSS: '.scss'
};

// === EXPORTS LEGACY (rétrocompatibilité) ===
export const PROJECT_ROOT_LEGACY = PROJECT_ROOT;
export const TEMPLATES_STRUCTURE_PATH = PATHS.templatesStructure;
export const TEMPLATES_CODE_PATH = PATHS.templatesCode;