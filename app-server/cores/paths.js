/**
 * Générateur de chemins système - VERSION PIXEL PARFAIT
 * @module paths
 * @description Génération sécurisée des chemins de fichiers et dossiers
 */

import { resolve, join, normalize } from 'path';
import { PATHS, validateProjectId } from './constants.js';

/**
 * Génère le chemin absolu vers le dossier d'un projet
 * @param {string} projectId - ID du projet
 * @returns {string} Chemin absolu vers le dossier projet
 * @throws {ValidationError} Si projectId invalide
 * 
 * @example
 * const path = getProjectPath('mon-site');
 * // Returns: '/absolute/path/to/app-server/data/outputs/mon-site'
 */
export function getProjectPath(projectId) {
  console.log(`[PATHS] Resolving project path for: ${projectId}`);
  
  // Validation du projectId
  const validation = validateProjectId(projectId);
  if (!validation.valid) {
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  const projectPath = join(PATHS.dataOutputs, projectId);
  console.log(`[PATHS] Project path resolved: ${projectPath}`);
  
  return projectPath;
}

/**
 * Génère le chemin absolu vers le fichier project.json d'un projet
 * @param {string} projectId - ID du projet
 * @returns {string} Chemin absolu vers project.json
 * @throws {ValidationError} Si projectId invalide
 * 
 * @example
 * const path = getProjectFilePath('mon-site');
 * // Returns: '/absolute/path/to/outputs/mon-site/project.json'
 */
export function getProjectFilePath(projectId) {
  console.log(`[PATHS] Resolving project file path for: ${projectId}`);
  
  // Validation du projectId
  const validation = validateProjectId(projectId);
  if (!validation.valid) {
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  const projectPath = getProjectPath(projectId);
  const projectFilePath = join(projectPath, 'project.json');
  
  console.log(`[PATHS] Project file path resolved: ${projectFilePath}`);
  
  return projectFilePath;
}

/**
 * Génère le chemin vers un template de projet
 * @param {string} templateId - ID du template
 * @returns {string} Chemin absolu vers le template
 * @throws {ValidationError} Si templateId invalide
 * 
 * @example
 * const path = getProjectTemplatePath('basic');
 * // Returns: '/absolute/path/to/templates/structure/projects/basic.json'
 */
export function getProjectTemplatePath(templateId) {
  console.log(`[PATHS] Resolving project template path for: ${templateId}`);
  
  // Validation du templateId
  if (!templateId || typeof templateId !== 'string') {
    throw new Error('ValidationError: templateId must be non-empty string');
  }
  
  if (templateId.trim().length === 0) {
    throw new Error('ValidationError: templateId cannot be empty or whitespace only');
  }
  
  // Pattern sécurisé pour template ID
  if (!/^[a-z0-9-_]+$/i.test(templateId)) {
    throw new Error('ValidationError: templateId must contain only letters, numbers, hyphens and underscores');
  }
  
  const templatePath = join(PATHS.projectTemplates, `${templateId}.json`);
  console.log(`[PATHS] Project template path resolved: ${templatePath}`);
  
  return templatePath;
}

/**
 * Génère le chemin vers un template de container
 * @param {string} containerType - Type de container (div, list, form)
 * @returns {string} Chemin absolu vers le template de container
 * @throws {ValidationError} Si containerType invalide
 * 
 * @example
 * const path = getContainerTemplatePath('list');
 * // Returns: '/absolute/path/to/templates/structure/containers/list.json'
 */
export function getContainerTemplatePath(containerType) {
  console.log(`[PATHS] Resolving container template path for: ${containerType}`);
  
  // Validation du containerType
  if (!containerType || typeof containerType !== 'string') {
    throw new Error('ValidationError: containerType must be non-empty string');
  }
  
  const validContainerTypes = ['div', 'list', 'form'];
  if (!validContainerTypes.includes(containerType)) {
    throw new Error(`ValidationError: containerType must be one of: ${validContainerTypes.join(', ')}`);
  }
  
  const templatePath = join(PATHS.containerTemplates, `${containerType}.json`);
  console.log(`[PATHS] Container template path resolved: ${templatePath}`);
  
  return templatePath;
}

/**
 * Génère le chemin vers un template de composant
 * @param {string} componentType - Type de composant (heading, paragraph, button, etc.)
 * @returns {string} Chemin absolu vers le template de composant
 * @throws {ValidationError} Si componentType invalide
 * 
 * @example
 * const path = getComponentTemplatePath('heading');
 * // Returns: '/absolute/path/to/templates/structure/components/heading.json'
 */
export function getComponentTemplatePath(componentType) {
  console.log(`[PATHS] Resolving component template path for: ${componentType}`);
  
  // Validation du componentType
  if (!componentType || typeof componentType !== 'string') {
    throw new Error('ValidationError: componentType must be non-empty string');
  }
  
  const validComponentTypes = ['heading', 'paragraph', 'button', 'image', 'video', 'link'];
  if (!validComponentTypes.includes(componentType)) {
    throw new Error(`ValidationError: componentType must be one of: ${validComponentTypes.join(', ')}`);
  }
  
  const templatePath = join(PATHS.componentTemplates, `${componentType}.json`);
  console.log(`[PATHS] Component template path resolved: ${templatePath}`);
  
  return templatePath;
}

/**
 * Génère le chemin vers un template de code
 * @param {string} relativePath - Chemin relatif dans templates/code
 * @returns {string} Chemin absolu vers le template de code
 * @throws {ValidationError} Si relativePath invalide
 * 
 * @example
 * const path = getCodeTemplatePath('app-visitor/package.json.hbs');
 * // Returns: '/absolute/path/to/templates/code/app-visitor/package.json.hbs'
 */
export function getCodeTemplatePath(relativePath) {
  console.log(`[PATHS] Resolving code template path for: ${relativePath}`);
  
  // Validation du relativePath
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('ValidationError: relativePath must be non-empty string');
  }
  
  if (relativePath.trim().length === 0) {
    throw new Error('ValidationError: relativePath cannot be empty or whitespace only');
  }
  
  // Sécurité : pas de traversée de répertoires
  if (relativePath.includes('..') || relativePath.includes('~')) {
    throw new Error('ValidationError: relativePath contains unsafe characters');
  }
  
  // Normalisation du chemin relatif
  const normalizedRelativePath = normalize(relativePath).replace(/\\/g, '/');
  
  const templatePath = join(PATHS.codeTemplates, normalizedRelativePath);
  console.log(`[PATHS] Code template path resolved: ${templatePath}`);
  
  return templatePath;
}

/**
 * Génère le chemin vers un schéma de validation
 * @param {string} schemaId - ID du schéma
 * @returns {string} Chemin absolu vers le schéma
 * @throws {ValidationError} Si schemaId invalide
 * 
 * @example
 * const path = getSchemaPath('project-v1');
 * // Returns: '/absolute/path/to/schemas/project-v1.json'
 */
export function getSchemaPath(schemaId) {
  console.log(`[PATHS] Resolving schema path for: ${schemaId}`);
  
  // Validation du schemaId
  if (!schemaId || typeof schemaId !== 'string') {
    throw new Error('ValidationError: schemaId must be non-empty string');
  }
  
  if (schemaId.trim().length === 0) {
    throw new Error('ValidationError: schemaId cannot be empty or whitespace only');
  }
  
  // Pattern sécurisé pour schema ID
  if (!/^[a-z0-9-_]+$/i.test(schemaId)) {
    throw new Error('ValidationError: schemaId must contain only letters, numbers, hyphens and underscores');
  }
  
  const schemaPath = join(PATHS.schemas, `${schemaId}.json`);
  console.log(`[PATHS] Schema path resolved: ${schemaPath}`);
  
  return schemaPath;
}

/**
 * Génère le chemin vers un fichier de backup
 * @param {string} projectId - ID du projet
 * @param {string} [timestamp] - Timestamp personnalisé (optionnel)
 * @returns {string} Chemin absolu vers le fichier de backup
 * @throws {ValidationError} Si projectId invalide
 * 
 * @example
 * const path = getBackupPath('mon-site');
 * // Returns: '/absolute/path/to/backups/mon-site-20231215143022.backup'
 */
export function getBackupPath(projectId, timestamp) {
  console.log(`[PATHS] Resolving backup path for: ${projectId}`);
  
  // Validation du projectId
  const validation = validateProjectId(projectId);
  if (!validation.valid) {
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  // Génération du timestamp si non fourni
  const backupTimestamp = timestamp || generateTimestamp();
  
  const backupFileName = `${projectId}-${backupTimestamp}.backup`;
  const backupPath = join(PATHS.backups, backupFileName);
  
  console.log(`[PATHS] Backup path resolved: ${backupPath}`);
  
  return backupPath;
}

/**
 * Génère le chemin vers un fichier de log
 * @param {string} logType - Type de log (error, access, debug, etc.)
 * @param {string} [date] - Date au format YYYY-MM-DD (optionnel, défaut: aujourd'hui)
 * @returns {string} Chemin absolu vers le fichier de log
 * @throws {ValidationError} Si logType invalide
 * 
 * @example
 * const path = getLogPath('error');
 * // Returns: '/absolute/path/to/logs/error-2023-12-15.log'
 */
export function getLogPath(logType, date) {
  console.log(`[PATHS] Resolving log path for: ${logType}`);
  
  // Validation du logType
  if (!logType || typeof logType !== 'string') {
    throw new Error('ValidationError: logType must be non-empty string');
  }
  
  const validLogTypes = ['error', 'access', 'debug', 'workflow', 'system'];
  if (!validLogTypes.includes(logType)) {
    throw new Error(`ValidationError: logType must be one of: ${validLogTypes.join(', ')}`);
  }
  
  // Génération de la date si non fournie
  const logDate = date || new Date().toISOString().split('T')[0];
  
  const logFileName = `${logType}-${logDate}.log`;
  const logPath = join(PATHS.logs, logFileName);
  
  console.log(`[PATHS] Log path resolved: ${logPath}`);
  
  return logPath;
}

/**
 * Normalise un chemin en sécurisant les caractères dangereux
 * @param {string} inputPath - Chemin à normaliser
 * @returns {string} Chemin normalisé et sécurisé
 * @throws {ValidationError} Si le chemin contient des caractères dangereux
 * 
 * @example
 * const safe = normalizeSafePath('./mon-projet/../autre');
 * // Throws: ValidationError (traversée de répertoires détectée)
 */
export function normalizeSafePath(inputPath) {
  console.log(`[PATHS] Normalizing path: ${inputPath}`);
  
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('ValidationError: inputPath must be non-empty string');
  }
  
  // Détection de caractères dangereux
  const dangerousPatterns = ['..', '~', '$', '`', '|', ';', '&'];
  for (const pattern of dangerousPatterns) {
    if (inputPath.includes(pattern)) {
      throw new Error(`ValidationError: inputPath contains dangerous pattern: ${pattern}`);
    }
  }
  
  // Normalisation
  const normalizedPath = normalize(inputPath).replace(/\\/g, '/');
  
  console.log(`[PATHS] Path normalized: ${normalizedPath}`);
  
  return normalizedPath;
}

// === UTILITAIRES PRIVÉS ===

/**
 * Génère un timestamp pour les noms de fichiers
 * @returns {string} Timestamp au format YYYYMMDDHHMMSS
 * @private
 */
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

console.log(`[PATHS] Path generator loaded successfully - PIXEL PERFECT VERSION`);