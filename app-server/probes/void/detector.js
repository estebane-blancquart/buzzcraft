import { readPath } from '../../systems/reader.js';

/*
 * FAIT QUOI : Détecte si un projet est en état VOID (inexistant)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectVoidState(projectPath) {
  console.log(`[STEP2] detectVoidState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  try {
    // Vérifier que project.json n'existe pas
    const projectFile = `${projectPath}/project.json`;
    const fileCheck = await readPath(projectFile);
    
    if (fileCheck.data.exists) {
      // Le projet existe déjà
      return {
        success: true,
        data: {
          state: null, // Pas VOID
          confidence: 0,
          evidence: ['project.json exists'],
          timestamp: new Date().toISOString()
        }
      };
    } else {
      // Le projet n'existe pas = VOID
      return {
        success: true,
        data: {
          state: 'VOID',
          confidence: 100,
          evidence: ['project.json does not exist'],
          timestamp: new Date().toISOString()
        }
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}