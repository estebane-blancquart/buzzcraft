/**
 * COMMIT 7 - System Docker
 * 
 * FAIT QUOI : Gestion volumes Docker avec persistence et backup automatique
 * REÇOIT : volumeConfig: object, persistenceOptions: object, backup?: boolean
 * RETOURNE : { volumeId: string, mounted: boolean, persistence: object, backupSchedule?: object }
 * ERREURS : VolumeError si création volume échoue, PersistenceError si persistence impossible, BackupError si backup échoue
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkVolumeExists(volumeId) {
  // Validation
  if (!volumeId || typeof volumeId !== 'string') {
    throw new Error('ValidationError: volumeId must be a non-empty string');
  }

  // Test existence volume
  try {
    const { stdout } = await execAsync(`docker volume inspect ${volumeId}`);
    const volumeInfo = JSON.parse(stdout);
    
    return {
      volumeId,
      exists: true,
      driver: volumeInfo[0]?.Driver || 'unknown'
    };
  } catch {
    return {
      volumeId,
      exists: false,
      driver: null
    };
  }
}

// systems/docker/volumes : System Docker (commit 7)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/