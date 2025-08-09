/*
 * [MOCK] FAIT QUOI : Détecte si un projet est en état BUILT (services générés)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectBuiltState(projectPath) {
  console.log(`[MOCK] detectBuiltState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== "string") {
    throw new Error("ValidationError: projectPath must be non-empty string");
  }

  return {
    success: true,
    data: {
      state: "BUILT",
      confidence: 100,
      evidence: ['[MOCK] app-visitor directory exists'],
      timestamp: new Date().toISOString(),
    },
  };
}