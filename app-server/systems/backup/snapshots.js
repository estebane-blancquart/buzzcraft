/**
 * COMMIT 12 - System Backup
 * 
 * FAIT QUOI : Gestion et vérification des snapshots de données et fichiers
 * REÇOIT : snapshotPath: string, options: { validate?: boolean, metadata?: boolean }
 * RETOURNE : { path: string, exists: boolean, size: number, timestamp: string, accessible: boolean }
 * ERREURS : ValidationError si snapshotPath invalide, SnapshotError si fichier corrompu
 */

import { existsSync, statSync } from 'fs';
import { access } from 'fs/promises';

export async function checkSnapshotStatus(snapshotPath, options = {}) {
  // Validation OBLIGATOIRE (toujours ValidationError)
  if (!snapshotPath || typeof snapshotPath !== 'string') {
    throw new Error('ValidationError: snapshotPath must be a non-empty string');
  }
  
  if (typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }

  // Validation format path
  if (snapshotPath.includes('..') || snapshotPath.includes('//')) {
    throw new Error('ValidationError: snapshotPath cannot contain .. or //');
  }

  // Logique minimale avec try/catch
  try {
    const validate = options.validate !== false;
    const includeMetadata = options.metadata !== false;
    
    // Test snapshot simple (existence + taille)
    const exists = existsSync(snapshotPath);
    
    if (exists) {
      await access(snapshotPath); // Test accessibilité
      const stats = statSync(snapshotPath);
      const isValid = validate ? stats.size > 0 && stats.isFile() : true;
      
      return {
        path: snapshotPath,
        exists: true,
        size: stats.size,
        timestamp: stats.mtime.toISOString(),
        accessible: true,
        valid: isValid,
        metadata: includeMetadata ? {
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          type: stats.isFile() ? 'file' : 'directory'
        } : undefined
      };
    }
    
    return {
      path: snapshotPath,
      exists: false,
      size: 0,
      timestamp: new Date().toISOString(),
      accessible: false,
      valid: false,
      metadata: undefined
    };
  } catch {
    return {
      path: snapshotPath,
      exists: false,
      size: 0,
      timestamp: new Date().toISOString(),
      accessible: false,
      valid: false,
      metadata: undefined
    };
  }
}

// systems/backup/snapshots : System Backup (commit 12)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
