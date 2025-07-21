/**
 * COMMIT 7 - System Docker
 * 
 * FAIT QUOI : Gestion réseaux Docker avec isolation multi-tenant et sécurité
 * REÇOIT : networkConfig: object, tenantId: string, options: { isolation?: boolean, security?: object }
 * RETOURNE : { networkId: string, isolated: boolean, security: object, endpoints: object[] }
 * ERREURS : NetworkError si création réseau échoue, IsolationError si isolation impossible, SecurityError si configuration sécurité invalide
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkNetworkExists(networkId) {
  // Validation
  if (!networkId || typeof networkId !== 'string') {
    throw new Error('ValidationError: networkId must be a non-empty string');
  }

  // Test existence réseau
  try {
    const { stdout } = await execAsync(`docker network inspect ${networkId}`);
    const networkInfo = JSON.parse(stdout);
    
    return {
      networkId,
      exists: true,
      driver: networkInfo[0]?.Driver || 'unknown'
    };
  } catch {
    return {
      networkId,
      exists: false,
      driver: null
    };
  }
}

// systems/docker/networks : System Docker (commit 7)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/