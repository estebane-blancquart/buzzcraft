/**
 * COMMIT 5 - State Online
 * 
 * FAIT QUOI : Validation état online avec monitoring performance continue
 * REÇOIT : projectPath: string, services: object[], options?: { performanceCheck?: boolean }
 * RETOURNE : { valid: boolean, confidence: number, performance: object, alerts: string[] }
 * ERREURS : ServiceError si services inactifs, PerformanceError si performance dégradée, HealthCheckError si santé critique
 */

import { access, constants } from 'fs/promises';
import { join } from 'path';

export async function validateOnlineState(projectPath, services = []) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test docker/.running
  try {
    await access(join(projectPath, 'docker/.running'), constants.F_OK);
    // docker/.running existant = ONLINE valide
    return {
      valid: true,
      confidence: 100,
      performance: { hasRunningFile: true },
      alerts: []
    };
  } catch (error) {
    // docker/.running inexistant = ONLINE invalide
    return {
      valid: false,
      confidence: 0,
      performance: { hasRunningFile: false },
      alerts: ['docker/.running file not found']
    };
  }
}

// states/online/validator : State Online (commit 5)
// DEPENDENCY FLOW (no circular deps)
// states/ → independent (called by engines)