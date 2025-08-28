/**
 * Lecture sécurisée de fichiers et dossiers - VERSION PIXEL PARFAIT
 * @module reader
 * @description I/O pur pour lecture filesystem avec gestion d'erreurs robuste
 */

import { readFile, readdir, stat, access } from 'fs/promises';
import { normalize, resolve } from 'path';
import { constants } from 'fs';

/**
 * Lit le contenu d'un fichier avec validation et métadonnées
 * @param {string} path - Chemin vers le fichier à lire
 * @param {object} [options={}] - Options de lecture
 * @param {string} [options.encoding='utf8'] - Encodage du fichier
 * @param {boolean} [options.parseJson=false] - Parser automatiquement le JSON
 * @param {boolean} [options.includeStats=false] - Inclure stats du fichier
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec contenu et métadonnées
 * @throws {ValidationError} Si paramètres manquants ou invalides
 * 
 * @example
 * // Lecture simple
 * const result = await readPath('./config.json');
 * if (result.success && result.data.exists) {
 *   console.log(result.data.content);
 * }
 * 
 * // Lecture avec parsing JSON automatique
 * const json = await readPath('./data.json', { parseJson: true });
 * console.log(json.data.parsed);
 */
export async function readPath(path, options = {}) {
  console.log(`[READER] Reading path: ${path}`);
  
  // Validation des paramètres
  validateReadPathInput(path, options);

  try {
    const normalizedPath = normalize(path);
    const absolutePath = resolve(normalizedPath);
    const encoding = options.encoding || 'utf8';
    
    console.log(`[READER] Normalized path: ${normalizedPath}`);
    
    // Vérification existence avec permissions
    const exists = await checkFileAccess(absolutePath);
    
    if (!exists.accessible) {
      console.log(`[READER] File not accessible: ${exists.reason}`);
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
    
    console.log(`[READER] File read successfully, size: ${contentSize} bytes`);
    
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
        console.log(`[READER] JSON parsed successfully`);
      } catch (parseError) {
        console.log(`[READER] JSON parsing failed: ${parseError.message}`);
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
        console.log(`[READER] Stats collection failed: ${statsError.message}`);
        result.statsError = statsError.message;
      }
    }
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.log(`[READER] Read operation failed: ${error.message}`);
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
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec liste des éléments
 * 
 * @example
 * const result = await readDirectory('./templates');
 * result.data.items.forEach(item => {
 *   console.log(`${item.name} (${item.isDirectory ? 'dir' : 'file'})`);
 * });
 */
export async function readDirectory(directoryPath, options = {}) {
  console.log(`[READER] Reading directory: ${directoryPath}`);
  
  // Validation des paramètres
  validateReadDirectoryInput(directoryPath, options);
  
  try {
    const normalizedPath = normalize(directoryPath);
    const absolutePath = resolve(normalizedPath);
    
    console.log(`[READER] Normalized directory path: ${normalizedPath}`);
    
    // Vérification existence du dossier
    const exists = await checkFileAccess(absolutePath);
    if (!exists.accessible) {
      console.log(`[READER] Directory not accessible: ${exists.reason}`);
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
      
      // Filtrage par extensions
      if (config.extensions.length > 0 && !dirent.isDirectory()) {
        const hasValidExtension = config.extensions.some(ext => 
          dirent.name.toLowerCase().endsWith(ext.toLowerCase())
        );
        if (!hasValidExtension) {
          continue;
        }
      }
      
      const itemData = {
        name: dirent.name,
        isDirectory: dirent.isDirectory(),
        isFile: dirent.isFile(),
        path: resolve(absolutePath, dirent.name)
      };
      
      // Stats optionnelles
      if (config.includeStats) {
        try {
          const itemStats = await stat(itemData.path);
          itemData.stats = {
            size: itemStats.size,
            created: itemStats.birthtime,
            modified: itemStats.mtime,
            isDirectory: itemStats.isDirectory(),
            isFile: itemStats.isFile()
          };
        } catch (statsError) {
          console.log(`[READER] Stats failed for ${dirent.name}: ${statsError.message}`);
          itemData.statsError = statsError.message;
        }
      }
      
      items.push(itemData);
    }
    
    console.log(`[READER] Directory read successfully, found ${items.length} items`);
    
    return {
      success: true,
      data: {
        exists: true,
        accessible: true,
        items,
        count: items.length,
        path: normalizedPath,
        absolutePath
      }
    };
    
  } catch (error) {
    console.log(`[READER] Directory read failed: ${error.message}`);
    return {
      success: false,
      error: `Directory read failed: ${error.message}`,
      errorCode: error.code
    };
  }
}

/**
 * Vérifie l'accessibilité d'un fichier ou dossier
 * @param {string} path - Chemin à vérifier
 * @returns {Promise<{accessible: boolean, reason?: string}>} Résultat de vérification
 * 
 * @example
 * const access = await checkFileAccess('./config.json');
 * if (access.accessible) {
 *   console.log('File is accessible');
 * }
 */
export async function checkFileAccess(path) {
  try {
    await access(path, constants.F_OK | constants.R_OK);
    return { accessible: true };
  } catch (error) {
    let reason = 'Unknown access error';
    
    switch (error.code) {
      case 'ENOENT':
        reason = 'File or directory does not exist';
        break;
      case 'EACCES':
        reason = 'Permission denied';
        break;
      case 'EISDIR':
        reason = 'Expected file but found directory';
        break;
      case 'ENOTDIR':
        reason = 'Expected directory but found file';
        break;
      default:
        reason = `Access error: ${error.message}`;
    }
    
    return { 
      accessible: false, 
      reason,
      errorCode: error.code
    };
  }
}

// === FONCTIONS PRIVÉES DE VALIDATION ===

/**
 * Valide les paramètres de readPath
 * @private
 */
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
  
  if (options.encoding && typeof options.encoding !== 'string') {
    throw new Error('ValidationError: options.encoding must be a string');
  }
  
  if (options.parseJson !== undefined && typeof options.parseJson !== 'boolean') {
    throw new Error('ValidationError: options.parseJson must be a boolean');
  }
  
  if (options.includeStats !== undefined && typeof options.includeStats !== 'boolean') {
    throw new Error('ValidationError: options.includeStats must be a boolean');
  }
}

/**
 * Valide les paramètres de readDirectory
 * @private
 */
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

console.log(`[READER] Reader core loaded successfully - PIXEL PERFECT VERSION`);