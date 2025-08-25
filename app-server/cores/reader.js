import { readFile, stat } from "fs/promises";

/*
 * FAIT QUOI : Analyse existence et lit contenu d'un chemin
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
    // Vérifier existence et type
    const stats = await stat(path);

    if (stats.isFile()) {
      const content = await readFile(path, "utf8");
      return {
        success: true,
        data: {
          exists: true,
          type: "file",
          content,
        },
      };
    } else if (stats.isDirectory()) {
      return {
        success: true,
        data: {
          exists: true,
          type: "directory",
        },
      };
    } else {
      return {
        success: true,
        data: {
          exists: true,
          type: "other",
        },
      };
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        success: true,
        data: {
          exists: false,
        },
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
}
