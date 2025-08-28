/**
 * Écriture sécurisée de fichiers - VERSION PIXEL PARFAIT
 * @module writer
 * @description I/O pur pour écriture filesystem avec gestion d'erreurs robuste
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, normalize, resolve } from 'path';

/**
 * Écrit du contenu dans un fichier avec création automatique des dossiers parents
 * @param {string} path - Chemin vers le fichier à créer/écrire
 * @param {string|object} data - Données à écrire (string ou objet pour JSON)
 * @param {object} [options={}] - Options d'écriture
 * @param {string} [options.encoding='utf8'] - Encodage du fichier
 * @param {number} [options.jsonIndent=2] - Indentation JSON si data est objet
 * @param {boolean} [options.createDirs=true] - Créer dossiers parents automatiquement
 * @param {boolean} [options.overwrite=true] - Autoriser l'écrasement de fichiers existants
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec métadonnées
 * 
 * @example
 * // Écrire un JSON
 * const result = await writePath('./config.json', { name: 'test' });
 * 
 * // Écrire du texte avec options
 * const result = await writePath('./file.txt', 'content', { 
 *   encoding: 'utf8',
 *   createDirs: true 
 * });
 */
export async function writePath(path, data, options = {}) {
  console.log('[WRITER] Writing to path: ' + path);
  
  // Validation des paramètres
  const validation = validateWritePathInput(path, data, options);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    const config = {
      encoding: options.encoding || 'utf8',
      jsonIndent: options.jsonIndent || 2,
      createDirs: options.createDirs !== false,
      overwrite: options.overwrite !== false
    };
    
    // Normalisation du chemin
    const normalizedPath = normalize(path);
    const absolutePath = resolve(normalizedPath);
    
    console.log('[WRITER] Normalized path: ' + normalizedPath);
    
    // Vérification de sécurité du chemin
    const securityCheck = validatePathSecurity(absolutePath);
    if (!securityCheck.valid) {
      return {
        success: false,
        error: securityCheck.error
      };
    }
    
    // Préparation du contenu à écrire
    const contentResult = prepareWriteContent(data, config);
    if (!contentResult.success) {
      return {
        success: false,
        error: contentResult.error
      };
    }
    
    const writeContent = contentResult.data.content;
    const contentType = contentResult.data.type;
    
    // Création des dossiers parents si nécessaire
    if (config.createDirs) {
      const parentDir = dirname(absolutePath);
      
      try {
        await mkdir(parentDir, { recursive: true });
        console.log('[WRITER] Parent directories ensured: ' + parentDir);
      } catch (mkdirError) {
        console.log('[WRITER] Directory creation failed: ' + mkdirError.message);
        return {
          success: false,
          error: 'Directory creation failed: ' + mkdirError.message,
          errorCode: mkdirError.code
        };
      }
    }
    
    // Vérification de l'écrasement si fichier existant
    if (!config.overwrite) {
      try {
        const { access } = await import('fs/promises');
        const { constants } = await import('fs');
        
        await access(absolutePath, constants.F_OK);
        // Si on arrive ici, le fichier existe
        return {
          success: false,
          error: 'File already exists and overwrite is disabled'
        };
      } catch (accessError) {
        // Fichier n'existe pas, on peut continuer
      }
    }
    
    // Écriture du fichier
    const startTime = Date.now();
    await writeFile(absolutePath, writeContent, config.encoding);
    const writeTime = Date.now() - startTime;
    
    // Calcul de la taille du contenu écrit
    const contentSize = Buffer.byteLength(writeContent, config.encoding);
    
    console.log('[WRITER] File written successfully, size: ' + contentSize + ' bytes, time: ' + writeTime + 'ms');
    
    return {
      success: true,
      data: {
        written: true,
        path: normalizedPath,
        absolutePath: absolutePath,
        size: contentSize,
        encoding: config.encoding,
        contentType: contentType,
        writeTime: writeTime,
        writtenAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.log('[WRITER] Write operation failed: ' + error.message);
    return {
      success: false,
      error: 'File write failed: ' + error.message,
      errorCode: error.code,
      errorType: error.constructor.name
    };
  }
}

/**
 * Écrit un objet au format JSON avec indentation
 * @param {string} path - Chemin vers le fichier JSON
 * @param {object} data - Objet à sérialiser en JSON
 * @param {object} [options={}] - Options d'écriture JSON
 * @param {number} [options.indent=2] - Nombre d'espaces pour l'indentation
 * @param {boolean} [options.createDirs=true] - Créer dossiers parents
 * @returns {Promise<{success: boolean, data: object}>} Résultat d'écriture
 * 
 * @example
 * const result = await writeJson('./config.json', { name: 'test', version: '1.0' });
 * if (result.success) {
 *   console.log('JSON written: ' + result.data.size + ' bytes');
 * }
 */
export async function writeJson(path, data, options = {}) {
  console.log('[WRITER] Writing JSON to: ' + path);
  
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: 'Data must be an object for JSON writing'
    };
  }
  
  const jsonOptions = {
    ...options,
    jsonIndent: options.indent || options.jsonIndent || 2
  };
  
  return await writePath(path, data, jsonOptions);
}

/**
 * Écrit du texte brut avec encodage spécifique
 * @param {string} path - Chemin vers le fichier texte
 * @param {string} content - Contenu texte à écrire
 * @param {object} [options={}] - Options d'écriture texte
 * @param {string} [options.encoding='utf8'] - Encodage du fichier
 * @param {boolean} [options.createDirs=true] - Créer dossiers parents
 * @returns {Promise<{success: boolean, data: object}>} Résultat d'écriture
 * 
 * @example
 * const result = await writeText('./readme.txt', 'Hello World!');
 * if (result.success) {
 *   console.log('Text written: ' + result.data.size + ' bytes');
 * }
 */
export async function writeText(path, content, options = {}) {
  console.log('[WRITER] Writing text to: ' + path);
  
  if (typeof content !== 'string') {
    return {
      success: false,
      error: 'Content must be a string for text writing'
    };
  }
  
  return await writePath(path, content, options);
}

// === FONCTIONS PRIVÉES ===

/**
 * Valide les paramètres d'entrée de writePath
 * @param {string} path - Chemin à valider
 * @param {any} data - Données à valider
 * @param {object} options - Options à valider
 * @returns {{valid: boolean, error?: string}}
 * @private
 */
function validateWritePathInput(path, data, options) {
  // Validation du chemin
  if (!path || typeof path !== 'string') {
    return {
      valid: false,
      error: 'Path must be non-empty string'
    };
  }
  
  if (path.trim().length === 0) {
    return {
      valid: false,
      error: 'Path cannot be empty or whitespace only'
    };
  }
  
  // Validation des données
  if (data === undefined || data === null) {
    return {
      valid: false,
      error: 'Data cannot be undefined or null'
    };
  }
  
  // Validation des options
  if (options && typeof options !== 'object') {
    return {
      valid: false,
      error: 'Options must be an object'
    };
  }
  
  // Validation de l'encodage si spécifié
  if (options.encoding && typeof options.encoding !== 'string') {
    return {
      valid: false,
      error: 'Options.encoding must be a string'
    };
  }
  
  // Validation de l'indentation JSON si spécifiée
  if (options.jsonIndent !== undefined) {
    if (typeof options.jsonIndent !== 'number' || options.jsonIndent < 0) {
      return {
        valid: false,
        error: 'Options.jsonIndent must be a non-negative number'
      };
    }
  }
  
  return { valid: true };
}

/**
 * Valide la sécurité d'un chemin de fichier
 * @param {string} absolutePath - Chemin absolu à valider
 * @returns {{valid: boolean, error?: string}}
 * @private
 */
function validatePathSecurity(absolutePath) {
  // Interdiction de chemins dangereux
  const dangerousPatterns = [
    '/etc/',
    '/bin/',
    '/usr/bin/',
    '/root/',
    'C:\\Windows\\',
    'C:\\Program Files\\',
    '../../../'
  ];
  
  for (const pattern of dangerousPatterns) {
    if (absolutePath.includes(pattern)) {
      return {
        valid: false,
        error: 'Path contains dangerous pattern: ' + pattern
      };
    }
  }
  
  // Interdiction de caractères dangereux
  const dangerousChars = ['|', ';', '&', '$', '<', '>'];
  for (const char of dangerousChars) {
    if (absolutePath.includes(char)) {
      return {
        valid: false,
        error: 'Path contains dangerous character: ' + char
      };
    }
  }
  
  return { valid: true };
}

/**
 * Prépare le contenu à écrire selon le type de données
 * @param {any} data - Données à préparer
 * @param {object} config - Configuration d'écriture
 * @returns {{success: boolean, data?: {content: string, type: string}, error?: string}}
 * @private
 */
function prepareWriteContent(data, config) {
  try {
    if (typeof data === 'string') {
      return {
        success: true,
        data: {
          content: data,
          type: 'text'
        }
      };
    }
    
    if (typeof data === 'object') {
      // Sérialisation JSON avec indentation
      const jsonContent = JSON.stringify(data, null, config.jsonIndent);
      
      return {
        success: true,
        data: {
          content: jsonContent,
          type: 'json'
        }
      };
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return {
        success: true,
        data: {
          content: String(data),
          type: 'primitive'
        }
      };
    }
    
    return {
      success: false,
      error: 'Unsupported data type: ' + typeof data
    };
    
  } catch (serializationError) {
    return {
      success: false,
      error: 'Content preparation failed: ' + serializationError.message
    };
  }
}

console.log('[WRITER] Writer core loaded successfully - PIXEL PERFECT VERSION');