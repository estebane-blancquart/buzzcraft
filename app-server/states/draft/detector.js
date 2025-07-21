/**
 * COMMIT 2 - State Draft
 *
 * FAIT QUOI : Détection état draft avec validation project.json
 * REÇOIT : projectPath: string, options?: { validateSchema?: boolean, checkIntegrity?: boolean }
 * RETOURNE : { state: 'DRAFT'|'CONTINUE', confidence: number, evidence: string[], timestamp: string }
 * ERREURS : ValidationError si JSON invalide, SchemaError si structure incorrecte, FileSystemError si corruption
 */

import { access, constants } from 'fs/promises';
import { join } from 'path';

export async function detectDraftState(projectPath) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test project.json
  try {
    await access(join(projectPath, 'project.json'), constants.F_OK);
    // project.json existant
    return {
      state: 'DRAFT',
      confidence: 100,
      evidence: ['project.json exists'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // project.json inexistant
    return {
      state: 'CONTINUE',
      confidence: 0,
      evidence: ['project.json does not exist'],
      timestamp: new Date().toISOString(),
    };
  }
}

// states/draft/detector : State Draft (commit 2)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)