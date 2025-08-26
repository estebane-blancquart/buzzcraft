import { readFile, stat } from "fs/promises";
import { normalize } from "path";

/**
 * Analyse existence et lit contenu d'un chemin - VERSION PIXEL PARFAIT
 * @param {string} path - Chemin vers fichier/dossier à analyser
 * @param {object} [options={}] - Options de lecture (encoding, etc.)
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec métadonnées
 * @throws {ValidationError} Si path manquant ou invalide
 * 
 * @example
 * const result = await readPath('./project.json');
 * if (result.success && result.data.exists) {
 *   console.log(result.data.content);
 * }
 */
export async function readPath(path, options = {}) {
  console.log(`[REAL] readPath called with: ${path}`);

  // CALL: Validation séparée pour SRP parfait
  validateReadPathInput(path, options);

  try {
    // Normalisation cross-platform
    const normalizedPath = normalize(path);
    console.log(`[READER] Normalized path: ${normalizedPath}`);

    // Analyse existence et type
    const stats = await stat(normalizedPath);
    console.log(`[READER] File stats: exists=true, isFile=${stats.isFile()}, isDirectory=${stats.isDirectory()}`);

    if (stats.isFile()) {
      // Lecture fichier avec encoding par défaut
      const encoding = options.encoding || "utf8";
      const content = await readFile(normalizedPath, encoding);
      
      console.log(`[READER] File read successfully, size: ${content.length} chars`);
      
      return {
        success: true,
        data: {
          exists: true,
          type: "file",
          content,
          size: content.length,
          encoding: encoding,
          lastAccessed: new Date().toISOString()
        }
      };
      
    } else if (stats.isDirectory()) {
      console.log(`[READER] Path is directory`);
      
      return {
        success: true,
        data: {
          exists: true,
          type: "directory",
          lastAccessed: new Date().toISOString()
        }
      };
      
    } else {
      console.log(`[READER] Path is other type (symlink, etc.)`);
      
      return {
        success: true,
        data: {
          exists: true,
          type: "other",
          lastAccessed: new Date().toISOString()
        }
      };
    }
    
  } catch (error) {
    return handleReadError(error, path);
  }
}

/**
 * Valide les paramètres d'entrée de readPath
 * @private
 * @param {string} path - Chemin à valider
 * @param {object} options - Options à valider
 * @throws {ValidationError} Si paramètres invalides
 */
function validateReadPathInput(path, options) {
  if (!path || typeof path !== "string") {
    throw new Error("ValidationError: path must be non-empty string");
  }
  
  if (path.trim().length === 0) {
    throw new Error("ValidationError: path cannot be empty or whitespace only");
  }
  
  if (options && typeof options !== "object") {
    throw new Error("ValidationError: options must be an object");
  }
}

/**
 * Gestion centralisée et précise des erreurs de lecture
 * @private
 * @param {Error} error - Erreur capturée
 * @param {string} path - Chemin qui a causé l'erreur
 * @returns {{success: boolean, data: object}} Réponse d'erreur formatée
 */
function handleReadError(error, path) {
  console.log(`[READER] Error accessing path: ${error.message} (code: ${error.code})`);
  
  // Gestion granulaire des codes d'erreur filesystem
  switch (error.code) {
    case "ENOENT":
      console.log(`[READER] File does not exist`);
      return {
        success: true,
        data: {
          exists: false,
          errorCode: "ENOENT",
          reason: "File or directory not found"
        }
      };
      
    case "EACCES":
      console.log(`[READER] Permission denied`);
      return {
        success: false,
        error: `Permission denied: ${path}`,
        errorCode: "EACCES"
      };
      
    case "EISDIR":
      console.log(`[READER] Expected file but got directory`);
      return {
        success: false,
        error: `Expected file but path is a directory: ${path}`,
        errorCode: "EISDIR"
      };
      
    case "EMFILE":
    case "ENFILE":
      console.log(`[READER] Too many open files`);
      return {
        success: false,
        error: `System limit: too many open files`,
        errorCode: error.code
      };
      
    default:
      // Erreurs inattendues
      console.log(`[READER] Unexpected error: ${error.message}`);
      return {
        success: false,
        error: `Filesystem error: ${error.message}`,
        errorCode: error.code || "UNKNOWN"
      };
  }
}

/**
 * Utilitaire pour vérifier rapidement l'existence d'un chemin
 * @param {string} path - Chemin à vérifier
 * @returns {Promise<boolean>} true si le chemin existe
 */
export async function pathExists(path) {
  try {
    validateReadPathInput(path, {});
    const result = await readPath(path);
    return result.success && result.data.exists;
  } catch (error) {
    return false;
  }
}

console.log(`[READER] Reader core loaded successfully - PIXEL PERFECT VERSION`);