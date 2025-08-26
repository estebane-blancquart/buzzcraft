import { resolve } from "path";
import { PATHS } from "./constants.js";

/*
 * FAIT QUOI : Résolution centralisée de tous les paths BuzzCraft
 * REÇOIT : IDs et paramètres de chemins
 * RETOURNE : Paths absolus résolus
 * ERREURS : ValidationError si paramètres manquants
 */

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
  
  return resolve(PATHS.serverOutputs, projectId);
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

console.log(`[PATHS] Paths resolver loaded successfully`);