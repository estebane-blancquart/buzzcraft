/**
 * COMMIT 55 - App Client Services
 * 
 * FAIT QUOI : Service synchronisation pour cohérence données avec modes sync
 * REÇOIT : mode: string, config?: object, options?: object
 * RETOURNE : { sync: object, mode: string, status: string, timestamp: string }
 * ERREURS : SyncError si mode invalide, ConflictError si conflit résolution
 */

export async function createSync(mode = 'manual', config = {}, options = {}) {
  if (!mode || typeof mode !== 'string') {
    throw new Error('SyncError: Mode de synchronisation requis');
  }

  const supportedModes = ['manual', 'auto', 'realtime', 'offline'];
  if (!supportedModes.includes(mode)) {
    throw new Error(`SyncError: Mode ${mode} non supporté`);
  }

  const sync = {
    mode,
    config: {
      interval: config.interval || 30000, // 30s par défaut
      retryAttempts: config.retryAttempts || 3,
      conflictResolution: config.conflictResolution || 'server-wins',
      ...config
    },
    state: { 
      lastSync: null, 
      pending: [],
      conflicts: [] 
    },
    options,
    created: true,
    timestamp: new Date().toISOString()
  };

  return {
    sync,
    mode,
    config: sync.config,
    status: 'created',
    metadata: { mode, interval: sync.config.interval },
    timestamp: new Date().toISOString()
  };
}

export async function validateSync(syncConfig) {
  if (!syncConfig || !syncConfig.mode) {
    return {
      valid: false,
      errors: ['Mode de synchronisation manquant'],
      warnings: [],
      timestamp: new Date().toISOString()
    };
  }

  const errors = [];
  const warnings = [];

  // Validation mode
  const supportedModes = ['manual', 'auto', 'realtime', 'offline'];
  if (!supportedModes.includes(syncConfig.mode)) {
    errors.push(`Mode ${syncConfig.mode} non supporté`);
  }

  // Validation intervalle
  if (syncConfig.config?.interval && syncConfig.config.interval < 5000) {
    warnings.push('Intervalle très court (<5s)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    mode: syncConfig.mode,
    timestamp: new Date().toISOString()
  };
}

export async function updateSyncConfig(syncConfig, newConfig) {
  if (!syncConfig) {
    throw new Error('SyncError: Configuration sync requise');
  }

  const updated = {
    ...syncConfig,
    config: { ...syncConfig.config, ...newConfig },
    updated: true,
    timestamp: new Date().toISOString()
  };

  return {
    updated: true,
    sync: updated,
    changes: Object.keys(newConfig),
    previousConfig: syncConfig.config,
    timestamp: new Date().toISOString()
  };
}

export async function getSyncStatus(syncConfig) {
  const status = syncConfig && syncConfig.created ? 'healthy' : 'missing';
  
  return {
    status,
    configured: !!syncConfig,
    mode: syncConfig?.mode || 'unknown',
    pending: syncConfig?.state?.pending?.length || 0,
    conflicts: syncConfig?.state?.conflicts?.length || 0,
    timestamp: new Date().toISOString()
  };
}

// services/sync : App Client Services (commit 55)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
