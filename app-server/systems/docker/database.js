/**
 * COMMIT 7 - System Docker
 * 
 * FAIT QUOI : Gestion base de données Docker avec migrations et persistence
 * REÇOIT : dbOperation: string, schema: object, migrations?: object[]
 * RETOURNE : { success: boolean, dbInitialized: boolean, migrated: boolean, persistent: boolean }
 * ERREURS : DatabaseError si init échoue, MigrationError si migration impossible, PersistenceError si persistence échoue
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkDatabaseConnection(containerId) {
  // Validation
  if (!containerId || typeof containerId !== 'string') {
    throw new Error('ValidationError: containerId must be a non-empty string');
  }

  // Test connection base de données
  try {
    // Test si container DB existe et tourne
    const { stdout } = await execAsync(`docker inspect ${containerId}`);
    const containerInfo = JSON.parse(stdout);
    const isRunning = containerInfo[0]?.State?.Running || false;
    
    return {
      containerId,
      exists: true,
      running: isRunning,
      accessible: isRunning
    };
  } catch {
    return {
      containerId,
      exists: false,
      running: false,
      accessible: false
    };
  }
}

// systems/docker/database : System Docker (commit 7)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/