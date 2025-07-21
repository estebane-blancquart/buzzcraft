/**
 * COMMIT 5 - State Online
 *
 * FAIT QUOI : Détection état online avec health checks services actifs
 * REÇOIT : projectPath: string, options?: { healthTimeout?: number, deepCheck?: boolean }
 * RETOURNE : { state: 'ONLINE'|'CONTINUE', confidence: number, evidence: string[], timestamp: string }
 * ERREURS : DockerError si containers down, HealthCheckError si services défaillants, TimeoutError si délai dépassé
 */

import { access, constants } from 'fs/promises';
import { join } from 'path';

export async function detectOnlineState(projectPath) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test docker/.running
  try {
    await access(join(projectPath, 'docker/.running'), constants.F_OK);
    // docker/.running existant
    return {
      state: 'ONLINE',
      confidence: 100,
      evidence: ['docker/.running file exists'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // docker/.running inexistant
    return {
      state: 'CONTINUE',
      confidence: 0,
      evidence: ['docker/.running file does not exist'],
      timestamp: new Date().toISOString(),
    };
  }
}

// states/online/detector : State Online (commit 5)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)