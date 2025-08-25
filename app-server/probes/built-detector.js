import { readPath } from '../cores/reader.js';

/*
 * FAIT QUOI : Détecte si un projet est en état BUILT (services générés)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectBuiltState(projectPath) {
  console.log(`[STEP] detectBuiltState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  try {
    const evidence = [];
    let confidence = 0;
    
    // Vérifier que project.json existe (base DRAFT)
    const projectFile = `${projectPath}/project.json`;
    const projectCheck = await readPath(projectFile);
    
    if (!projectCheck.data.exists) {
      return {
        success: true,
        data: {
          state: null, // Pas BUILT si pas de project.json
          confidence: 0,
          evidence: ['project.json missing'],
          timestamp: new Date().toISOString()
        }
      };
    }
    
    evidence.push('project.json exists');
    confidence += 20;
    
    // Vérifier app-visitor/ généré
    const appVisitorDir = `${projectPath}/app-visitor`;
    const visitorCheck = await readPath(appVisitorDir);
    
    if (visitorCheck.data.exists && visitorCheck.data.type === 'directory') {
      evidence.push('app-visitor directory exists');
      confidence += 30;
    }
    
    // Vérifier server/ généré  
    const serverDir = `${projectPath}/server`;
    const serverCheck = await readPath(serverDir);
    
    if (serverCheck.data.exists && serverCheck.data.type === 'directory') {
      evidence.push('server directory exists');
      confidence += 30;
    }
    
    // Vérifier app-manager/ généré
    const managerDir = `${projectPath}/app-manager`;
    const managerCheck = await readPath(managerDir);
    
    if (managerCheck.data.exists && managerCheck.data.type === 'directory') {
      evidence.push('app-manager directory exists');
      confidence += 20;
    }
    
    return {
      success: true,
      data: {
        state: confidence >= 80 ? 'BUILT' : null,
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