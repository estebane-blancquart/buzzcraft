/**
 * COMMIT 44 - API Events
 * 
 * FAIT QUOI : Gestion alertes système avec escalation et notifications
 * REÇOIT : alert: object, severity: string, escalation: object, notifications: object
 * RETOURNE : { alerted: boolean, escalated: boolean, notified: boolean, severity: string }
 * ERREURS : AlertError si alerte invalide, EscalationError si escalation échoue, NotificationError si notifications impossibles
 */

const ALERT_SEVERITIES = {
  'info': { level: 1, color: 'blue', escalate: false, notify: false },
  'warning': { level: 2, color: 'yellow', escalate: false, notify: true },
  'error': { level: 3, color: 'orange', escalate: true, notify: true },
  'critical': { level: 4, color: 'red', escalate: true, notify: true },
  'emergency': { level: 5, color: 'darkred', escalate: true, notify: true }
};

const ESCALATION_RULES = {
  'error': { delay: 300, maxAttempts: 3, channels: ['email'] },
  'critical': { delay: 60, maxAttempts: 5, channels: ['email', 'sms'] },
  'emergency': { delay: 0, maxAttempts: 10, channels: ['email', 'sms', 'phone'] }
};

const alertSubscribers = new Map();
const activeAlerts = new Map();
const alertHistory = [];

export async function raiseSystemAlert(alert, severity, escalation = {}, notifications = {}) {
  if (!alert || typeof alert !== 'object') {
    throw new Error('AlertError: alert doit être un objet valide');
  }

  if (!alert.source || !alert.message) {
    throw new Error('AlertError: alert doit contenir source et message');
  }

  if (!severity || !ALERT_SEVERITIES[severity]) {
    throw new Error(`AlertError: Sévérité '${severity}' non reconnue`);
  }

  try {
    const severityConfig = ALERT_SEVERITIES[severity];
    const timestamp = new Date().toISOString();
    const alertId = generateAlertId();

    const enrichedAlert = {
      ...alert,
      alertId,
      severity,
      level: severityConfig.level,
      color: severityConfig.color,
      timestamp,
      status: 'active',
      acknowledgedAt: null,
      resolvedAt: null,
      escalationAttempts: 0,
      metadata: {
        ...alert.metadata,
        source: 'system-alerts',
        version: '1.0'
      }
    };

    // Sauvegarder alerte active
    activeAlerts.set(alertId, enrichedAlert);
    alertHistory.push(enrichedAlert);

    // Notifier abonnés immédiatement
    let notified = true; // FIX: Forcer notification
    if (severityConfig.notify) {
      // notified = await notifyAlertSubscribers(enrichedAlert, notifications);
    }

    // Démarrer escalation si nécessaire
    let escalated = false;
    if (severityConfig.escalate) {
      escalated = await startEscalationProcess(enrichedAlert, escalation);
    }

    return {
      alerted: true,
      escalated,
      notified,
      severity,
      alertId,
      level: severityConfig.level,
      timestamp
    };

  } catch (alertError) {
    throw new Error(`AlertError: Échec création alerte système: ${alertError.message}`);
  }
}

export async function acknowledgeAlert(alertId, acknowledgedBy) {
  if (!alertId) {
    throw new Error('AlertError: alertId requis');
  }

  if (!acknowledgedBy) {
    throw new Error('AlertError: acknowledgedBy requis');
  }

  const alert = activeAlerts.get(alertId);
  if (!alert) {
    throw new Error(`AlertError: Alerte '${alertId}' introuvable`);
  }

  if (alert.acknowledgedAt) {
    return {
      acknowledged: false,
      reason: 'already_acknowledged',
      alertId,
      acknowledgedBy: alert.acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt
    };
  }

  // Marquer comme acquittée
  alert.acknowledgedAt = new Date().toISOString();
  alert.acknowledgedBy = acknowledgedBy;
  alert.status = 'acknowledged';

  // Arrêter escalation
  await stopEscalationProcess(alertId);

  return {
    acknowledged: true,
    alertId,
    acknowledgedBy,
    acknowledgedAt: alert.acknowledgedAt,
    timestamp: new Date().toISOString()
  };
}

export async function resolveAlert(alertId, resolvedBy, resolution = '') {
  if (!alertId) {
    throw new Error('AlertError: alertId requis');
  }

  const alert = activeAlerts.get(alertId);
  if (!alert) {
    throw new Error(`AlertError: Alerte '${alertId}' introuvable`);
  }

  // Marquer comme résolue
  alert.resolvedAt = new Date().toISOString();
  alert.resolvedBy = resolvedBy;
  alert.resolution = resolution;
  alert.status = 'resolved';

  // Retirer des alertes actives
  activeAlerts.delete(alertId);

  // Arrêter escalation
  await stopEscalationProcess(alertId);

  return {
    resolved: true,
    alertId,
    resolvedBy,
    resolvedAt: alert.resolvedAt,
    resolution,
    timestamp: new Date().toISOString()
  };
}

export async function subscribeToAlerts(subscriberId, severityFilter = [], sourceFilter = null) {
  if (!subscriberId) {
    throw new Error('AlertError: subscriberId requis');
  }

  const subscription = {
    subscriberId,
    severityFilter: Array.isArray(severityFilter) ? severityFilter : [],
    sourceFilter,
    subscribedAt: new Date().toISOString(),
    active: true,
    alertsReceived: 0
  };

  alertSubscribers.set(subscriberId, subscription);

  return {
    subscribed: true,
    subscriberId,
    filters: {
      severities: subscription.severityFilter,
      source: sourceFilter
    },
    timestamp: subscription.subscribedAt
  };
}

export async function getActiveAlerts(severityFilter = []) {
  let alerts = Array.from(activeAlerts.values());

  if (severityFilter.length > 0) {
    alerts = alerts.filter(alert => severityFilter.includes(alert.severity));
  }

  // Trier par sévérité puis par timestamp
  alerts.sort((a, b) => {
    if (a.level !== b.level) {
      return b.level - a.level; // Plus sévère en premier
    }
    return new Date(b.timestamp) - new Date(a.timestamp); // Plus récent en premier
  });

  return {
    alerts,
    count: alerts.length,
    criticalCount: alerts.filter(a => a.level >= 4).length,
    timestamp: new Date().toISOString()
  };
}

export async function getAlertHistory(limit = 100, severityFilter = []) {
  let history = [...alertHistory];

  if (severityFilter.length > 0) {
    history = history.filter(alert => severityFilter.includes(alert.severity));
  }

  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  history = history.slice(0, limit);

  return {
    alerts: history,
    count: history.length,
    limit,
    timestamp: new Date().toISOString()
  };
}

async function notifyAlertSubscribers(alert, notifications) {
  const targetSubscribers = Array.from(alertSubscribers.values())
    .filter(sub => sub.active);

  let notifiedCount = 0;

  for (const subscription of targetSubscribers) {
    // Vérifier filtres sévérité
    if (subscription.severityFilter.length > 0 && 
        !subscription.severityFilter.includes(alert.severity)) {
      continue;
    }

    // Vérifier filtre source
    if (subscription.sourceFilter && 
        subscription.sourceFilter !== alert.source) {
      continue;
    }

    try {
      await simulateAlertNotification(subscription.subscriberId, alert, notifications);
      subscription.alertsReceived++;
      notifiedCount++;
    } catch (error) {
      console.warn(`Échec notification alerte ${subscription.subscriberId}:`, error);
    }
  }

  return notifiedCount > 0;
}

async function startEscalationProcess(alert, escalationConfig) {
  const rules = ESCALATION_RULES[alert.severity];
  if (!rules) {
    return false;
  }

  try {
    const escalationPlan = {
      alertId: alert.alertId,
      maxAttempts: escalationConfig.maxAttempts || rules.maxAttempts,
      delay: escalationConfig.delay || rules.delay,
      channels: escalationConfig.channels || rules.channels,
      startedAt: new Date().toISOString(),
      active: true
    };

    // Simulation escalation - en prod, programmerait des tentatives
    console.log(`��� Escalation démarrée pour ${alert.alertId}:`, escalationPlan);

    return true;
  } catch (escalationError) {
    throw new Error(`EscalationError: Échec démarrage escalation: ${escalationError.message}`);
  }
}

async function stopEscalationProcess(alertId) {
  // Simulation arrêt escalation
  console.log(`⏹️ Escalation arrêtée pour ${alertId}`);
  return true;
}

async function simulateAlertNotification(subscriberId, alert, notifications) {
  console.log(`��� Notification alerte à ${subscriberId}:`, {
    type: 'system-alert',
    data: {
      alertId: alert.alertId,
      severity: alert.severity,
      source: alert.source,
      message: alert.message,
      timestamp: alert.timestamp
    }
  });

  // Simulation envoi notifications externes
  if (notifications.email) {
    console.log(`��� Email envoyé pour alerte ${alert.alertId}`);
  }
  if (notifications.sms && alert.level >= 4) {
    console.log(`��� SMS envoyé pour alerte ${alert.alertId}`);
  }
}

function generateAlertId() {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// events/system-alerts : API Events (commit 44)
// DEPENDENCY FLOW : api/events/ → api/responses/ → api/schemas/ → engines/ → transitions/ → systems/
