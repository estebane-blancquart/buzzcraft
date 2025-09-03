// === READER.JS - VERSION LOGS OPTIMISÉS ===

/**
 * Lecture sécurisée de fichiers et dossiers - VERSION PIXEL PARFAIT
 * @module reader
 * @description I/O pur pour lecture filesystem avec gestion d'erreurs robuste
 */

import { readFile, readdir, stat, access } from 'fs/promises';
import { normalize, resolve } from 'path';
import { constants } from 'fs';
import { LOG_COLORS } from './constants.js';

/**
 * Lit le contenu d'un fichier avec validation et métadonnées
 * @param {string} path - Chemin vers le fichier à lire
 * @param {object} [options={}] - Options de lecture
 * @param {string} [options.encoding='utf8'] - Encodage du fichier
 * @param {boolean} [options.parseJson=false] - Parser automatiquement le JSON
 * @param {boolean} [options.includeStats=false] - Inclure stats du fichier
 * @param {boolean} [options.verbose=false] - Logs détaillés (debug uniquement)
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec contenu et métadonnées
 */
export async function readPath(path, options = {}) {
  // Logs seulement si verbose activé ou erreur
  const verbose = options.verbose === true;
  
  // Validation des paramètres
  validateReadPathInput(path, options);

  try {
    const normalizedPath = normalize(path);
    const absolutePath = resolve(normalizedPath);
    const encoding = options.encoding || 'utf8';
    
    // Vérification existence avec permissions
    const exists = await checkFileAccess(absolutePath);
    
    if (!exists.accessible) {
      if (verbose) console.log(`${LOG_COLORS.warning}[READER] File not accessible: ${exists.reason}${LOG_COLORS.reset}`);
      return {
        success: true,
        data: {
          exists: false,
          accessible: false,
          reason: exists.reason,
          path: normalizedPath,
          absolutePath
        }
      };
    }
    
    // Lecture du contenu
    const content = await readFile(absolutePath, encoding);
    const contentSize = Buffer.byteLength(content, encoding);
    
    // Préparation du résultat de base
    const result = {
      exists: true,
      accessible: true,
      content,
      size: contentSize,
      path: normalizedPath,
      absolutePath,
      encoding
    };
    
    // Parsing JSON optionnel
    if (options.parseJson && content.trim()) {
      try {
        result.parsed = JSON.parse(content);
      } catch (parseError) {
        console.log(`${LOG_COLORS.error}[READER] JSON parsing failed for ${path}: ${parseError.message}${LOG_COLORS.reset}`);
        result.jsonError = parseError.message;
      }
    }
    
    // Stats du fichier optionnelles
    if (options.includeStats) {
      try {
        const stats = await stat(absolutePath);
        result.stats = {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile()
        };
      } catch (statsError) {
        if (verbose) console.log(`${LOG_COLORS.warning}[READER] Stats collection failed: ${statsError.message}${LOG_COLORS.reset}`);
        result.statsError = statsError.message;
      }
    }
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[READER] Failed to read ${path}: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `File read failed: ${error.message}`,
      errorCode: error.code
    };
  }
}

/**
 * Liste le contenu d'un dossier avec filtrage optionnel
 * @param {string} directoryPath - Chemin vers le dossier
 * @param {object} [options={}] - Options de listage
 * @param {boolean} [options.withFileTypes=true] - Inclure type de fichier
 * @param {string[]} [options.extensions=[]] - Extensions à filtrer
 * @param {boolean} [options.includeHidden=false] - Inclure fichiers cachés
 * @param {boolean} [options.includeStats=false] - Inclure stats des fichiers
 * @param {boolean} [options.verbose=false] - Logs détaillés (debug uniquement)
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec liste des éléments
 */
export async function readDirectory(directoryPath, options = {}) {
  const verbose = options.verbose === true;
  
  // Validation des paramètres
  validateReadDirectoryInput(directoryPath, options);
  
  try {
    const normalizedPath = normalize(directoryPath);
    const absolutePath = resolve(normalizedPath);
    
    // Vérification existence du dossier
    const exists = await checkFileAccess(absolutePath);
    if (!exists.accessible) {
      if (verbose) console.log(`${LOG_COLORS.warning}[READER] Directory not accessible: ${exists.reason}${LOG_COLORS.reset}`);
      return {
        success: true,
        data: {
          exists: false,
          accessible: false,
          reason: exists.reason,
          items: [],
          count: 0
        }
      };
    }
    
    // Configuration des options
    const config = {
      withFileTypes: options.withFileTypes !== false,
      extensions: options.extensions || [],
      includeHidden: options.includeHidden === true,
      includeStats: options.includeStats === true
    };
    
    // Lecture du dossier
    const dirents = await readdir(absolutePath, { withFileTypes: config.withFileTypes });
    const items = [];
    
    for (const dirent of dirents) {
      // Filtrage fichiers cachés
      if (!config.includeHidden && dirent.name.startsWith('.')) {
        continue;
      }
      
      // Filtrage par extension
      if (config.extensions.length > 0 && dirent.isFile()) {
        const hasValidExtension = config.extensions.some(ext => 
          dirent.name.toLowerCase().endsWith(ext.toLowerCase())
        );
        if (!hasValidExtension) continue;
      }
      
      const item = {
        name: dirent.name,
        isFile: dirent.isFile(),
        isDirectory: dirent.isDirectory(),
        isSymbolicLink: dirent.isSymbolicLink(),
        path: `${normalizedPath}/${dirent.name}`
      };
      
      // Stats optionnelles
      if (config.includeStats) {
        try {
          const itemPath = `${absolutePath}/${dirent.name}`;
          const stats = await stat(itemPath);
          item.stats = {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime
          };
        } catch (statsError) {
          if (verbose) console.log(`${LOG_COLORS.warning}[READER] Stats failed for ${dirent.name}: ${statsError.message}${LOG_COLORS.reset}`);
          item.statsError = statsError.message;
        }
      }
      
      items.push(item);
    }
    
    return {
      success: true,
      data: {
        exists: true,
        accessible: true,
        items,
        count: items.length,
        path: normalizedPath,
        absolutePath,
        scannedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[READER] Failed to read directory ${directoryPath}: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Directory read failed: ${error.message}`,
      errorCode: error.code
    };
  }
}

/**
 * Vérifie l'accès à un fichier ou dossier
 * @param {string} path - Chemin à vérifier
 * @param {number} [mode=constants.F_OK] - Mode d'accès à tester
 * @returns {Promise<{accessible: boolean, reason?: string}>} Résultat de vérification
 */
export async function checkFileAccess(path, mode = constants.F_OK) {
  try {
    await access(path, mode);
    return { accessible: true };
  } catch (error) {
    return {
      accessible: false,
      reason: error.code === 'ENOENT' ? 'File not found' : `Access denied: ${error.code}`
    };
  }
}

// === FONCTIONS DE VALIDATION (inchangées) ===

function validateReadPathInput(path, options) {
  if (!path || typeof path !== 'string') {
    throw new Error('ValidationError: path must be non-empty string');
  }
  
  if (path.trim().length === 0) {
    throw new Error('ValidationError: path cannot be empty or whitespace only');
  }
  
  if (options && typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }
  
  const validEncodings = ['utf8', 'ascii', 'base64', 'binary', 'hex'];
  if (options.encoding && !validEncodings.includes(options.encoding)) {
    throw new Error(`ValidationError: encoding must be one of: ${validEncodings.join(', ')}`);
  }
}

function validateReadDirectoryInput(directoryPath, options) {
  if (!directoryPath || typeof directoryPath !== 'string') {
    throw new Error('ValidationError: directoryPath must be non-empty string');
  }
  
  if (directoryPath.trim().length === 0) {
    throw new Error('ValidationError: directoryPath cannot be empty or whitespace only');
  }
  
  if (options && typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }
  
  if (options.extensions && !Array.isArray(options.extensions)) {
    throw new Error('ValidationError: options.extensions must be an array');
  }
}