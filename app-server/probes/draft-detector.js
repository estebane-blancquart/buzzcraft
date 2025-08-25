import { readPath } from '../cores/reader.js';

/*
 * FAIT QUOI : Détecte si un projet est en état DRAFT (project.json existe, pas de build)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectDraftState(projectPath) {
  console.log(`[STEP] detectDraftState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  try {
    const evidence = [];
    let confidence = 0;
    
    // Vérifier que project.json existe (condition DRAFT)
    const projectFile = `${projectPath}/project.json`;
    const projectCheck = await readPath(projectFile);
    
    if (!projectCheck.success) {
      return {
        success: false,
        error: projectCheck.error
      };
    }
    
    if (!projectCheck.data.exists) {
      // Pas de project.json = pas DRAFT
      return {
        success: true,
        data: {
          state: null, // Pas DRAFT
          confidence: 0,
          evidence: ['project.json does not exist'],
          timestamp: new Date().toISOString()
        }
      };
    }
    
    evidence.push('project.json exists');
    confidence += 40;
    
    // Vérifier que ce n'est PAS BUILT (pas de services générés)
    const appVisitorDir = `${projectPath}/app-visitor`;
    const visitorCheck = await readPath(appVisitorDir);
    
    if (!visitorCheck.data.exists) {
      evidence.push('no app-visitor directory (not built)');
      confidence += 30;
    } else {
      // Si app-visitor existe, c'est plutôt BUILT
      evidence.push('app-visitor directory exists (possibly built)');
      confidence -= 20;
    }
    
    // Vérifier que ce n'est PAS BUILT (pas de server/)
    const serverDir = `${projectPath}/server`;
    const serverCheck = await readPath(serverDir);
    
    if (!serverCheck.data.exists) {
      evidence.push('no server directory (not built)');
      confidence += 30;
    } else {
      // Si server existe, c'est plutôt BUILT
      evidence.push('server directory exists (possibly built)');
      confidence -= 20;
    }
    
    // DRAFT = project.json existe + pas de build artifacts
    return {
      success: true,
      data: {
        state: confidence >= 60 ? 'DRAFT' : null,
        confidence,
        evidence,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}