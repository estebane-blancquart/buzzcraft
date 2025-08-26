import { writeFile, mkdir } from 'fs/promises';
import { dirname, normalize } from 'path';

/**
 * Écrit contenu dans fichier et crée dossiers parents - VERSION PIXEL PARFAIT
 * @param {string} path - Chemin vers le fichier à créer/écrire
 * @param {string|object} data - Données à écrire (string ou objet)
 * @param {object} [options={}] - Options d'écriture
 * @param {string} [options.encoding='utf8'] - Encodage du fichier
 * @param {number} [options.jsonIndent=2] - Indentation JSON si data est objet
 * @param {boolean} [options.createDirs=true] - Créer dossiers parents
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec métadonnées
 * @throws {ValidationError} Si paramètres manquants ou invalides
 * 
 * @example
 * // Écrire un JSON
 * const result = await writePath('./config.json', { name: 'test' });
 * 
 * // Écrire du texte avec options
 * const result = await writePath('./file.txt', 'content', { encoding: 'utf8' });
 */
export async function writePath(path, data, options = {}) {
  console.log(`[REAL] writePath called with: ${path}`);
  
  // CALL: Validation séparée pour SRP parfait
  validateWritePathInput(path, data, options);

  try {
    // Normalisation cross-platform
    const normalizedPath = normalize(path);
    console.log(`[WRITER] Normalized path: ${normalizedPath}`);

    // Préparation du contenu avec options
    const writeContent = prepareWriteContent(data, options);
    const encoding = options.encoding || 'utf8';
    
    // Création dossiers parents si demandé
    if (options.createDirs !== false) {
      const dir = dirname(normalizedPath);
      await mkdir(dir, { recursive: true });
      console.log(`[WRITER] Parent directories ensured: ${dir}`);
    }
    
    // Écriture du fichier
    await writeFile(normalizedPath, writeContent, encoding);
    
    const contentSize = Buffer.byteLength(writeContent, encoding);
    console.log(`[WRITER] File written successfully, size: ${contentSize} bytes`);
    
    return {
      success: true,
      data: {
        written: true,
        path: normalizedPath,
        originalPath: path,
        size: contentSize,
        encoding: encoding,
        contentType: typeof data === 'object' ? 'json' : 'string',
        writtenAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return handleWriteError(error, path);
  }
}

/**
 * Valide les paramètres d'entrée de writePath
 * @private
 * @param {string} path - Chemin à valider
 * @param {any} data - Données à valider
 * @param {object} options - Options à valider
 * @throws {ValidationError} Si paramètres invalides
 */
function validateWritePathInput(path, data, options) {
  if (!path || typeof path !== 'string') {
    throw new Error('ValidationError: path must be non-empty string');
  }
  
  if (path.trim().length === 0) {
    throw new Error('ValidationError: path cannot be empty or whitespace only');
  }
  
  if (data === undefined || data === null) {
    throw new Error('ValidationError: data is required (can be empty string but not null/undefined)');
  }
  
  if (options && typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }
  
  // Validation options spécifiques
  if (options.encoding && typeof options.encoding !== 'string') {
    throw new Error('ValidationError: options.encoding must be a string');
  }
  
  if (options.jsonIndent && (typeof options.jsonIndent !== 'number' || options.jsonIndent < 0)) {
    throw new Error('ValidationError: options.jsonIndent must be a positive number');
  }
}

/**
 * Prépare le contenu à écrire selon le type et les options
 * @private
 * @param {string|object} data - Données source
 * @param {object} options - Options de formatage
 * @returns {string} Contenu prêt à écrire
 */
function prepareWriteContent(data, options) {
  if (typeof data === 'string') {
    return data;
  }
  
  // Conversion objet → JSON avec options
  const jsonIndent = options.jsonIndent !== undefined ? options.jsonIndent : 2;
  
  try {
    return JSON.stringify(data, null, jsonIndent);
  } catch (jsonError) {
    throw new Error(`JSON serialization failed: ${jsonError.message}`);
  }
}

/**
 * Gestion centralisée et précise des erreurs d'écriture
 * @private
 * @param {Error} error - Erreur capturée
 * @param {string} path - Chemin qui a causé l'erreur
 * @returns {{success: boolean, error: string}} Réponse d'erreur formatée
 */
function handleWriteError(error, path) {
  console.log(`[WRITER] Error writing to path: ${error.message} (code: ${error.code})`);
  
  // Gestion granulaire des codes d'erreur filesystem
  switch (error.code) {
    case "ENOENT":
      console.log(`[WRITER] Parent directory does not exist`);
      return {
        success: false,
        error: `Parent directory does not exist: ${dirname(path)}`,
        errorCode: "ENOENT"
      };
      
    case "EACCES":
      console.log(`[WRITER] Permission denied`);
      return {
        success: false,
        error: `Permission denied: cannot write to ${path}`,
        errorCode: "EACCES"
      };
      
    case "EISDIR":
      console.log(`[WRITER] Path is a directory`);
      return {
        success: false,
        error: `Cannot write to directory: ${path}`,
        errorCode: "EISDIR"
      };
      
    case "ENOSPC":
      console.log(`[WRITER] No space left on device`);
      return {
        success: false,
        error: `No space left on device`,
        errorCode: "ENOSPC"
      };
      
    case "EMFILE":
    case "ENFILE":
      console.log(`[WRITER] Too many open files`);
      return {
        success: false,
        error: `System limit: too many open files`,
        errorCode: error.code
      };
      
    case "EROFS":
      console.log(`[WRITER] Read-only filesystem`);
      return {
        success: false,
        error: `Cannot write: filesystem is read-only`,
        errorCode: "EROFS"
      };
      
    default:
      // Erreurs inattendues (JSON, etc.)
      console.log(`[WRITER] Unexpected error: ${error.message}`);
      return {
        success: false,
        error: `Write operation failed: ${error.message}`,
        errorCode: error.code || "UNKNOWN"
      };
  }
}

/**
 * Utilitaire pour écrire rapidement du JSON formaté
 * @param {string} path - Chemin vers le fichier JSON
 * @param {object} data - Objet à sérialiser
 * @param {object} [options={}] - Options spécifiques JSON
 * @returns {Promise<{success: boolean, data: object}>} Résultat d'écriture
 */
export async function writeJson(path, data, options = {}) {
  const jsonOptions = {
    ...options,
    jsonIndent: options.indent || 2
  };
  
  return await writePath(path, data, jsonOptions);
}

/**
 * Utilitaire pour écrire du texte brut avec encoding spécifique
 * @param {string} path - Chemin vers le fichier texte
 * @param {string} content - Contenu texte
 * @param {string} [encoding='utf8'] - Encodage
 * @returns {Promise<{success: boolean, data: object}>} Résultat d'écriture
 */
export async function writeText(path, content, encoding = 'utf8') {
  return await writePath(path, content, { encoding });
}

console.log(`[WRITER] Writer core loaded successfully - PIXEL PERFECT VERSION`);