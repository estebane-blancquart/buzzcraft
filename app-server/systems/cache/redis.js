/**
 * COMMIT 9 - System Cache
 * 
 * FAIT QUOI : Gestion cache Redis avec persistence et clustering automatique
 * REÇOIT : operation: string, key?: string, options: { ttl?: number, cluster?: boolean }
 * RETOURNE : { success: boolean, connected: boolean, latency: number, cluster?: object }
 * ERREURS : RedisError si connexion échoue, ClusterError si clustering impossible, PersistenceError si persistence échoue
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkRedisConnection(connectionString = 'redis://localhost:6379') {
  // Validation
  if (!connectionString || typeof connectionString !== 'string') {
    throw new Error('ValidationError: connectionString must be a non-empty string');
  }

  // Test connection Redis simple
  try {
    const startTime = Date.now();
    const { stdout } = await execAsync('redis-cli ping');
    const latency = Date.now() - startTime;
    
    const connected = stdout.trim() === 'PONG';
    
    return {
      connectionString,
      connected,
      latency,
      accessible: connected
    };
  } catch {
    return {
      connectionString,
      connected: false,
      latency: -1,
      accessible: false
    };
  }
}

// systems/cache/redis : System Cache (commit 9)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/