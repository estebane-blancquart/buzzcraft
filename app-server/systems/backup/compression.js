/**
 * COMMIT 12 - System Backup
 * 
 * FAIT QUOI : Analyse et vérification des capacités de compression pour backups
 * REÇOIT : compressionType: string, options: { level?: number, estimate?: boolean }
 * RETOURNE : { type: string, supported: boolean, ratio: number, performance: object, accessible: boolean }
 * ERREURS : ValidationError si compressionType invalide, CompressionError si type non supporté
 */

export function checkCompressionSupport(compressionType, options = {}) {
  // Validation OBLIGATOIRE (toujours ValidationError)
  if (!compressionType || typeof compressionType !== 'string') {
    throw new Error('ValidationError: compressionType must be a non-empty string');
  }
  
  if (typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }

  // Validation types supportés
  const supportedTypes = ['gzip', 'bzip2', 'lz4', 'zstd', 'none'];
  if (!supportedTypes.includes(compressionType.toLowerCase())) {
    throw new Error('ValidationError: compressionType must be one of: ' + supportedTypes.join(', '));
  }

  // Logique minimale avec try/catch
  try {
    const level = options.level || 6;
    const estimate = options.estimate !== false;
    const type = compressionType.toLowerCase();
    
    // Test compression simple (simulation capacités système)
    const compressionMap = {
      'gzip': { ratio: 0.3, speed: 'medium', cpu: 'low' },
      'bzip2': { ratio: 0.25, speed: 'slow', cpu: 'high' },
      'lz4': { ratio: 0.4, speed: 'fast', cpu: 'very-low' },
      'zstd': { ratio: 0.28, speed: 'fast', cpu: 'medium' },
      'none': { ratio: 1.0, speed: 'instant', cpu: 'none' }
    };
    
    const config = compressionMap[type];
    const isSupported = !!config;
    
    // Ajustement ratio selon level (simulation)
    const adjustedRatio = type !== 'none' ? 
      config.ratio * (1 - (level - 6) * 0.02) : 1.0;
    
    return {
      type: compressionType,
      supported: isSupported,
      ratio: Math.max(0.1, adjustedRatio),
      performance: {
        speed: config?.speed || 'unknown',
        cpuUsage: config?.cpu || 'unknown',
        level
      },
      accessible: true,
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      type: compressionType,
      supported: false,
      ratio: 0,
      performance: {
        speed: 'unknown',
        cpuUsage: 'unknown',
        level: 0
      },
      accessible: false,
      timestamp: new Date().toISOString()
    };
  }
}

// systems/backup/compression : System Backup (commit 12)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
