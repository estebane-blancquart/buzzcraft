/**
 * Générateur de chemins système - VERSION PIXEL PARFAIT
 * @module paths
 * @description Génération sécurisée des chemins de fichiers et dossiers
 */

import { resolve, join, normalize } from 'path';
import { PATHS, validateProjectId, LOG_COLORS } from './constants.js';

/**
 * Génère le chemin absolu vers le dossier d'un projet
 * @param {string} projectId - ID du projet
 * @returns {string} Chemin absolu vers le dossier projet
 * @throws {ValidationError} Si projectId invalide
 */
export function getProjectPath(projectId) {
  // Validation du projectId
  const validation = validateProjectId(projectId);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid project ID: ${validation.error}${LOG_COLORS.reset}`);
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  const projectPath = join(PATHS.dataOutputs, projectId);
  return projectPath;
}

/**
 * Génère le chemin absolu vers le fichier project.json d'un projet
 * @param {string} projectId - ID du projet
 * @returns {string} Chemin absolu vers project.json
 * @throws {ValidationError} Si projectId invalide
 */
export function getProjectFilePath(projectId) {
  // Validation du projectId
  const validation = validateProjectId(projectId);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid project ID: ${validation.error}${LOG_COLORS.reset}`);
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  const projectPath = getProjectPath(projectId);
  const projectFilePath = join(projectPath, 'project.json');
  
  return projectFilePath;
}

/**
 * Génère le chemin vers un template de projet
 * @param {string} templateId - ID du template
 * @returns {string} Chemin absolu vers le template
 * @throws {ValidationError} Si templateId invalide
 */
export function getProjectTemplatePath(templateId) {
  // Validation du templateId
  if (!templateId || typeof templateId !== 'string') {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid template ID: must be non-empty string${LOG_COLORS.reset}`);
    throw new Error('ValidationError: templateId must be non-empty string');
  }
  
  if (templateId.trim().length === 0) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid template ID: cannot be empty${LOG_COLORS.reset}`);
    throw new Error('ValidationError: templateId cannot be empty or whitespace only');
  }
  
  // Pattern sécurisé pour template ID
  if (!/^[a-z0-9-_]+$/i.test(templateId)) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid template ID: contains invalid characters${LOG_COLORS.reset}`);
    throw new Error('ValidationError: templateId must contain only letters, numbers, hyphens and underscores');
  }
  
  const templatePath = join(PATHS.projectTemplates, `${templateId}.json`);
  return templatePath;
}

/**
 * Génère le chemin vers un template de container
 * @param {string} containerType - Type de container (div, list, form)
 * @returns {string} Chemin absolu vers le template de container
 * @throws {ValidationError} Si containerType invalide
 */
export function getContainerTemplatePath(containerType) {
  // Validation du containerType
  if (!containerType || typeof containerType !== 'string') {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid container type: must be non-empty string${LOG_COLORS.reset}`);
    throw new Error('ValidationError: containerType must be non-empty string');
  }
  
  const validContainerTypes = ['div', 'list', 'form'];
  if (!validContainerTypes.includes(containerType)) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid container type: ${containerType}${LOG_COLORS.reset}`);
    throw new Error(`ValidationError: containerType must be one of: ${validContainerTypes.join(', ')}`);
  }
  
  const templatePath = join(PATHS.containerTemplates, `${containerType}.json`);
  return templatePath;
}

/**
 * Génère le chemin vers un template de composant
 * @param {string} componentType - Type de composant (heading, paragraph, button, etc.)
 * @returns {string} Chemin absolu vers le template de composant
 * @throws {ValidationError} Si componentType invalide
 */
export function getComponentTemplatePath(componentType) {
  // Validation du componentType
  if (!componentType || typeof componentType !== 'string') {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid component type: must be non-empty string${LOG_COLORS.reset}`);
    throw new Error('ValidationError: componentType must be non-empty string');
  }
  
  const validComponentTypes = ['heading', 'paragraph', 'button', 'image', 'video', 'link'];
  if (!validComponentTypes.includes(componentType)) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid component type: ${componentType}${LOG_COLORS.reset}`);
    throw new Error(`ValidationError: componentType must be one of: ${validComponentTypes.join(', ')}`);
  }
  
  const templatePath = join(PATHS.componentTemplates, `${componentType}.json`);
  return templatePath;
}

/**
 * Génère le chemin vers un template de code
 * @param {string} relativePath - Chemin relatif dans templates/code
 * @returns {string} Chemin absolu vers le template de code
 * @throws {ValidationError} Si relativePath invalide
 */
export function getCodeTemplatePath(relativePath) {
  // Validation du relativePath
  if (!relativePath || typeof relativePath !== 'string') {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid relative path: must be non-empty string${LOG_COLORS.reset}`);
    throw new Error('ValidationError: relativePath must be non-empty string');
  }
  
  if (relativePath.trim().length === 0) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid relative path: cannot be empty${LOG_COLORS.reset}`);
    throw new Error('ValidationError: relativePath cannot be empty or whitespace only');
  }
  
  // Sécurité : pas de traversée de répertoires
  if (relativePath.includes('..') || relativePath.includes('~')) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid relative path: contains unsafe characters${LOG_COLORS.reset}`);
    throw new Error('ValidationError: relativePath contains unsafe characters');
  }
  
  // Normalisation du chemin relatif
  const normalizedRelativePath = normalize(relativePath).replace(/\\/g, '/');
  
  const templatePath = join(PATHS.codeTemplates, normalizedRelativePath);
  return templatePath;
}

/**
 * Génère le chemin vers un schéma de validation
 * @param {string} schemaId - ID du schéma
 * @returns {string} Chemin absolu vers le schéma
 * @throws {ValidationError} Si schemaId invalide
 */
export function getSchemaPath(schemaId) {
  // Validation du schemaId
  if (!schemaId || typeof schemaId !== 'string') {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid schema ID: must be non-empty string${LOG_COLORS.reset}`);
    throw new Error('ValidationError: schemaId must be non-empty string');
  }
  
  if (schemaId.trim().length === 0) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid schema ID: cannot be empty${LOG_COLORS.reset}`);
    throw new Error('ValidationError: schemaId cannot be empty or whitespace only');
  }
  
  // Pattern sécurisé pour schema ID
  if (!/^[a-z0-9-_]+$/i.test(schemaId)) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid schema ID: contains invalid characters${LOG_COLORS.reset}`);
    throw new Error('ValidationError: schemaId must contain only letters, numbers, hyphens and underscores');
  }
  
  const schemaPath = join(PATHS.schemas, `${schemaId}.json`);
  return schemaPath;
}

/**
 * Génère le chemin vers un fichier de backup
 * @param {string} projectId - ID du projet
 * @param {string} [timestamp] - Timestamp personnalisé (optionnel)
 * @returns {string} Chemin absolu vers le fichier de backup
 * @throws {ValidationError} Si projectId invalide
 */
export function getBackupPath(projectId, timestamp) {
  // Validation du projectId
  const validation = validateProjectId(projectId);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid project ID for backup: ${validation.error}${LOG_COLORS.reset}`);
    throw new Error(`ValidationError: ${validation.error}`);
  }
  
  // Génération du timestamp si non fourni
  const backupTimestamp = timestamp || generateTimestamp();
  
  const backupFileName = `${projectId}-${backupTimestamp}.backup`;
  const backupPath = join(PATHS.backups, backupFileName);
  
  return backupPath;
}

/**
 * Génère le chemin vers un fichier de log
 * @param {string} logType - Type de log (error, access, debug, etc.)
 * @param {string} [date] - Date au format YYYY-MM-DD (optionnel, défaut: aujourd'hui)
 * @returns {string} Chemin absolu vers le fichier de log
 * @throws {ValidationError} Si logType invalide
 */
export function getLogPath(logType, date) {
  // Validation du logType
  if (!logType || typeof logType !== 'string') {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid log type: must be non-empty string${LOG_COLORS.reset}`);
    throw new Error('ValidationError: logType must be non-empty string');
  }
  
  const validLogTypes = ['error', 'access', 'debug', 'workflow', 'system'];
  if (!validLogTypes.includes(logType)) {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid log type: ${logType}${LOG_COLORS.reset}`);
    throw new Error(`ValidationError: logType must be one of: ${validLogTypes.join(', ')}`);
  }
  
  // Génération de la date si non fournie
  const logDate = date || new Date().toISOString().split('T')[0];
  
  const logFileName = `${logType}-${logDate}.log`;
  const logPath = join(PATHS.logs, logFileName);
  
  return logPath;
}

/**
 * Normalise un chemin en sécurisant les caractères dangereux
 * @param {string} inputPath - Chemin à normaliser
 * @returns {string} Chemin normalisé et sécurisé
 * @throws {ValidationError} Si le chemin contient des caractères dangereux
 */
export function normalizeSafePath(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') {
    console.log(`${LOG_COLORS.error}[PATHS] Invalid path for normalization: must be non-empty string${LOG_COLORS.reset}`);
    throw new Error('ValidationError: inputPath must be non-empty string');
  }
  
  // Détection de caractères dangereux
  const dangerousPatterns = ['..', '~', '$', '`', '|', ';', '&'];
  for (const pattern of dangerousPatterns) {
    if (inputPath.includes(pattern)) {
      console.log(`${LOG_COLORS.error}[PATHS] Dangerous path pattern detected: ${pattern}${LOG_COLORS.reset}`);
      throw new Error(`ValidationError: inputPath contains dangerous pattern: ${pattern}`);
    }
  }
  
  // Normalisation
  const normalizedPath = normalize(inputPath).replace(/\\/g, '/');
  
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