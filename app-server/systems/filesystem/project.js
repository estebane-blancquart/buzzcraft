/**
 * COMMIT 6 - System Filesystem
 * 
 * FAIT QUOI : Gestion projets filesystem avec ID uniques et validation collision
 * REÇOIT : baseName: string, options: { suffix?: string, maxLength?: number, reserved?: string[] }
 * RETOURNE : { projectId: string, isUnique: boolean, suggestions?: string[], metadata: object }
 * ERREURS : ValidationError si baseName invalide, CollisionError si tous IDs pris, LengthError si contraintes nom
 */

import { access } from 'fs/promises';
import { join } from 'path';

export async function checkProjectExists(projectId) {
  // Validation
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be a non-empty string');
  }

  const projectPath = join('./projects', projectId);

  // Test existence
  try {
    await access(projectPath);
    return {
      projectId,
      exists: true,
      path: projectPath
    };
  } catch {
    return {
      projectId,
      exists: false,
      path: projectPath
    };
  }
}

// systems/filesystem/project : System Filesystem (commit 6)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/