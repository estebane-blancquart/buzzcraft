/**
 * Écriture sécurisée de fichiers - VERSION PIXEL PARFAIT
 * @module writer
 * @description I/O pur pour écriture filesystem avec gestion d'erreurs robuste
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, normalize, resolve } from 'path';
import { LOG_COLORS } from './constants.js';

/**
 * Écrit du contenu dans un fichier avec création automatique des dossiers parents
 * @param {string} path - Chemin vers le fichier à créer/écrire
 * @param {string|object} data - Données à écrire (string ou objet pour JSON)
 * @param {object} [options={}] - Options d'écriture
 * @param {string} [options.encoding='utf8'] - Encodage du fichier
 * @param {number} [options.jsonIndent=2] - Indentation JSON si data est objet
 * @param {boolean} [options.createDirs=true] - Créer dossiers parents automatiquement
 * @param {boolean} [options.overwrite=true] - Autoriser l'écrasement de fichiers existants
 * @param {boolean} [options.verbose=false] - Logs détaillés (debug uniquement)
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec métadonnées
 */
export async function writePath(path, data, options = {}) {
  const verbose = options.verbose === true;
  
  // Validation des paramètres
  const validation = validateWritePathInput(path, data, options);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[WRITER] Validation failed: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    const normalizedPath = normalize(path);
    const absolutePath = resolve(normalizedPath);
    
    // Configuration par défaut
    const config = {
      encoding: options.encoding || 'utf8',
      jsonIndent: options.jsonIndent || 2,
      createDirs: options.createDirs !== false,
      overwrite: options.overwrite !== false
    };
    
    // Préparation du contenu à écrire
    let writeContent;
    let contentType;
    
    if (typeof data === 'object' && data !== null) {
      writeContent = JSON.stringify(data, null, config.jsonIndent);
      contentType = 'application/json';
    } else {
      writeContent = String(data);
      contentType = 'text/plain';
    }
    
    // Création automatique des dossiers parents
    if (config.createDirs) {
      const parentDir = dirname(absolutePath);
      try {
        await mkdir(parentDir, { recursive: true });
      } catch (mkdirError) {
        console.log(`${LOG_COLORS.error}[WRITER] Failed to create directories for ${path}: ${mkdirError.message}${LOG_COLORS.reset}`);
        return {
          success: false,
          error: `Directory creation failed: ${mkdirError.message}`
        };
      }
    }
    
    // Vérification de l'écrasement si fichier existant
    if (!config.overwrite) {
      try {
        const { access } = await import('fs/promises');
        const { constants } = await import('fs');
        
        await access(absolutePath, constants.F_OK);
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
    console.log(`${LOG_COLORS.error}[WRITER] Failed to write ${path}: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `File write failed: ${error.message}`,
      errorCode: error.code,
      errorType: error.constructor.name
    };
  }
}

/**
 * Écrit un objet au format JSON avec indentation
 * @param {string} path - Chemin vers le fichier JSON
 * @param {object} jsonData - Objet à serializer en JSON
 * @param {object} [options={}] - Options d'écriture
 * @returns {Promise<{success: boolean, data: object}>} Résultat de l'écriture
 */
export async function writeJsonPath(path, jsonData, options = {}) {
  return writePath(path, jsonData, {
    ...options,
    jsonIndent: options.indent || 2
  });
}

/**
 * Ajoute du contenu à la fin d'un fichier existant
 * @param {string} path - Chemin vers le fichier
 * @param {string} content - Contenu à ajouter
 * @param {object} [options={}] - Options d'écriture
 * @returns {Promise<{success: boolean, data: object}>} Résultat de l'ajout
 */
export async function appendPath(path, content, options = {}) {
  try {
    const { appendFile } = await import('fs/promises');
    
    const normalizedPath = normalize(path);
    const absolutePath = resolve(normalizedPath);
    const encoding = options.encoding || 'utf8';
    
    const startTime = Date.now();
    await appendFile(absolutePath, content, encoding);
    const writeTime = Date.now() - startTime;
    
    const contentSize = Buffer.byteLength(content, encoding);
    
    return {
      success: true,
      data: {
        appended: true,
        path: normalizedPath,
        absolutePath,
        size: contentSize,
        encoding,
        writeTime,
        appendedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[WRITER] Failed to append to ${path}: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `File append failed: ${error.message}`,
      errorCode: error.code
    };
  }
}

// === FONCTIONS DE VALIDATION (inchangées) ===

function validateWritePathInput(path, data, options) {
  if (!path || typeof path !== 'string') {
    return {
      valid: false,
      error: 'path must be non-empty string'
    };
  }
  
  if (path.trim().length === 0) {
    return {
      valid: false,
      error: 'path cannot be empty or whitespace only'
    };
  }
  
  if (data === undefined) {
    return {
      valid: false,
      error: 'data is required'
    };
  }
  
  if (options && typeof options !== 'object') {
    return {
      valid: false,
      error: 'options must be an object'
    };
  }
  
  const validEncodings = ['utf8', 'ascii', 'base64', 'binary', 'hex'];
  if (options.encoding && !validEncodings.includes(options.encoding)) {
    return {
      valid: false,
      error: `encoding must be one of: ${validEncodings.join(', ')}`
    };
  }
  
  return { valid: true };
}

console.log(`${LOG_COLORS.info}[WRITER] Writer core loaded${LOG_COLORS.reset}`);