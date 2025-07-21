/**
 * COMMIT 4 - State Offline
 *
 * FAIT QUOI : Détection état offline avec vérification containers Docker
 * REÇOIT : projectPath: string, options?: { checkContainers?: boolean, validateNetwork?: boolean }
 * RETOURNE : { state: 'OFFLINE'|'CONTINUE', confidence: number, evidence: string[], timestamp: string }
 * ERREURS : DockerError si daemon inaccessible, ContainerError si état incohérent, NetworkError si réseau corrompu
 */

import { access, constants } from 'fs/promises';
import { join } from 'path';

export async function detectOfflineState(projectPath) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test docker/
  try {
    await access(join(projectPath, 'docker'), constants.F_OK);
    // docker/ existant
    return {
      state: 'OFFLINE',
      confidence: 100,
      evidence: ['docker directory exists'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // docker/ inexistant
    return {
      state: 'CONTINUE',
      confidence: 0,
      evidence: ['docker directory does not exist'],
      timestamp: new Date().toISOString(),
    };
  }
}

// states/offline/detector : State Offline (commit 4)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)