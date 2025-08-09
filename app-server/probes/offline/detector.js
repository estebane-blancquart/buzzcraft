/*
 * [MOCK] FAIT QUOI : Détecte si un projet est dans l'état OFFLINE (containers créés mais arrêtés)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath invalide
 */

export async function detectOfflineState(projectPath) {
  console.log(`[MOCK] detectOfflineState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  return {
    success: true,
    data: {
      state: 'OFFLINE',
      confidence: 100,
      evidence: ['[MOCK] containers directory exists', '[MOCK] no running state file'],
      timestamp: new Date().toISOString()
    }
  };
}