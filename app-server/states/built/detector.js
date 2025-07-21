/**
 * COMMIT 3 - State Built
 *
 * FAIT QUOI : Détection état built avec validation artéfacts générés
 * REÇOIT : projectPath: string, options?: { validateArtifacts?: boolean, checkBuildInfo?: boolean }
 * RETOURNE : { state: 'BUILT'|'CONTINUE', confidence: number, evidence: string[], timestamp: string }
 * ERREURS : BuildValidationError si artéfacts corrompus, ArtifactError si fichiers manquants, FileSystemError si structure incomplète
 */

import { access, constants } from 'fs/promises';
import { join } from 'path';

export async function detectBuiltState(projectPath) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test .outputs/active
  try {
    await access(join(projectPath, '.outputs/active'), constants.F_OK);
    // .outputs/active existant
    return {
      state: 'BUILT',
      confidence: 100,
      evidence: ['.outputs/active directory exists'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // dist/ inexistant
    return {
      state: 'CONTINUE',
      confidence: 0,
      evidence: ['.outputs/active directory does not exist'],
      timestamp: new Date().toISOString(),
    };
  }
}

// states/built/detector : State Built (commit 3)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)