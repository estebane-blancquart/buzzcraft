/**
 * COMMIT 44 - API Events
 * 
 * FAIT QUOI : Gestion événements progression avec métriques et estimation
 * REÇOIT : progress: object, operation: string, metrics?: object, estimation?: object
 * RETOURNE : { tracked: boolean, metrics: object, estimation: object, completion: number }
 * ERREURS : ProgressError si données progression invalides, MetricsError si métriques corrompues, EstimationError si estimation impossible
 */

const PROGRESS_OPERATIONS = {
  'build': { weight: 1.0, estimatedDuration: 300, stages: ['prepare', 'compile', 'bundle', 'optimize'] },
  'deploy': { weight: 0.8, estimatedDuration: 180, stages: ['upload', 'configure', 'start', 'verify'] },
  'test': { weight: 0.6, estimatedDuration: 120, stages: ['setup', 'unit', 'integration', 'cleanup'] },
  'backup': { weight: 0.4, estimatedDuration: 60, stages: ['scan', 'compress', 'upload', 'verify'] },
  'migrate': { weight: 1.2, estimatedDuration: 240, stages: ['analyze', 'prepare', 'execute', 'validate'] }
};

const progressTrackers = new Map();
const progressSubscribers = new Map();

export async function trackProgress(progress, operation, metrics = {}, estimation = {}) {
  if (!progress || typeof progress !== 'object') {
    throw new Error('ProgressError: progress doit être un objet valide');
  }

  if (!progress.operationId || typeof progress.completion !== 'number') {
    throw new Error('ProgressError: progress doit contenir operationId et completion');
  }

  if (progress.completion < 0 || progress.completion > 100) {
    throw new Error('ProgressError: completion doit être entre 0 et 100');
  }

  if (!operation || !PROGRESS_OPERATIONS[operation]) {
    throw new Error(`ProgressError: Opération '${operation}' non supportée`);
  }

  try {
    const timestamp = new Date().toISOString();
    const operationConfig = PROGRESS_OPERATIONS[operation];

    // Calculer métriques enrichies
    const enrichedMetrics = await calculateProgressMetrics(progress, metrics, operationConfig);

    // Calculer estimation
    const progressEstimation = await calculateProgressEstimation(progress, estimation, operationConfig, enrichedMetrics);

    // Créer tracker complet
    const progressTracker = {
      operationId: progress.operationId,
      operation,
      completion: progress.completion,
      stage: progress.stage || operationConfig.stages[0],
      startedAt: progress.startedAt || timestamp,
      lastUpdate: timestamp,
      metrics: enrichedMetrics,
      estimation: progressEstimation,
      status: determineProgressStatus(progress.completion),
      weight: operationConfig.weight
    };

    // Sauvegarder tracker
    progressTrackers.set(progress.operationId, progressTracker);

    // Notifier abonnés
    await notifyProgressSubscribers(progressTracker);

    return {
      tracked: true,
      metrics: enrichedMetrics,
      estimation: progressEstimation,
      completion: progress.completion,
      status: progressTracker.status,
      timestamp
    };

  } catch (trackingError) {
    throw new Error(`ProgressError: Échec tracking progression: ${trackingError.message}`);
  }
}

export async function subscribeToProgress(subscriberId, operationFilter = null, completionThreshold = 0) {
  if (!subscriberId) {
    throw new Error('ProgressError: subscriberId requis');
  }

  if (typeof completionThreshold !== 'number' || completionThreshold < 0 || completionThreshold > 100) {
    throw new Error('ProgressError: completionThreshold doit être entre 0 et 100');
  }

  const subscription = {
    subscriberId,
    operationFilter,
    completionThreshold,
    subscribedAt: new Date().toISOString(),
    active: true,
    notificationsReceived: 0
  };

  progressSubscribers.set(subscriberId, subscription);

  return {
    subscribed: true,
    subscriberId,
    filters: {
      operation: operationFilter,
      completionThreshold
    },
    timestamp: subscription.subscribedAt
  };
}

export async function getProgressStatus(operationId) {
  if (!operationId) {
    throw new Error('ProgressError: operationId requis');
  }

  const tracker = progressTrackers.get(operationId);

  if (!tracker) {
    return {
      operationId,
      found: false,
      timestamp: new Date().toISOString()
    };
  }

  return {
    operationId,
    found: true,
    operation: tracker.operation,
    completion: tracker.completion,
    stage: tracker.stage,
    status: tracker.status,
    metrics: tracker.metrics,
    estimation: tracker.estimation,
    startedAt: tracker.startedAt,
    lastUpdate: tracker.lastUpdate,
    timestamp: new Date().toISOString()
  };
}

export async function getActiveOperations() {
  const activeOps = Array.from(progressTrackers.values())
    .filter(tracker => tracker.completion < 100)
    .sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));

  return {
    operations: activeOps,
    count: activeOps.length,
    timestamp: new Date().toISOString()
  };
}

async function calculateProgressMetrics(progress, userMetrics, operationConfig) {
  try {
    const currentTime = new Date();
    const startTime = new Date(progress.startedAt || currentTime);
    const elapsedSeconds = Math.max(0, (currentTime - startTime) / 1000);

    const baseMetrics = {
      elapsedTime: Math.round(elapsedSeconds),
      rate: progress.completion > 0 ? (progress.completion / elapsedSeconds) : 0,
      weight: operationConfig.weight,
      ...userMetrics
    };

    // Métriques spécialisées par opération
    if (progress.bytesProcessed && progress.totalBytes) {
      baseMetrics.throughput = progress.bytesProcessed / Math.max(1, elapsedSeconds);
      baseMetrics.remainingBytes = progress.totalBytes - progress.bytesProcessed;
    }

    if (progress.itemsProcessed && progress.totalItems) {
      baseMetrics.itemsPerSecond = progress.itemsProcessed / Math.max(1, elapsedSeconds);
      baseMetrics.remainingItems = progress.totalItems - progress.itemsProcessed;
    }

    return baseMetrics;

  } catch (metricsError) {
    throw new Error(`MetricsError: Erreur calcul métriques: ${metricsError.message}`);
  }
}

async function calculateProgressEstimation(progress, userEstimation, operationConfig, metrics) {
  try {
    const baseEstimation = {
      ...userEstimation
    };

    // Estimation temps restant basée sur taux actuel
    if (metrics.rate > 0 && progress.completion < 100) {
      const remainingCompletion = 100 - progress.completion;
      baseEstimation.remainingTime = Math.round(remainingCompletion / metrics.rate);
    }

    // Estimation basée sur configuration opération
    if (!baseEstimation.remainingTime && operationConfig.estimatedDuration) {
      const estimatedTotal = operationConfig.estimatedDuration * operationConfig.weight;
      const elapsedRatio = progress.completion / 100;
      baseEstimation.remainingTime = Math.round(estimatedTotal * (1 - elapsedRatio));
    }

    // ETA (Estimated Time of Arrival)
    if (baseEstimation.remainingTime) {
      const eta = new Date(Date.now() + (baseEstimation.remainingTime * 1000));
      baseEstimation.eta = eta.toISOString();
    }

    return baseEstimation;

  } catch (estimationError) {
    throw new Error(`EstimationError: Erreur calcul estimation: ${estimationError.message}`);
  }
}

function determineProgressStatus(completion) {
  if (completion === 0) return "pending";
  if (completion < 25) return "starting";
  if (completion < 85) return "running";  // FIX: 75% = running
  if (completion < 100) return "finishing";
  return "completed";
}

async function notifyProgressSubscribers(tracker) {
  const targetSubscribers = Array.from(progressSubscribers.values())
    .filter(sub => sub.active);

  for (const subscription of targetSubscribers) {
    // Vérifier filtres
    if (subscription.operationFilter && 
        subscription.operationFilter !== tracker.operation) {
      continue;
    }

    if (tracker.completion < subscription.completionThreshold) {
      continue;
    }

    try {
      await simulateProgressNotification(subscription.subscriberId, tracker);
      subscription.notificationsReceived++;
    } catch (error) {
      console.warn(`Échec notification progress ${subscription.subscriberId}:`, error);
    }
  }
}

async function simulateProgressNotification(subscriberId, tracker) {
  console.log(`��� Notification progression à ${subscriberId}:`, {
    type: 'progress-update',
    data: {
      operationId: tracker.operationId,
      operation: tracker.operation,
      completion: tracker.completion,
      stage: tracker.stage,
      eta: tracker.estimation.eta
    }
  });
}

// events/progress : API Events (commit 44)
// DEPENDENCY FLOW : api/events/ → api/responses/ → api/schemas/ → engines/ → transitions/ → systems/
