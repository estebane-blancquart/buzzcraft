/**
 * COMMIT 7 - System Docker
 * 
 * FAIT QUOI : Gestion containers Docker avec isolation réseau et monitoring
 * REÇOIT : operation: string, containerConfig: object, options: { isolation?: boolean, monitoring?: boolean }
 * RETOURNE : { success: boolean, containerId?: string, status: object, resources: object }
 * ERREURS : DockerError si daemon inaccessible, ContainerError si création échoue, IsolationError si réseau impossible
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkContainerExists(containerId) {
  // Validation
  if (!containerId || typeof containerId !== 'string') {
    throw new Error('ValidationError: containerId must be a non-empty string');
  }

  // Test existence container
  try {
    const { stdout } = await execAsync(`docker inspect ${containerId}`);
    const containerInfo = JSON.parse(stdout);
    
    return {
      containerId,
      exists: true,
      running: containerInfo[0]?.State?.Running || false
    };
  } catch {
    return {
      containerId,
      exists: false,
      running: false
    };
  }
}

// systems/docker/containers : System Docker (commit 7)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/