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
    const projectFile = join(projectPath, 'project.json');
    console.log(`[BUILT-DETECTOR] Checking project file: ${projectFile}`);
    const projectCheck = await readPath(projectFile);

    if (!projectCheck.data.exists) {
      console.log(`[BUILT-DETECTOR] Project file missing = NOT BUILT`);
      return {
        success: true,
        data: {
          state: null,
          confidence: 0,
          evidence: ['project.json missing'],
          timestamp: new Date().toISOString()
        }
      };
    }

    evidence.push('project.json exists');
    confidence += 20;
    console.log(`[BUILT-DETECTOR] Project file exists`);

    // ✅ FIX: Vérifier code/app-visitor/ au lieu de app-visitor/
    const appVisitorDir = join(projectPath, 'code', 'app-visitor');
    console.log(`[BUILT-DETECTOR] Checking app-visitor: ${appVisitorDir}`);
    const visitorCheck = await readPath(appVisitorDir);

    if (visitorCheck.data.exists && visitorCheck.data.type === 'directory') {
      evidence.push('code/app-visitor directory exists');
      confidence += 30;
      console.log(`[BUILT-DETECTOR] App-visitor found = good for BUILT`);
    } else {
      console.log(`[BUILT-DETECTOR] App-visitor missing = not BUILT`);
    }

    // ✅ FIX: Vérifier code/server/ au lieu de server/
    const serverDir = join(projectPath, 'code', 'server');
    console.log(`[BUILT-DETECTOR] Checking server: ${serverDir}`);
    const serverCheck = await readPath(serverDir);

    if (serverCheck.data.exists && serverCheck.data.type === 'directory') {
      evidence.push('code/server directory exists');
      confidence += 30;
      console.log(`[BUILT-DETECTOR] Server found = good for BUILT`);
    } else {
      console.log(`[BUILT-DETECTOR] Server missing = not BUILT`);
    }

    const isBuilt = confidence >= 80; // 20 + 30 + 30 = 80
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