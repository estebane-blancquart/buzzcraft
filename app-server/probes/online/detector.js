/*
 * FAIT QUOI : Détecte si un projet est dans l'état ONLINE (containers actifs et accessibles)
 * REÇOIT : projectPath (string) - chemin vers le projet
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath invalide
 */

import { readPath } from "../../systems/reader.js";

export async function detectOnlineState(projectPath) {
  if (!projectPath || typeof projectPath !== "string") {
    throw new Error("ValidationError: projectPath must be non-empty string");
  }

  try {
    const evidence = [];
    let confidence = 0;

    // Check containers directory exists
    const containersDir = await readPath(`${projectPath}/containers`);
    if (containersDir.data.exists) {
      evidence.push("containers directory exists");
      confidence += 40;
    }

    // Check running state file exists
    const runningFile = await readPath(`${projectPath}/containers/.running`);
    if (runningFile.data.exists) {
      evidence.push("running state file exists");
      confidence += 60;
    }

    return {
      success: true,
      data: {
        state: confidence >= 80 ? "ONLINE" : null,
        confidence,
        evidence,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
