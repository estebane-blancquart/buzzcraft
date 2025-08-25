import { readPath } from '../cores/reader.js';
import { join } from 'path';

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
    const projectFile = join(projectPath, 'project.json'); // ✅ Cross-platform path join
    console.log(`[DRAFT-DETECTOR] Checking project file: ${projectFile}`);
    const projectCheck = await readPath(projectFile);
    
    // DEBUG: Afficher le résultat complet de readPath
    console.log(`[DRAFT-DETECTOR] DEBUG readPath result:`, JSON.stringify(projectCheck, null, 2));

    if (!projectCheck.success) {
      console.log(`[DRAFT-DETECTOR] Project file read failed: ${projectCheck.error}`);
      return {
        success: false,
        error: projectCheck.error
      };
    }

    if (!projectCheck.data.exists) {
      // Pas de project.json = pas DRAFT
      console.log(`[DRAFT-DETECTOR] Project file does not exist = NOT DRAFT`);
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
    console.log(`[DRAFT-DETECTOR] Project file exists`);

    // Vérifier que ce n'est PAS BUILT (pas de services générés)
    const appVisitorDir = join(projectPath, 'app-visitor'); // ✅ Cross-platform
    console.log(`[DRAFT-DETECTOR] Checking app-visitor: ${appVisitorDir}`);
    const visitorCheck = await readPath(appVisitorDir);

    if (!visitorCheck.data.exists) {
      evidence.push('no app-visitor directory (not built)');
      confidence += 30;
      console.log(`[DRAFT-DETECTOR] No app-visitor = good for DRAFT`);
    } else {
      // Si app-visitor existe, c'est plutôt BUILT
      evidence.push('app-visitor directory exists (possibly built)');
      confidence -= 20;
      console.log(`[DRAFT-DETECTOR] App-visitor exists = possibly BUILT`);
    }

    // Vérifier que ce n'est PAS BUILT (pas de server/)
    const serverDir = join(projectPath, 'server'); // ✅ Cross-platform
    console.log(`[DRAFT-DETECTOR] Checking server: ${serverDir}`);
    const serverCheck = await readPath(serverDir);

    if (!serverCheck.data.exists) {
      evidence.push('no server directory (not built)');
      confidence += 30;
      console.log(`[DRAFT-DETECTOR] No server = good for DRAFT`);
    } else {
      // Si server existe, c'est plutôt BUILT
      evidence.push('server directory exists (possibly built)');
      confidence -= 20;
      console.log(`[DRAFT-DETECTOR] Server exists = possibly BUILT`);
    }

    // DRAFT = project.json existe + pas de build artifacts
    const isDraft = confidence >= 60;
    const finalState = isDraft ? 'DRAFT' : null;
    
    console.log(`[DRAFT-DETECTOR] Final assessment: confidence=${confidence}, state=${finalState}`);

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
    console.log(`[DRAFT-DETECTOR] Unexpected error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}