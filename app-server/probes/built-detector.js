import { readPath } from '../cores/reader.js';
import { join } from 'path';

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
    const projectFile = join(projectPath, 'project.json'); // ✅ Cross-platform
    console.log(`[BUILT-DETECTOR] Checking project file: ${projectFile}`);
    const projectCheck = await readPath(projectFile);

    if (!projectCheck.data.exists) {
      console.log(`[BUILT-DETECTOR] Project file missing = NOT BUILT`);
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
    console.log(`[BUILT-DETECTOR] Project file exists`);

    // Vérifier app-visitor/ généré
    const appVisitorDir = join(projectPath, 'app-visitor'); // ✅ Cross-platform
    console.log(`[BUILT-DETECTOR] Checking app-visitor: ${appVisitorDir}`);
    const visitorCheck = await readPath(appVisitorDir);

    if (visitorCheck.data.exists && visitorCheck.data.type === 'directory') {
      evidence.push('app-visitor directory exists');
      confidence += 30;
      console.log(`[BUILT-DETECTOR] App-visitor found = good for BUILT`);
    } else {
      console.log(`[BUILT-DETECTOR] App-visitor missing = not BUILT`);
    }

    // Vérifier server/ généré  
    const serverDir = join(projectPath, 'server'); // ✅ Cross-platform
    console.log(`[BUILT-DETECTOR] Checking server: ${serverDir}`);
    const serverCheck = await readPath(serverDir);

    if (serverCheck.data.exists && serverCheck.data.type === 'directory') {
      evidence.push('server directory exists');
      confidence += 30;
      console.log(`[BUILT-DETECTOR] Server found = good for BUILT`);
    } else {
      console.log(`[BUILT-DETECTOR] Server missing = not BUILT`);
    }

    // Vérifier app-manager/ généré
    const managerDir = join(projectPath, 'app-manager'); // ✅ Cross-platform
    console.log(`[BUILT-DETECTOR] Checking app-manager: ${managerDir}`);
    const managerCheck = await readPath(managerDir);

    if (managerCheck.data.exists && managerCheck.data.type === 'directory') {
      evidence.push('app-manager directory exists');
      confidence += 20;
      console.log(`[BUILT-DETECTOR] App-manager found = good for BUILT`);
    } else {
      console.log(`[BUILT-DETECTOR] App-manager missing`);
    }

    const isBuilt = confidence >= 80;
    const finalState = isBuilt ? 'BUILT' : null;
    
    console.log(`[BUILT-DETECTOR] Final assessment: confidence=${confidence}, state=${finalState}`);

    return {
      success: true,
      data: {
        state: finalState,
        confidence,
        evidence,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.log(`[BUILT-DETECTOR] Unexpected error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}