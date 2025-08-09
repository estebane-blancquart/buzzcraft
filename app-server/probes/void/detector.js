/*
 * [MOCK] FAIT QUOI : Détecte si un projet est en état VOID (inexistant/vide)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectVoidState(projectPath) {
  console.log(`[MOCK] detectVoidState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  return {
    success: true,
    data: {
      state: 'VOID',
      confidence: 100,
      evidence: ['[MOCK] Project directory does not exist'],
      timestamp: new Date().toISOString()
    }
  };
}