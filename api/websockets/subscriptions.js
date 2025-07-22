/**
 * COMMIT 45 - API WebSockets
 * 
 * FAIT QUOI : Gestion abonnements WebSocket avec filtres avancés et notifications
 * REÇOIT : subscription: object, connectionId: string, filters?: object, options?: object
 * RETOURNE : { subscribed: boolean, subscriptionId: string, filters: object, notifications: boolean }
 * ERREURS : SubscriptionError si abonnement invalide, FilterError si filtres incorrects, NotificationError si notifications impossibles
 */

const subscriptions = new Map();
const subscriptionsByConnection = new Map();
const subscriptionStats = {
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  totalNotifications: 0,
  averageFilters: 0
};

// Types d'abonnements supportés
const SUBSCRIPTION_TYPES = {
  'project-events': {
    filters: ['projectId', 'eventType', 'userId'],
    maxFilters: 5,
    rateLimited: false
  },
  'deployment-status': {
    filters: ['deploymentId', 'projectId', 'status'],
    maxFilters: 3,
    rateLimited: false
  },
  'system-alerts': {
    filters: ['severity', 'source', 'category'],
    maxFilters: 4,
    rateLimited: true
  },
  'user-notifications': {
    filters: ['userId', 'type', 'priority'],
    maxFilters: 3,
    rateLimited: false
  },
  'chat-messages': {
    filters: ['channelId', 'userId', 'messageType'],
    maxFilters: 2,
    rateLimited: true
  }
};

export async function createSubscription(subscriptionType, connectionId, filters = {}, options = {}) {
  if (!subscriptionType || !SUBSCRIPTION_TYPES[subscriptionType]) {
    throw new Error(`SubscriptionError: Type '${subscriptionType}' non supporté`);
  }

  if (!connectionId || typeof connectionId !== 'string') {
    throw new Error('SubscriptionError: connectionId doit être une chaîne non vide');
  }

  try {
    const typeConfig = SUBSCRIPTION_TYPES[subscriptionType];
    const subscriptionId = generateSubscriptionId();
    const timestamp = new Date().toISOString();

    // Valider filtres
    const validatedFilters = await validateSubscriptionFilters(filters, typeConfig);

    // Vérifier limite filtres
    if (Object.keys(validatedFilters).length > typeConfig.maxFilters) {
      throw new Error(`FilterError: Trop de filtres (max ${typeConfig.maxFilters})`);
    }

    // Créer subscription
    const subscription = {
      id: subscriptionId,
      type: subscriptionType,
      connectionId,
      filters: validatedFilters,
      active: true,
      createdAt: timestamp,
      lastNotification: null,
      notificationCount: 0,
      options: {
        bufferSize: options.bufferSize || 100,
        batchNotifications: options.batchNotifications || false,
        priority: options.priority || 'normal'
      }
    };

    // Sauvegarder subscription
    subscriptions.set(subscriptionId, subscription);

    // Indexer par connexion
    if (!subscriptionsByConnection.has(connectionId)) {
      subscriptionsByConnection.set(connectionId, new Set());
    }
    subscriptionsByConnection.get(connectionId).add(subscriptionId);

    // Mettre à jour statistiques
    subscriptionStats.totalSubscriptions++;
    subscriptionStats.activeSubscriptions++;
    subscriptionStats.averageFilters = 
      (subscriptionStats.averageFilters + Object.keys(validatedFilters).length) / 2;

    return {
      subscribed: true,
      subscriptionId,
      type: subscriptionType,
      filters: validatedFilters,
      notifications: true,
      timestamp
    };

  } catch (subscriptionError) {
    throw new Error(`SubscriptionError: Erreur création abonnement: ${subscriptionError.message}`);
  }
}

export async function removeSubscription(subscriptionId) {
  if (!subscriptionId || !subscriptions.has(subscriptionId)) {
    return {
      removed: false,
      reason: 'subscription_not_found'
    };
  }

  try {
    const subscription = subscriptions.get(subscriptionId);
    const connectionId = subscription.connectionId;

    // Retirer des index
    subscriptions.delete(subscriptionId);
    
    if (subscriptionsByConnection.has(connectionId)) {
      subscriptionsByConnection.get(connectionId).delete(subscriptionId);
      
      // Nettoyer si plus d'abonnements pour cette connexion
      if (subscriptionsByConnection.get(connectionId).size === 0) {
        subscriptionsByConnection.delete(connectionId);
      }
    }

    // Mettre à jour statistiques
    subscriptionStats.activeSubscriptions--;

    return {
      removed: true,
      subscriptionId,
      type: subscription.type,
      notificationCount: subscription.notificationCount,
      duration: Date.now() - new Date(subscription.createdAt),
      timestamp: new Date().toISOString()
    };

  } catch (removeError) {
    throw new Error(`SubscriptionError: Erreur suppression abonnement: ${removeError.message}`);
  }
}

export async function updateSubscriptionFilters(subscriptionId, newFilters = {}) {
  if (!subscriptionId || !subscriptions.has(subscriptionId)) {
    throw new Error('SubscriptionError: Abonnement introuvable');
  }

  try {
    const subscription = subscriptions.get(subscriptionId);
    const typeConfig = SUBSCRIPTION_TYPES[subscription.type];

    // Valider nouveaux filtres
    const validatedFilters = await validateSubscriptionFilters(newFilters, typeConfig);

    if (Object.keys(validatedFilters).length > typeConfig.maxFilters) {
      throw new Error(`FilterError: Trop de filtres (max ${typeConfig.maxFilters})`);
    }

    // Mettre à jour filtres
    subscription.filters = validatedFilters;
    subscription.lastUpdate = new Date().toISOString();

    return {
      updated: true,
      subscriptionId,
      filters: validatedFilters,
      timestamp: subscription.lastUpdate
    };

  } catch (updateError) {
    throw new Error(`SubscriptionError: Erreur mise à jour filtres: ${updateError.message}`);
  }
}

export async function notifySubscriptions(event, eventData = {}) {
  if (!event || typeof event !== 'object') {
    throw new Error('SubscriptionError: event doit être un objet valide');
  }

  if (!event.type || !event.source) {
    throw new Error('SubscriptionError: event doit contenir type et source');
  }

  try {
    const matchingSubscriptions = await findMatchingSubscriptions(event, eventData);
    const notifications = [];

    for (const subscription of matchingSubscriptions) {
      try {
        const notification = await createNotification(subscription, event, eventData);
        const delivered = await deliverNotification(subscription, notification);

        if (delivered) {
          subscription.notificationCount++;
          subscription.lastNotification = new Date().toISOString();
          notifications.push({
            subscriptionId: subscription.id,
            delivered: true,
            notification
          });
        }

      } catch (notificationError) {
        console.warn(`Erreur notification ${subscription.id}:`, notificationError.message);
        notifications.push({
          subscriptionId: subscription.id,
          delivered: false,
          error: notificationError.message
        });
      }
    }

    // Mettre à jour statistiques
    subscriptionStats.totalNotifications += notifications.filter(n => n.delivered).length;

    return {
      notified: true,
      matchingSubscriptions: matchingSubscriptions.length,
      delivered: notifications.filter(n => n.delivered).length,
      failed: notifications.filter(n => !n.delivered).length,
      notifications,
      timestamp: new Date().toISOString()
    };

  } catch (notifyError) {
    throw new Error(`NotificationError: Erreur notification abonnements: ${notifyError.message}`);
  }
}

export async function getConnectionSubscriptions(connectionId) {
  if (!connectionId) {
    throw new Error('SubscriptionError: connectionId requis');
  }

  const connectionSubs = subscriptionsByConnection.get(connectionId);
  if (!connectionSubs) {
    return {
      connectionId,
      subscriptions: [],
      count: 0,
      timestamp: new Date().toISOString()
    };
  }

  const subscriptionList = Array.from(connectionSubs)
    .map(subId => subscriptions.get(subId))
    .filter(sub => sub); // Filtrer les abonnements supprimés

  return {
    connectionId,
    subscriptions: subscriptionList.map(sub => ({
      id: sub.id,
      type: sub.type,
      filters: sub.filters,
      active: sub.active,
      notificationCount: sub.notificationCount,
      createdAt: sub.createdAt
    })),
    count: subscriptionList.length,
    timestamp: new Date().toISOString()
  };
}

export async function removeConnectionSubscriptions(connectionId) {
  if (!connectionId) {
    throw new Error('SubscriptionError: connectionId requis');
  }

  const connectionSubs = subscriptionsByConnection.get(connectionId);
  if (!connectionSubs) {
    return {
      removed: 0,
      connectionId,
      timestamp: new Date().toISOString()
    };
  }

  let removedCount = 0;

  for (const subscriptionId of connectionSubs) {
    if (subscriptions.has(subscriptionId)) {
      subscriptions.delete(subscriptionId);
      removedCount++;
      subscriptionStats.activeSubscriptions--;
    }
  }

  subscriptionsByConnection.delete(connectionId);

  return {
    removed: removedCount,
    connectionId,
    timestamp: new Date().toISOString()
  };
}

export async function getSubscriptionStats() {
  const activeByType = {};
  const notificationsByType = {};

  for (const subscription of subscriptions.values()) {
    const type = subscription.type;
    activeByType[type] = (activeByType[type] || 0) + 1;
    notificationsByType[type] = (notificationsByType[type] || 0) + subscription.notificationCount;
  }

  return {
    ...subscriptionStats,
    activeByType,
    notificationsByType,
    connections: subscriptionsByConnection.size,
    timestamp: new Date().toISOString()
  };
}

async function validateSubscriptionFilters(filters, typeConfig) {
  const validatedFilters = {};

  for (const [key, value] of Object.entries(filters)) {
    if (!typeConfig.filters.includes(key)) {
      throw new Error(`FilterError: Filtre '${key}' non supporté pour ce type d'abonnement`);
    }

    if (value === null || value === undefined || value === '') {
      continue; // Ignorer les valeurs vides
    }

    validatedFilters[key] = value;
  }

  return validatedFilters;
}

async function findMatchingSubscriptions(event, eventData) {
  const matching = [];

  for (const subscription of subscriptions.values()) {
    if (!subscription.active) continue;

    // Vérifier type d'événement
    if (!isEventTypeMatch(event.type, subscription.type)) {
      continue;
    }

    // Vérifier filtres
    if (await matchesFilters(event, eventData, subscription.filters)) {
      matching.push(subscription);
    }
  }

  return matching;
}

function isEventTypeMatch(eventType, subscriptionType) {
  const eventMappings = {
    'project-state-change': 'project-events',
    'project-created': 'project-events',
    'project-updated': 'project-events',
    'deployment-started': 'deployment-status',
    'deployment-completed': 'deployment-status',
    'deployment-failed': 'deployment-status',
    'system-alert': 'system-alerts',
    'user-notification': 'user-notifications',
    'chat-message': 'chat-messages'
  };

  return eventMappings[eventType] === subscriptionType;
}

async function matchesFilters(event, eventData, filters) {
  for (const [filterKey, filterValue] of Object.entries(filters)) {
    const eventValue = eventData[filterKey] || event[filterKey];
    
    if (!eventValue) continue;

    // Support pour filtres avec wildcards
    if (typeof filterValue === 'string' && filterValue.includes('*')) {
      const regex = new RegExp(filterValue.replace(/\*/g, '.*'));
      if (!regex.test(eventValue)) {
        return false;
      }
    } else if (Array.isArray(filterValue)) {
      if (!filterValue.includes(eventValue)) {
        return false;
      }
    } else if (filterValue !== eventValue) {
      return false;
    }
  }

  return true;
}

async function createNotification(subscription, event, eventData) {
  const notification = {
    notificationId: generateNotificationId(),
    subscriptionId: subscription.id,
    event: {
      type: event.type,
      source: event.source,
      timestamp: event.timestamp || new Date().toISOString(),
      data: eventData
    },
    priority: subscription.options.priority,
    createdAt: new Date().toISOString()
  };

  return notification;
}

async function deliverNotification(subscription, notification) {
  try {
    // Simulation livraison - en prod, utiliserait connexion WebSocket réelle
    console.log(`��� Notification à ${subscription.connectionId}:`, {
      type: 'subscription-notification',
      subscriptionId: subscription.id,
      event: notification.event
    });

    return true;
  } catch (deliveryError) {
    console.warn(`Échec livraison notification ${notification.notificationId}:`, deliveryError);
    return false;
  }
}

function generateSubscriptionId() {
  return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

function generateNotificationId() {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// websockets/subscriptions : API WebSockets (commit 45)
// DEPENDENCY FLOW : api/websockets/ → api/events/ → api/responses/ → api/schemas/ → engines/
