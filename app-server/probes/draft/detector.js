import { readPath } from '../../systems/reader.js';

/*
 * FAIT QUOI : Détecte si un projet est en état DRAFT (project.json existe)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectDraftState(projectPath) {
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  const projectJsonPath = `${projectPath}/project.json`;
  const jsonResult = await readPath(projectJsonPath);
  
  if (!jsonResult.success) {
    return {
      success: false,
      error: jsonResult.error
    };
  }
  
  const isDraft = jsonResult.data.exists && jsonResult.data.type === 'file';
  
  return {
    success: true,
    data: {
      state: isDraft ? 'DRAFT' : null,
      confidence: isDraft ? 100 : 0,
      evidence: isDraft ? ['project.json exists'] : ['project.json missing'],
      timestamp: new Date().toISOString()
    }
  };
}