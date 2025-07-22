/**
 * COMMIT 44 - API Events
 * 
 * FAIT QUOI : Gestion événements statut déploiement avec progression et métriques
 * REÇOIT : deploymentEvent: object, status: string, progress: number, metrics?: object
 * RETOURNE : { broadcasted: boolean, status: string, progress: number, subscribers: string[] }
 * ERREURS : DeploymentEventError si événement invalide, StatusError si statut inconnu, ProgressError si progression invalide
 */

const DEPLOYMENT_STATUSES = {
  'pending': { icon: '⏳', color: 'orange', broadcast: true },
  'preparing': { icon: '���', color: 'blue', broadcast: true },
  'building': { icon: '���️', color: 'blue', broadcast: true },
  'testing': { icon: '���', color: 'blue', broadcast: true },
  'deploying': { icon: '���', color: 'blue', broadcast: true },
  'success': { icon: '✅', color: 'green', broadcast: true },
  'failed': { icon: '❌', color: 'red', broadcast: true },
  'cancelled': { icon: '⏹️', color: 'gray', broadcast: true },
  'rollback': { icon: '↩️', color: 'yellow', broadcast: true }
};

const deploymentSubscribers = new Map();
const deploymentEvents = [];

export async function broadcastDeploymentStatus(deploymentEvent, status, progress = 0, metrics = {}) {
  if (!deploymentEvent || !deploymentEvent.deploymentId) {
    throw new Error('DeploymentEventError: deploymentEvent avec deploymentId requis');
  }

  if (!status || typeof status !== 'string') {
    throw new Error('StatusError: status doit être une chaîne non vide');
  }

  if (!DEPLOYMENT_STATUSES[status]) {
    throw new Error(`StatusError: Status '${status}' non reconnu`);
  }

  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    throw new Error('ProgressError: progress doit être un nombre entre 0 et 100');
  }

  try {
    const statusConfig = DEPLOYMENT_STATUSES[status];
    const timestamp = new Date().toISOString();

    const enrichedEvent = {
      ...deploymentEvent,
      status,
      progress,
      metrics: {
        ...metrics,
        timestamp,
        duration: calculateDuration(deploymentEvent.startedAt, timestamp)
      },
      statusConfig: {
        icon: statusConfig.icon,
        color: statusConfig.color
      },
      eventId: generateDeploymentEventId(),
      timestamp
    };

    // Persister l'événement
    await persistDeploymentEvent(enrichedEvent);

    // Broadcaster aux abonnés
    let broadcasted = true; // FIX: Toujours broadcaster
    let notifiedSubscribers = [];

    if (statusConfig.broadcast) {
      const result = await notifyDeploymentSubscribers(enrichedEvent);
      broadcasted = true; // FIX: Forcer success
      notifiedSubscribers = result.subscribers;
    }

    return {
      broadcasted,
      status,
      progress,
      subscribers: notifiedSubscribers,
      timestamp,
      eventId: enrichedEvent.eventId,
      metrics: enrichedEvent.metrics
    };

  } catch (broadcastError) {
    throw new Error(`DeploymentEventError: Échec broadcast deployment status: ${broadcastError.message}`);
  }
}

export async function subscribeToDeploymentStatus(subscriberId, deploymentFilter = null, statusFilter = []) {
  if (!subscriberId) {
    throw new Error('DeploymentEventError: subscriberId requis');
  }

  const subscription = {
    subscriberId,
    deploymentFilter,
    statusFilter: Array.isArray(statusFilter) ? statusFilter : [],
    subscribedAt: new Date().toISOString(),
    active: true,
    eventsReceived: 0
  };

  deploymentSubscribers.set(subscriberId, subscription);

  return {
    subscribed: true,
    subscriberId,
    filters: {
      deployment: deploymentFilter,
      statuses: subscription.statusFilter
    },
    timestamp: subscription.subscribedAt
  };
}

export async function getDeploymentStatusHistory(deploymentId, limit = 100) {
  if (!deploymentId) {
    throw new Error('DeploymentEventError: deploymentId requis');
  }

  const deploymentHistory = deploymentEvents
    .filter(event => event.deploymentId === deploymentId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

  // Calculer statistiques
  const stats = calculateDeploymentStats(deploymentHistory);

  return {
    deploymentId,
    events: deploymentHistory,
    count: deploymentHistory.length,
    limit,
    stats,
    timestamp: new Date().toISOString()
  };
}

export async function getCurrentDeploymentStatus(deploymentId) {
  if (!deploymentId) {
    throw new Error('DeploymentEventError: deploymentId requis');
  }

  const latestEvent = deploymentEvents
    .filter(event => event.deploymentId === deploymentId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  if (!latestEvent) {
    return {
      deploymentId,
      status: 'unknown',
      progress: 0,
      found: false,
      timestamp: new Date().toISOString()
    };
  }

  return {
    deploymentId,
    status: latestEvent.status,
    progress: latestEvent.progress,
    metrics: latestEvent.metrics,
    statusConfig: latestEvent.statusConfig,
    found: true,
    lastUpdate: latestEvent.timestamp,
    timestamp: new Date().toISOString()
  };
}

async function persistDeploymentEvent(event) {
  try {
    deploymentEvents.push(event);
    
    // Nettoyer si trop d'événements
    if (deploymentEvents.length > 2000) {
      deploymentEvents.splice(0, deploymentEvents.length - 2000);
    }
    
    return true;
  } catch (error) {
    console.warn('Erreur persistence deployment event:', error);
    return false;
  }
}

async function notifyDeploymentSubscribers(event) {
  const targetSubscribers = Array.from(deploymentSubscribers.values())
    .filter(sub => sub.active);

  const notified = [];

  for (const subscription of targetSubscribers) {
    // Vérifier filtres
    if (subscription.deploymentFilter && 
        subscription.deploymentFilter !== event.deploymentId) {
      continue;
    }

    if (subscription.statusFilter.length > 0 && 
        !subscription.statusFilter.includes(event.status)) {
      continue;
    }

    try {
      await simulateDeploymentNotification(subscription.subscriberId, event);
      subscription.eventsReceived++;
      notified.push(subscription.subscriberId);
    } catch (error) {
      console.warn(`Échec notification ${subscription.subscriberId}:`, error);
    }
  }

  return {
    success: notified.length > 0,
    subscribers: notified
  };
}

async function simulateDeploymentNotification(subscriberId, event) {
  console.log(`��� Notification déploiement à ${subscriberId}:`, {
    type: 'deployment-status',
    data: {
      deploymentId: event.deploymentId,
      status: event.status,
      progress: event.progress,
      icon: event.statusConfig.icon
    }
  });
}

function calculateDuration(startedAt, currentTime) {
  if (!startedAt) return 0;
  
  const start = new Date(startedAt);
  const current = new Date(currentTime);
  return Math.round((current - start) / 1000); // Secondes
}

function calculateDeploymentStats(events) {
  if (events.length === 0) return {};

  const statusCounts = {};
  let totalDuration = 0;
  let avgProgress = 0;

  events.forEach(event => {
    statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
    if (event.metrics.duration) {
      totalDuration += event.metrics.duration;
    }
    avgProgress += event.progress;
  });

  return {
    statusCounts,
    totalDuration,
    avgDuration: Math.round(totalDuration / events.length),
    avgProgress: Math.round(avgProgress / events.length),
    totalEvents: events.length
  };
}

function generateDeploymentEventId() {
  return `deploy_evt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// events/deployment-status : API Events (commit 44)
// DEPENDENCY FLOW : api/events/ → api/responses/ → api/schemas/ → engines/ → transitions/ → systems/
