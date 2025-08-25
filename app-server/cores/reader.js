import { readFile, stat } from "fs/promises";
import { normalize } from "path";

/*
 * FAIT QUOI : Analyse existence et lit contenu d'un chemin - VERSION CORRIGÉE
 * REÇOIT : path: string, options: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si path manquant
 */

export async function readPath(path, options = {}) {
  console.log(`[REAL] readPath called with: ${path}`);

  if (!path || typeof path !== "string") {
    throw new Error("ValidationError: path must be non-empty string");
  }

  try {
    // Normaliser le path pour Windows/Unix compatibility
    const normalizedPath = normalize(path);
    console.log(`[READER] Normalized path: ${normalizedPath}`);

    // Vérifier existence et type
    const stats = await stat(normalizedPath);
    console.log(`[READER] File stats: exists=${true}, isFile=${stats.isFile()}, isDirectory=${stats.isDirectory()}`);

    if (stats.isFile()) {
      const content = await readFile(normalizedPath, "utf8");
      console.log(`[READER] File read successfully, size: ${content.length} chars`);
      return {
        success: true,
        data: {
          exists: true,
          type: "file",
          content,
          size: content.length,
        },
      };
    } else if (stats.isDirectory()) {
      console.log(`[READER] Path is directory`);
      return {
        success: true,
        data: {
          exists: true,
          type: "directory",
        },
      };
    } else {
      console.log(`[READER] Path is other type`);
      return {
        success: true,
        data: {
          exists: true,
          type: "other",
        },
      };
    }
  } catch (error) {
    console.log(`[READER] Error accessing path: ${error.message} (code: ${error.code})`);
    
    if (error.code === "ENOENT") {
      console.log(`[READER] File does not exist`);
      return {
        success: true,
        data: {
          exists: false,
        },
      };
    }

    // Autres erreurs (permissions, etc.)
    console.log(`[READER] Unexpected error: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}