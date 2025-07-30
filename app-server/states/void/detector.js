import { readPath } from '../../systems/reader.js';

/*
 * FAIT QUOI : Détecte si un projet est en état VOID (inexistant/vide)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectVoidState(projectPath) {
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  const pathResult = await readPath(projectPath);
  
  if (!pathResult.success) {
    return {
      success: false,
      error: pathResult.error
    };
  }
  
  const isVoid = !pathResult.data.exists;
  
  return {
    success: true,
    data: {
      state: isVoid ? 'VOID' : null,
      confidence: isVoid ? 100 : 0,
      evidence: isVoid ? ['project directory does not exist'] : ['project directory exists'],
      timestamp: new Date().toISOString()
    }
  };
}