/**
 * COMMIT 49 - API Monitoring
 * 
 * FAIT QUOI : Monitoring progress builds avec tracking temps réel et notifications
 * REÇOIT : buildId: string, progress: number, status: string, options?: object
 * RETOURNE : { tracked: boolean, progress: number, status: string, estimatedTime: number }
 * ERREURS : TrackingError si tracking échoue, ProgressError si progress invalide, StatusError si status incorrect
 */

const BUILD_STATUSES = ['pending', 'starting', 'running', 'completed', 'failed', 'cancelled'];
const PROGRESS_TRACKING = new Map();
const BUILD_METRICS = new Map();

export async function trackBuildProgress(buildId, progress, status = 'running', options = {}) {
  if (!buildId || typeof buildId !== 'string') {
    throw new Error('TrackingError: buildId requis');
  }

  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    throw new Error('ProgressError: progress doit être entre 0 et 100');
  }

  if (!BUILD_STATUSES.includes(status)) {
    throw new Error(`StatusError: status doit être ${BUILD_STATUSES.join(', ')}`);
  }

  try {
    const now = Date.now();
    const tracking = PROGRESS_TRACKING.get(buildId) || {
      startedAt: now,
      updates: []
    };

    tracking.updates.push({
      progress,
      status,
      timestamp: now
    });

    PROGRESS_TRACKING.set(buildId, tracking);

    const estimatedTime = calculateEstimatedTime(tracking, progress);

    return {
      tracked: true,
      buildId,
      progress,
      status,
      estimatedTime: estimatedTime || 0,
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`TrackingError: ${error.message}`);
  }
}

export async function getBuildMetrics(buildId, includeHistory = false) {
  if (!buildId || typeof buildId !== 'string') {
    throw new Error('TrackingError: buildId requis');
  }

  try {
    const tracking = PROGRESS_TRACKING.get(buildId);
    const metrics = BUILD_METRICS.get(buildId) || {};

    if (!tracking) {
      return {
        found: false,
        buildId,
        metrics: null,
        retrievedAt: new Date().toISOString()
      };
    }

    const currentProgress = tracking.updates[tracking.updates.length - 1];
    const duration = Date.now() - tracking.startedAt;

    return {
      found: true,
      buildId,
      currentProgress: currentProgress.progress,
      status: currentProgress.status,
      duration,
      totalUpdates: tracking.updates.length,
      history: includeHistory ? tracking.updates : undefined,
      retrievedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`TrackingError: ${error.message}`);
  }
}

export async function notifyBuildComplete(buildId, finalStatus = 'completed', metadata = {}) {
  if (!buildId || typeof buildId !== 'string') {
    throw new Error('TrackingError: buildId requis');
  }

  if (!['completed', 'failed', 'cancelled'].includes(finalStatus)) {
    throw new Error('StatusError: finalStatus doit être completed, failed ou cancelled');
  }

  try {
    const tracking = PROGRESS_TRACKING.get(buildId);
    if (!tracking) {
      throw new Error(`TrackingError: Build ${buildId} non trouvé`);
    }

    const completedAt = Date.now();
    const totalDuration = completedAt - tracking.startedAt;

    // Mise à jour finale
    tracking.updates.push({
      progress: finalStatus === 'completed' ? 100 : tracking.updates[tracking.updates.length - 1].progress,
      status: finalStatus,
      timestamp: completedAt
    });

    // Archiver metrics
    BUILD_METRICS.set(buildId, {
      totalDuration,
      finalStatus,
      totalUpdates: tracking.updates.length,
      completedAt: new Date().toISOString(),
      metadata
    });

    return {
      notified: true,
      buildId,
      finalStatus,
      totalDuration,
      completedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`TrackingError: ${error.message}`);
  }
}

export async function cleanupOldBuilds(maxAge = 24 * 60 * 60 * 1000, options = {}) {
  try {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [buildId, tracking] of PROGRESS_TRACKING.entries()) {
      const age = now - tracking.startedAt;
      if (age > maxAge) {
        PROGRESS_TRACKING.delete(buildId);
        BUILD_METRICS.delete(buildId);
        cleanedCount++;
      }
    }

    return {
      cleaned: true,
      removedBuilds: cleanedCount,
      maxAge,
      cleanedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`TrackingError: ${error.message}`);
  }
}

// Helper functions
function calculateEstimatedTime(tracking, currentProgress) {
  if (currentProgress === 0 || tracking.updates.length < 2) {
    return null;
  }

  const now = Date.now();
  const elapsed = now - tracking.startedAt;
  const progressRate = currentProgress / elapsed;
  const remainingProgress = 100 - currentProgress;

  return Math.round(remainingProgress / progressRate);
}

// monitoring/build-progress : API Monitoring (commit 49)
// DEPENDENCY FLOW : api/monitoring/ → api/schemas/ → engines/ → transitions/ → systems/
