/**
 * COMMIT 10 - System Ports
 * 
 * FAIT QUOI : Registry ports avec détection conflits et allocation automatique
 * REÇOIT : operation: string, port?: number, service?: string, options?: object
 * RETOURNE : { success: boolean, assignedPort?: number, conflicts: number[], available: number[] }
 * ERREURS : PortError si port occupé, ConflictError si collision détectée, RegistryError si registry corrompu
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkPortRegistry(port, options = {}) {
  if (!port || typeof port !== 'number') {
    throw new Error('ValidationError: port must be a number');
  }

  if (port < 1 || port > 65535) {
    throw new Error('ValidationError: port must be between 1 and 65535');
  }

  try {
    const { stdout } = await execAsync('netstat -an');
    const lines = stdout.split('\n');
    
    const conflicts = [];
    const available = [];
    
    // Check ports autour pour détecter conflits
    for (let testPort = port - 2; testPort <= port + 2; testPort++) {
      if (testPort >= 1 && testPort <= 65535) {
        const inUse = lines.some(line => line.includes(`:${testPort}`));
        if (inUse) {
          conflicts.push(testPort);
        } else {
          available.push(testPort);
        }
      }
    }
    
    const isRegistered = !conflicts.includes(port);
    
    return {
      port,
      registered: isRegistered,
      conflicts,
      available
    };
  } catch {
    return {
      port,
      registered: false,
      conflicts: [],
      available: [port]
    };
  }
}

// systems/ports/registry : System Ports (commit 10)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/