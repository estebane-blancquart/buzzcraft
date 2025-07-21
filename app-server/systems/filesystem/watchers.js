/**
 * COMMIT 6 - System Filesystem
 * 
 * FAIT QUOI : Surveillance filesystem avec debouncing intelligent et filtrage
 * REÇOIT : projectPath: string, callback: function, options: { debounce?: number, ignored?: string[] }
 * RETOURNE : { watcherId: string, stop: function, watchedPaths: string[], active: boolean }
 * ERREURS : WatcherError si système notification indisponible, CallbackError si fonction invalide, PathError si chemin inaccessible
 */

import { access } from 'fs/promises';

export async function validateWatchPath(projectPath) {
  // Validation
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be a non-empty string');
  }

  // Test existence chemin
  try {
    await access(projectPath);
    return {
      path: projectPath,
      exists: true,
      watchable: true
    };
  } catch {
    return {
      path: projectPath,
      exists: false,
      watchable: false
    };
  }
}

// systems/filesystem/watchers : System Filesystem (commit 6)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/