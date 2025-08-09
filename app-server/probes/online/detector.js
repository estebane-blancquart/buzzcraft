/*
 * [MOCK] FAIT QUOI : Détecte si un projet est dans l'état ONLINE (containers actifs et accessibles)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath invalide
 */

export async function detectOnlineState(projectPath) {
  console.log(`[MOCK] detectOnlineState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== "string") {
    throw new Error("ValidationError: projectPath must be non-empty string");
  }

  return {
    success: true,
    data: {
      state: "ONLINE",
      confidence: 100,
      evidence: ['[MOCK] containers directory exists', '[MOCK] running state file exists'],
      timestamp: new Date().toISOString(),
    },
  };
}