/*
 * [MOCK] FAIT QUOI : Détecte si un projet est en état DRAFT (project.json existe)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectDraftState(projectPath) {
  console.log(`[MOCK] detectDraftState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  return {
    success: true,
    data: {
      state: 'DRAFT',
      confidence: 100,
      evidence: ['[MOCK] project.json exists'],
      timestamp: new Date().toISOString()
    }
  };
}