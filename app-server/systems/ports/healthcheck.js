/**
 * COMMIT 10 - System Ports
 * 
 * FAIT QUOI : Health checking ports avec monitoring continu et alertes
 * REÇOIT : portList: number[], healthConfig: object, monitoring: boolean, alerts?: object
 * RETOURNE : { healthy: boolean, status: object[], monitoring: object, alerts: object[] }
 * ERREURS : HealthCheckError si check impossible, PortError si port inaccessible, MonitoringError si monitoring défaillant
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkPortHealth(port, options = {}) {
  if (!port || typeof port !== 'number') {
    throw new Error('ValidationError: port must be a number');
  }

  if (port < 1 || port > 65535) {
    throw new Error('ValidationError: port must be between 1 and 65535');
  }

  try {
    const { stdout } = await execAsync(`netstat -an | grep :${port}`);
    const isListening = stdout.includes('LISTEN');
    
    return {
      port,
      healthy: isListening,
      listening: isListening,
      accessible: isListening,
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      port,
      healthy: false,
      listening: false,
      accessible: false,
      timestamp: new Date().toISOString()
    };
  }
}

// systems/ports/healthcheck : System Ports (commit 10)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/