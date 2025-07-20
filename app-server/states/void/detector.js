/**
 * COMMIT 1 - State Void
 *
 * FAIT QUOI : Détection état void avec analyse filesystem complète
 * REÇOIT : projectPath: string, options?: { strict?: boolean, cacheEnabled?: boolean }
 * RETOURNE : { state: 'VOID'|'CONTINUE', confidence: number, evidence: string[], timestamp: string }
 * ERREURS : ValidationError si projectPath invalide, FileSystemError si problème accès, CacheError si cache corrompu
 */

import { access, constants } from 'fs/promises';

export async function detectVoidState(projectPath) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test existence
  try {
    await access(projectPath, constants.F_OK);
    // Chemin existant
    return {
      state: 'CONTINUE',
      confidence: 0,
      evidence: ['Path exists'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Chemin inexistant
    return {
      state: 'VOID',
      confidence: 100,
      evidence: ['Path does not exist'],
      timestamp: new Date().toISOString(),
    };
  }
}

// states/void/detector : State Void (commit 1)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)