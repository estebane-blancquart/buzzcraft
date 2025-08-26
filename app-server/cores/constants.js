import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Résolution du chemin racine du projet BuzzCraft
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../..');

/**
 * Paths absolus vers tous les répertoires du projet BuzzCraft
 * @type {object}
 * @readonly
 */
export const PATHS = {
  // Racine du projet
  root: PROJECT_ROOT,
  
  // Services principaux
  appApi: resolve(PROJECT_ROOT, 'app-api'),
  appServer: resolve(PROJECT_ROOT, 'app-server'), 
  appClient: resolve(PROJECT_ROOT, 'app-client'),
  
  // Données server
  serverData: resolve(PROJECT_ROOT, 'app-server/data'),
  inputs: resolve(PROJECT_ROOT, 'app-server/data/inputs'),
  outputs: resolve(PROJECT_ROOT, 'app-server/data/outputs'),
  
  // Templates
  templates: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates'),
  projectTemplates: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/projects'),
  codeTemplates: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates/code'),
  
  // Schemas
  schemas: resolve(PROJECT_ROOT, 'app-server/data/inputs/schemas'),
  
  // Configuration
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
  VOID: 'VOID',
  DRAFT: 'DRAFT',
  BUILT: 'BUILT',
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE'
};

/**
 * Actions de workflow disponibles
 * @type {object}
 * @readonly
 */
export const WORKFLOW_ACTIONS = {
  CREATE: 'CREATE',
  BUILD: 'BUILD',
  DEPLOY: 'DEPLOY',
  START: 'START',
  STOP: 'STOP',
  REVERT: 'REVERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

/**
 * Transitions de la machine à états
 * @type {object}
 * @readonly
 */
export const STATE_TRANSITIONS = {
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
 * Types de templates disponibles
 * @type {object}
 * @readonly
 */
export const TEMPLATE_TYPES = {
  PROJECT: 'project',
  COMPONENT: 'component',
  CONTAINER: 'container',
  LAYOUT: 'layout'
};

/**
 * Messages d'erreur standardisés
 * @type {object}
 * @readonly
 */
export const ERROR_MESSAGES = {
  MISSING_PROJECT_ID: 'Project ID is required',
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
 * Extensions pour templates Handlebars
 * @type {object}
 * @readonly
 */
export const TEMPLATE_EXTENSIONS = {
  HANDLEBARS: ['.hbs', '.handlebars'],
  PARTIALS: ['.partial.hbs'],
  LAYOUTS: ['.layout.hbs']
};

/**
 * Utilitaire de debug pour afficher tous les paths calculés avec vérification existence
 * @returns {void} Affiche les paths dans la console
 * 
 * @example
 * import { debugPaths } from './constants.js';
 * debugPaths(); // Affiche tous les paths avec statut EXISTS/MISSING
 */
export function debugPaths() {
  console.log('\n=== BUZZCRAFT PATHS DEBUG ===');
  Object.entries(PATHS).forEach(([key, path]) => {
    const exists = existsSync(path);
    const status = exists ? '✅ EXISTS' : '❌ MISSING';
    console.log(`${key.padEnd(20)} ${status} ${path}`);
  });
  console.log('===============================\n');
}

console.log(`[CONSTANTS] Constants loaded successfully - PIXEL PERFECT VERSION`);