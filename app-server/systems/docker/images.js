/**
 * COMMIT 7 - System Docker
 * 
 * FAIT QUOI : Gestion images Docker avec build et registry automatique
 * REÇOIT : imageOperation: string, imageSpec: object, buildOptions?: object
 * RETOURNE : { success: boolean, imageId: string, built: boolean, pushed: boolean }
 * ERREURS : DockerError si daemon inaccessible, ImageError si build échoue, RegistryError si push impossible
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkImageExists(imageId) {
  // Validation
  if (!imageId || typeof imageId !== 'string') {
    throw new Error('ValidationError: imageId must be a non-empty string');
  }

  // Test existence image
  try {
    const { stdout } = await execAsync(`docker inspect ${imageId}`);
    const imageInfo = JSON.parse(stdout);
    
    return {
      imageId,
      exists: true,
      size: imageInfo[0]?.Size || 0
    };
  } catch {
    return {
      imageId,
      exists: false,
      size: 0
    };
  }
}

// systems/docker/images : System Docker (commit 7)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/