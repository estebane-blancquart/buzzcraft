import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";

/*
 * FAIT QUOI : Résolution centralisée de tous les paths BuzzCraft
 * REÇOIT : Rien (utilise import.meta.url du module appelant)
 * RETOURNE : Object avec tous les paths absolus
 * ERREURS : Aucune (paths calculés statiquement)
 */

// Détection automatique de la racine projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORRIGÉ: Navigation depuis app-server/cores/ vers racine buzzcraft/
const PROJECT_ROOT = resolve(__dirname, '../../');
const OUTPUTS_PATH = resolve(PROJECT_ROOT, 'app-server/data/outputs');

// === PATHS PRINCIPAUX ===

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
  serverOutputs: OUTPUTS_PATH,
  
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

/*
 * FAIT QUOI : Résout un path de projet spécifique
 * REÇOIT : projectId: string
 * RETOURNE : string (path absolu vers le projet)
 * ERREURS : ValidationError si projectId manquant
 */
export function getProjectPath(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }
  
  return resolve(OUTPUTS_PATH, projectId);
}

/*
 * FAIT QUOI : Résout un path de template structure
 * REÇOIT : templateType: string, templateId: string
 * RETOURNE : string (path absolu vers le template)
 * ERREURS : ValidationError si paramètres manquants
 */
export function getTemplatePath(templateType, templateId) {
  if (!templateType || !templateId) {
    throw new Error('ValidationError: templateType and templateId required');
  }
  
  const typeMap = {
    'project': PATHS.templatesProjects,
    'component': PATHS.templatesComponents,
    'container': PATHS.templatesContainers
  };
  
  const basePath = typeMap[templateType];
  if (!basePath) {
    throw new Error(`ValidationError: unknown template type '${templateType}'. Valid: ${Object.keys(typeMap).join(', ')}`);
  }
  
  return resolve(basePath, `${templateId}.json`);
}

/*
 * FAIT QUOI : Résout un path de template code
 * REÇOIT : relativePath: string
 * RETOURNE : string (path absolu vers le template code)
 * ERREURS : ValidationError si relativePath manquant
 */
export function getCodeTemplatePath(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('ValidationError: relativePath must be non-empty string');
  }
  
  return resolve(PATHS.templatesCode, relativePath);
}

/*
 * FAIT QUOI : Résout un path de validation schema
 * REÇOIT : schemaId: string
 * RETOURNE : string (path absolu vers le schema)
 * ERREURS : ValidationError si schemaId manquant
 */
export function getValidationSchemaPath(schemaId) {
  if (!schemaId || typeof schemaId !== 'string') {
    throw new Error('ValidationError: schemaId must be non-empty string');
  }
  
  return resolve(PATHS.validations, `${schemaId}.schema.json`);
}

/*
 * FAIT QUOI : Résout un path relatif depuis la racine projet
 * REÇOIT : relativePath: string
 * RETOURNE : string (path absolu)
 * ERREURS : ValidationError si relativePath manquant
 */
export function resolveFromRoot(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('ValidationError: relativePath must be non-empty string');
  }
  
  return resolve(PATHS.root, relativePath);
}

/*
 * FAIT QUOI : Résout un path relatif depuis app-server
 * REÇOIT : relativePath: string
 * RETOURNE : string (path absolu)
 * ERREURS : ValidationError si relativePath manquant
 */
export function resolveFromServer(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('ValidationError: relativePath must be non-empty string');
  }
  
  return resolve(PATHS.appServer, relativePath);
}

/*
 * FAIT QUOI : Génère un path pour fichier de projet
 * REÇOIT : projectId: string, filename: string
 * RETOURNE : string (path absolu vers le fichier)
 * ERREURS : ValidationError si paramètres manquants
 */
export function getProjectFilePath(projectId, filename) {
  if (!projectId || !filename) {
    throw new Error('ValidationError: projectId and filename required');
  }
  
  return resolve(getProjectPath(projectId), filename);
}

/*
 * FAIT QUOI : Génère un path pour service généré
 * REÇOIT : projectId: string, servicePath: string
 * RETOURNE : string (path absolu vers le service)
 * ERREURS : ValidationError si paramètres manquants
 */
export function getGeneratedServicePath(projectId, servicePath) {
  if (!projectId || !servicePath) {
    throw new Error('ValidationError: projectId and servicePath required');
  }
  
  return resolve(getProjectPath(projectId), servicePath);
}

/*
 * FAIT QUOI : Debug - affiche tous les paths calculés
 * REÇOIT : Rien
 * RETOURNE : void (logs seulement)
 * ERREURS : Aucune
 */
export function debugPaths() {
  console.log('\n=== BUZZCRAFT PATHS DEBUG ===');
  Object.entries(PATHS).forEach(([key, path]) => {
    console.log(`${key.padEnd(20)} : ${path}`);
  });
  console.log('==============================\n');
}

/*
 * FAIT QUOI : Validation que tous les paths existent (optionnel)
 * REÇOIT : options: object
 * RETOURNE : { valid: boolean, missing: string[], errors: string[] }
 * ERREURS : Aucune (validation défensive)
 */
export async function validatePathsExistence(options = {}) {
  const { checkAll = false } = options;
  
  const missing = [];
  const errors = [];
  
  // Paths critiques qui doivent toujours exister
  const criticalPaths = [
    'root',
    'appServer',
    'serverData',
    'templates'
  ];
  
  const pathsToCheck = checkAll ? Object.keys(PATHS) : criticalPaths;
  
  for (const pathKey of pathsToCheck) {
    try {
      const pathValue = PATHS[pathKey];
      const { stat } = await import('fs/promises');
      await stat(pathValue);
    } catch (error) {
      if (error.code === 'ENOENT') {
        missing.push(pathKey);
      } else {
        errors.push(`${pathKey}: ${error.message}`);
      }
    }
  }
  
  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

// === EXPORTS LEGACY (rétrocompatibilité) ===

// Pour migration progressive depuis l'ancien système
export const PROJECT_ROOT_LEGACY = PROJECT_ROOT;
export const TEMPLATES_STRUCTURE_PATH = PATHS.templatesStructure;
export const TEMPLATES_CODE_PATH = PATHS.templatesCode;