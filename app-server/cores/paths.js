import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { stat } from 'fs/promises';

/**
 * Résolution sécurisée de paths absolus pour BuzzCraft - VERSION PIXEL PARFAIT
 * @module paths
 * @description Gestion centralisée des chemins avec validation et sécurité
 */

// Résolution du chemin racine
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../..');

// Paths de base du projet
const PATHS = {
  root: PROJECT_ROOT,
  serverData: resolve(PROJECT_ROOT, 'app-server/data'),
  inputs: resolve(PROJECT_ROOT, 'app-server/data/inputs'),
  outputs: resolve(PROJECT_ROOT, 'app-server/data/outputs'),
  templates: resolve(PROJECT_ROOT, 'app-server/data/inputs/templates'),
  schemas: resolve(PROJECT_ROOT, 'app-server/data/inputs/schemas')
};

/**
 * Génère le path absolu vers un projet
 * @param {string} projectId - Identifiant du projet
 * @returns {string} Path absolu vers le dossier projet
 * @throws {ValidationError} Si projectId invalide
 * 
 * @example
 * const path = getProjectPath('mon-site');
 * // Returns: '/absolute/path/to/outputs/mon-site'
 */
export function getProjectPath(projectId) {
  console.log(`[PATH-RESOLVER] Resolving project path: ${projectId}`);
  
  validateProjectId(projectId);
  
  const resolvedPath = resolve(PATHS.outputs, projectId);
  console.log(`[PATH-RESOLVER] Project path resolved: ${resolvedPath}`);
  
  return resolvedPath;
}

/**
 * Génère le path vers un fichier dans un projet
 * @param {string} projectId - Identifiant du projet
 * @param {string} filename - Nom du fichier
 * @returns {string} Path absolu vers le fichier projet
 * @throws {ValidationError} Si paramètres invalides
 * 
 * @example
 * const path = getProjectFilePath('mon-site', 'project.json');
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
 * Génère le path vers un template spécifique
 * @param {string} templateType - Type de template ('project', 'component', etc.)
 * @param {string} templateId - ID du template
 * @returns {string} Path absolu vers le template
 * @throws {ValidationError} Si paramètres invalides
 * 
 * @example
 * const path = getTemplatePath('project', 'basic');
 * // Returns: '/absolute/path/to/templates/project/basic.json'
 */
export function getTemplatePath(templateType, templateId) {
  console.log(`[PATH-RESOLVER] Resolving template: ${templateType}/${templateId}`);
  
  validateTemplateType(templateType);
  validateTemplateId(templateId);
  
  const templatePath = resolve(PATHS.templates, templateType, `${templateId}.json`);
  console.log(`[PATH-RESOLVER] Template path resolved: ${templatePath}`);
  
  return templatePath;
}

/**
 * Génère le path vers un schéma de validation
 * @param {string} schemaId - ID du schéma
 * @returns {string} Path absolu vers le schéma
 * @throws {ValidationError} Si schemaId invalide
 * 
 * @example
 * const path = getSchemaPath('project-v1');
 * // Returns: '/absolute/path/to/schemas/project-v1.json'
 */
export function getSchemaPath(schemaId) {
  console.log(`[PATH-RESOLVER] Resolving schema: ${schemaId}`);
  
  validateSchemaId(schemaId);
  
  const schemaPath = resolve(PATHS.schemas, `${schemaId}.json`);
  console.log(`[PATH-RESOLVER] Schema path resolved: ${schemaPath}`);
  
  return schemaPath;
}

/**
 * Génère le path vers les templates de code
 * @param {string} relativePath - Chemin relatif dans templates/code
 * @returns {string} Path absolu vers le template de code
 * @throws {ValidationError} Si relativePath invalide
 * 
 * @example
 * const path = getCodeTemplatePath('app-visitor/src/App.tsx.hbs');
 * // Returns: '/absolute/path/to/templates/code/app-visitor/src/App.tsx.hbs'
 */
export function getCodeTemplatePath(relativePath) {
  console.log(`[PATH-RESOLVER] Resolving code template: ${relativePath}`);
  
  validateRelativePath(relativePath);
  
  const codePath = resolve(PATHS.templates, 'code', relativePath);
  console.log(`[PATH-RESOLVER] Code template path resolved: ${codePath}`);
  
  return codePath;
}

// === FONCTIONS DE VALIDATION ===

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
  
  // Validation pattern sécurisé
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    throw new Error('ValidationError: projectId must contain only lowercase letters, numbers, and hyphens');
  }
}

/**
 * Valide un type de template
 * @private
 */
function validateTemplateType(templateType) {
  if (!templateType || typeof templateType !== 'string') {
    throw new Error('ValidationError: templateType must be non-empty string');
  }
  
  const validTypes = ['project', 'component', 'container', 'layout'];
  if (!validTypes.includes(templateType)) {
    throw new Error(`ValidationError: templateType must be one of: ${validTypes.join(', ')}`);
  }
}

/**
 * Valide un ID de template
 * @private
 */
function validateTemplateId(templateId) {
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

console.log(`[PATH-RESOLVER] Path resolver loaded successfully - PIXEL PERFECT VERSION`);