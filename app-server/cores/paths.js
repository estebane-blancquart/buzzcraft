import { resolve } from "path";
import { PATHS } from "./constants.js";

/**
 * Résolution centralisée de tous les paths BuzzCraft - VERSION PIXEL PARFAIT
 * @module paths
 * @description Utilitaires pour générer des chemins absolus vers tous les assets BuzzCraft
 */

/**
 * Résout un path de projet spécifique
 * @param {string} projectId - Identifiant unique du projet
 * @returns {string} Path absolu vers le répertoire du projet
 * @throws {ValidationError} Si projectId manquant ou invalide
 * 
 * @example
 * const projectPath = getProjectPath('mon-site-web');
 * // Returns: '/absolute/path/to/app-server/data/outputs/mon-site-web'
 */
export function getProjectPath(projectId) {
  console.log(`[PATH-RESOLVER] Resolving project path for: ${projectId}`);
  
  validateProjectId(projectId);
  
  const resolvedPath = resolve(PATHS.serverOutputs, projectId);
  console.log(`[PATH-RESOLVER] Project path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Résout un path de template structure par type et ID
 * @param {string} templateType - Type de template ('project', 'component', 'container')
 * @param {string} templateId - Identifiant du template
 * @returns {string} Path absolu vers le fichier template JSON
 * @throws {ValidationError} Si paramètres manquants ou type inconnu
 * 
 * @example
 * const templatePath = getTemplatePath('component', 'button');
 * // Returns: '/absolute/path/to/templates/structure/components/button.json'
 */
export function getTemplatePath(templateType, templateId) {
  console.log(`[PATH-RESOLVER] Resolving template path: ${templateType}/${templateId}`);
  
  validateTemplateParameters(templateType, templateId);
  
  const typeMap = {
    'project': PATHS.templatesProjects,
    'component': PATHS.templatesComponents,
    'container': PATHS.templatesContainers
  };
  
  const basePath = typeMap[templateType];
  if (!basePath) {
    throw new Error(`ValidationError: unknown template type '${templateType}'. Valid: ${Object.keys(typeMap).join(', ')}`);
  }
  
  const resolvedPath = resolve(basePath, `${templateId}.json`);
  console.log(`[PATH-RESOLVER] Template path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Résout un path de template code Handlebars
 * @param {string} relativePath - Chemin relatif depuis templates/code/
 * @returns {string} Path absolu vers le fichier template Handlebars
 * @throws {ValidationError} Si relativePath manquant
 * 
 * @example
 * const codePath = getCodeTemplatePath('app-visitor/components/Button.tsx.hbs');
 * // Returns: '/absolute/path/to/templates/code/app-visitor/components/Button.tsx.hbs'
 */
export function getCodeTemplatePath(relativePath) {
  console.log(`[PATH-RESOLVER] Resolving code template path: ${relativePath}`);
  
  validateRelativePath(relativePath);
  
  const resolvedPath = resolve(PATHS.templatesCode, relativePath);
  console.log(`[PATH-RESOLVER] Code template path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Résout un path de validation schema JSON
 * @param {string} schemaId - Identifiant du schema de validation
 * @returns {string} Path absolu vers le fichier schema JSON
 * @throws {ValidationError} Si schemaId manquant
 * 
 * @example
 * const schemaPath = getValidationSchemaPath('component-button');
 * // Returns: '/absolute/path/to/validations/component-button.schema.json'
 */
export function getValidationSchemaPath(schemaId) {
  console.log(`[PATH-RESOLVER] Resolving validation schema: ${schemaId}`);
  
  validateSchemaId(schemaId);
  
  const resolvedPath = resolve(PATHS.validations, `${schemaId}.schema.json`);
  console.log(`[PATH-RESOLVER] Schema path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Résout un path relatif depuis la racine du projet BuzzCraft
 * @param {string} relativePath - Chemin relatif depuis la racine
 * @returns {string} Path absolu depuis la racine projet
 * @throws {ValidationError} Si relativePath manquant
 * 
 * @example
 * const configPath = resolveFromRoot('.configs/jest.config.js');
 * // Returns: '/absolute/path/to/buzzcraft/.configs/jest.config.js'
 */
export function resolveFromRoot(relativePath) {
  console.log(`[PATH-RESOLVER] Resolving from root: ${relativePath}`);
  
  validateRelativePath(relativePath);
  
  const resolvedPath = resolve(PATHS.root, relativePath);
  console.log(`[PATH-RESOLVER] Root path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Résout un path relatif depuis le répertoire app-server
 * @param {string} relativePath - Chemin relatif depuis app-server/
 * @returns {string} Path absolu depuis app-server
 * @throws {ValidationError} Si relativePath manquant
 * 
 * @example
 * const enginePath = resolveFromServer('engines/create-coordinator.js');
 * // Returns: '/absolute/path/to/app-server/engines/create-coordinator.js'
 */
export function resolveFromServer(relativePath) {
  console.log(`[PATH-RESOLVER] Resolving from server: ${relativePath}`);
  
  validateRelativePath(relativePath);
  
  const resolvedPath = resolve(PATHS.appServer, relativePath);
  console.log(`[PATH-RESOLVER] Server path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Génère un path pour un fichier spécifique dans un projet
 * @param {string} projectId - Identifiant du projet
 * @param {string} filename - Nom du fichier dans le projet
 * @returns {string} Path absolu vers le fichier dans le projet
 * @throws {ValidationError} Si paramètres manquants
 * 
 * @example
 * const projectFile = getProjectFilePath('mon-site', 'project.json');
 * // Returns: '/absolute/path/to/outputs/mon-site/project.json'
 */
export function getProjectFilePath(projectId, filename) {
  console.log(`[PATH-RESOLVER] Resolving project file: ${projectId}/${filename}`);
  
  validateProjectId(projectId);
  validateFilename(filename);
  
  const resolvedPath = resolve(getProjectPath(projectId), filename);
  console.log(`[PATH-RESOLVER] Project file path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Génère un path pour un service généré dans un projet
 * @param {string} projectId - Identifiant du projet
 * @param {string} servicePath - Chemin du service (ex: 'app-visitor/package.json')
 * @returns {string} Path absolu vers le service généré
 * @throws {ValidationError} Si paramètres manquants
 * 
 * @example
 * const servicePath = getGeneratedServicePath('mon-site', 'app-visitor/src/App.tsx');
 * // Returns: '/absolute/path/to/outputs/mon-site/app-visitor/src/App.tsx'
 */
export function getGeneratedServicePath(projectId, servicePath) {
  console.log(`[PATH-RESOLVER] Resolving generated service: ${projectId}/${servicePath}`);
  
  validateProjectId(projectId);
  validateServicePath(servicePath);
  
  const resolvedPath = resolve(getProjectPath(projectId), servicePath);
  console.log(`[PATH-RESOLVER] Generated service path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Validation rapide qu'un chemin existe (version optimisée)
 * @param {string} path - Chemin à vérifier
 * @returns {Promise<{success: boolean, data: {exists: boolean}}>} Résultat de vérification
 * 
 * @example
 * const result = await validatePathExists('./project.json');
 * if (result.success && result.data.exists) {
 *   console.log('Path exists!');
 * }
 */
export async function validatePathExists(path) {
  console.log(`[PATH-RESOLVER] Validating path existence: ${path}`);
  
  try {
    validatePathString(path);
    
    const { stat } = await import('fs/promises');
    await stat(path);
    
    console.log(`[PATH-RESOLVER] Path exists: ${path}`);
    return {
      success: true,
      data: { exists: true }
    };
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`[PATH-RESOLVER] Path does not exist: ${path}`);
      return {
        success: true,
        data: { exists: false }
      };
    }
    
    console.log(`[PATH-RESOLVER] Path validation failed: ${error.message}`);
    return {
      success: false,
      error: `Path validation failed: ${error.message}`
    };
  }
}

/**
 * Validation batch de l'existence de paths critiques (optimisée)
 * @param {object} [options={}] - Options de validation
 * @param {boolean} [options.checkAll=false] - Vérifier tous les paths ou seulement critiques
 * @param {string[]} [options.customPaths=[]] - Paths supplémentaires à vérifier
 * @returns {Promise<{success: boolean, data: {valid: boolean, missing: string[], errors: string[]}}>} Résultat validation
 */
export async function validateCriticalPaths(options = {}) {
  console.log(`[PATH-RESOLVER] Validating critical paths`);
  
  try {
    const { checkAll = false, customPaths = [] } = options;
    
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
    const allPathsToCheck = [...pathsToCheck, ...customPaths];
    
    // Validation batch optimisée avec Promise.allSettled
    const pathPromises = allPathsToCheck.map(async (pathKey) => {
      try {
        const pathValue = PATHS[pathKey] || pathKey; // Support custom paths
        const result = await validatePathExists(pathValue);
        
        return {
          pathKey,
          pathValue,
          exists: result.success && result.data.exists,
          error: result.error
        };
        
      } catch (error) {
        return {
          pathKey,
          pathValue: PATHS[pathKey] || pathKey,
          exists: false,
          error: error.message
        };
      }
    });
    
    const results = await Promise.allSettled(pathPromises);
    
    // Traitement des résultats
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { pathKey, exists, error } = result.value;
        
        if (!exists) {
          missing.push(pathKey);
        }
        
        if (error) {
          errors.push(`${pathKey}: ${error}`);
        }
      } else {
        errors.push(`Validation failed: ${result.reason.message}`);
      }
    });
    
    const isValid = missing.length === 0 && errors.length === 0;
    
    console.log(`[PATH-RESOLVER] Critical paths validation: ${isValid ? 'VALID' : 'INVALID'} (${missing.length} missing, ${errors.length} errors)`);
    
    return {
      success: true,
      data: {
        valid: isValid,
        missing,
        errors,
        stats: {
          totalChecked: allPathsToCheck.length,
          validCount: allPathsToCheck.length - missing.length,
          validatedAt: new Date().toISOString()
        }
      }
    };
    
  } catch (error) {
    console.log(`[PATH-RESOLVER] Critical paths validation failed: ${error.message}`);
    return {
      success: false,
      error: `Critical paths validation failed: ${error.message}`
    };
  }
}

// === VALIDATION HELPERS (PRIVÉES) ===

/**
 * Valide un ID de projet
 * @private
 */
function validateProjectId(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }
  
  if (projectId.trim().length === 0) {
    throw new Error('ValidationError: projectId cannot be empty or whitespace only');
  }
}

/**
 * Valide les paramètres de template
 * @private
 */
function validateTemplateParameters(templateType, templateId) {
  if (!templateType || typeof templateType !== 'string') {
    throw new Error('ValidationError: templateType must be non-empty string');
  }
  
  if (!templateId || typeof templateId !== 'string') {
    throw new Error('ValidationError: templateId must be non-empty string');
  }
}

/**
 * Valide un chemin relatif
 * @private
 */
function validateRelativePath(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('ValidationError: relativePath must be non-empty string');
  }
  
  if (relativePath.trim().length === 0) {
    throw new Error('ValidationError: relativePath cannot be empty or whitespace only');
  }
}

/**
 * Valide un ID de schema
 * @private
 */
function validateSchemaId(schemaId) {
  if (!schemaId || typeof schemaId !== 'string') {
    throw new Error('ValidationError: schemaId must be non-empty string');
  }
  
  if (schemaId.trim().length === 0) {
    throw new Error('ValidationError: schemaId cannot be empty or whitespace only');
  }
}

/**
 * Valide un nom de fichier
 * @private
 */
function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('ValidationError: filename must be non-empty string');
  }
  
  if (filename.trim().length === 0) {
    throw new Error('ValidationError: filename cannot be empty or whitespace only');
  }
}

/**
 * Valide un chemin de service
 * @private
 */
function validateServicePath(servicePath) {
  if (!servicePath || typeof servicePath !== 'string') {
    throw new Error('ValidationError: servicePath must be non-empty string');
  }
  
  if (servicePath.trim().length === 0) {
    throw new Error('ValidationError: servicePath cannot be empty or whitespace only');
  }
}

/**
 * Valide une chaîne de caractères path
 * @private
 */
function validatePathString(path) {
  if (!path || typeof path !== 'string') {
    throw new Error('ValidationError: path must be non-empty string');
  }
  
  if (path.trim().length === 0) {
    throw new Error('ValidationError: path cannot be empty or whitespace only');
  }
}

// === ALIASES UTILITAIRES ===

/**
 * Alias pour getProjectPath (raccourci fréquent)
 * @param {string} projectId - ID du projet
 * @returns {string} Path du projet
 */
export const projectPath = getProjectPath;

/**
 * Alias pour getProjectFilePath (raccourci fréquent)
 * @param {string} projectId - ID du projet
 * @param {string} filename - Nom du fichier
 * @returns {string} Path du fichier projet
 */
export const projectFile = getProjectFilePath;

console.log(`[PATH-RESOLVER] Paths resolver loaded successfully - PIXEL PERFECT VERSION`);